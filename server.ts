import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { OAuth2Client } from 'google-auth-library';
import ee from '@google/earthengine';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// --- Service Account Authentication (Global) ---
let isGlobalGEEInitialized = false;

if (process.env.GEE_SERVICE_ACCOUNT_EMAIL && process.env.GEE_PRIVATE_KEY) {
  console.log('Initializing Earth Engine with Service Account...');
  
  let privateKey = process.env.GEE_PRIVATE_KEY;
  // Remove surrounding quotes if the user accidentally copied them
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1);
  }
  // Convert literal \n strings into actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');
  
  ee.data.authenticateViaPrivateKey(
    {
      client_email: process.env.GEE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey
    },
    () => {
      ee.initialize(null, null, () => {
        console.log('Earth Engine globally initialized via Service Account.');
        isGlobalGEEInitialized = true;
      }, (err: any) => {
        console.error('Earth Engine Initialization Error:', err);
      });
    },
    (err: any) => {
      console.error('Earth Engine Authentication Error:', err);
    }
  );
}

// --- User OAuth Authentication (Fallback) ---
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

const SCOPES = [
  'https://www.googleapis.com/auth/earthengine',
  'https://www.googleapis.com/auth/userinfo.email'
];

const getDynamicRedirectUri = (req: express.Request) => {
  // Use x-forwarded-proto if available (for cloud deployments), otherwise check if localhost for http, else default to https
  let protocol = req.headers['x-forwarded-proto'] as string;
  if (!protocol) {
    protocol = req.hostname === 'localhost' ? 'http' : 'https';
  }
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${protocol}://${host}/auth/callback`;
};

// OAuth Routes
app.get('/api/auth/url', (req, res) => {
  const redirectUri = getDynamicRedirectUri(req);
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    redirect_uri: redirectUri
  });
  res.json({ url });
});

app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code } = req.query;
  const redirectUri = getDynamicRedirectUri(req);
  
  try {
    const { tokens } = await oauth2Client.getToken({
      code: code as string,
      redirect_uri: redirectUri
    });
    
    res.cookie('gee_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth Error:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/api/auth/status', (req, res) => {
  // If globally initialized via Service Account, everyone is "authenticated"
  if (isGlobalGEEInitialized) {
    return res.json({ isAuthenticated: true, type: 'service_account' });
  }
  const tokens = req.cookies.gee_tokens;
  res.json({ isAuthenticated: !!tokens, type: 'user_oauth' });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('gee_tokens');
  res.json({ success: true });
});

// GEE Analysis Endpoint
app.post('/api/analyze', async (req, res) => {
  const { aoi, dateRange, cloudCover } = req.body;
  
  // Check auth
  if (!isGlobalGEEInitialized) {
    const tokens = req.cookies.gee_tokens;
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated with Google Earth Engine' });
    }

    try {
      const parsedTokens = JSON.parse(tokens);
      await new Promise<void>((resolve, reject) => {
        ee.data.setAuthToken(
          null,
          'Bearer',
          parsedTokens.access_token,
          3600,
          [],
          () => resolve(),
          false
        );
      });

      await new Promise<void>((resolve, reject) => {
        ee.initialize(null, null, () => resolve(), (err: any) => reject(err));
      });
    } catch (err) {
      return res.status(401).json({ error: 'Failed to initialize Earth Engine with user tokens' });
    }
  }

  try {
    // Perform Water Quality Analysis
    const region = ee.Geometry(aoi.geometry);

    const s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(region)
      .filterDate(dateRange.start, dateRange.end)
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloudCover));

    const waterQualityCol = s2.map((img: any) => {
      const ndti = img.normalizedDifference(['B4', 'B3']).rename('turbidity');
      const ndci = img.normalizedDifference(['B5', 'B4']).rename('chlorophyll');
      const ndwi = img.normalizedDifference(['B3', 'B8']);
      const waterArea = ndwi.gt(0).multiply(ee.Image.pixelArea()).rename('surfaceArea');
      return img.addBands([ndti, ndci, waterArea]).select(['turbidity', 'chlorophyll', 'surfaceArea']).set('date', img.date().format('YYYY-MM-dd'));
    });

    const timeSeries = waterQualityCol.map((img: any) => {
      const meanStats = img.select(['turbidity', 'chlorophyll']).reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: region,
        scale: 20,
        maxPixels: 1e9
      });
      const areaStats = img.select(['surfaceArea']).reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: region,
        scale: 20,
        maxPixels: 1e9
      });
      return ee.Feature(null, {
        date: img.get('date'),
        turbidity: meanStats.get('turbidity'),
        chlorophyll: meanStats.get('chlorophyll'),
        surfaceArea: areaStats.get('surfaceArea')
      });
    });

    const results = await new Promise<any>((resolve, reject) => {
      timeSeries.getInfo((data: any, err: any) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const formattedData = results.features
      .filter((f: any) => f.properties.turbidity !== null && f.properties.chlorophyll !== null)
      .map((f: any) => {
        const tVal = f.properties.turbidity;
        const cVal = f.properties.chlorophyll;
        const sVal = f.properties.surfaceArea;
        
        const scaledTurbidity = Number(((tVal + 1) * 50).toFixed(2));
        const scaledChlorophyll = Number(((cVal + 1) * 50).toFixed(2));
        const surfaceAreaHa = sVal ? Number((sVal / 10000).toFixed(2)) : 0; // Convert sq meters to hectares
        
        let tStatus = 'Clear';
        if (scaledTurbidity > 60) tStatus = 'Very Turbid';
        else if (scaledTurbidity > 40) tStatus = 'Turbid';
        else if (scaledTurbidity > 20) tStatus = 'Moderate';

        let cStatus = 'Low';
        if (scaledChlorophyll > 60) cStatus = 'High';
        else if (scaledChlorophyll > 45) cStatus = 'Moderate';

        return {
          date: f.properties.date,
          turbidity: scaledTurbidity,
          chlorophyll: scaledChlorophyll,
          surfaceArea: surfaceAreaHa,
          turbidityStatus: tStatus,
          chlorophyllStatus: cStatus,
          anomaly: scaledTurbidity > 70 || scaledChlorophyll > 70
        };
      });

    res.json(formattedData);

  } catch (error) {
    console.error('GEE Analysis Error:', error);
    res.status(500).json({ error: 'Analysis failed', details: error instanceof Error ? error.message : String(error) });
  }
});

// GEE Map Layer Endpoint
app.post('/api/map-layer', async (req, res) => {
  const { aoi, dateRange, cloudCover, layerType } = req.body;
  
  // Check auth
  if (!isGlobalGEEInitialized) {
    const tokens = req.cookies.gee_tokens;
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated with Google Earth Engine' });
    }

    try {
      const parsedTokens = JSON.parse(tokens);
      await new Promise<void>((resolve, reject) => {
        ee.data.setAuthToken(
          null,
          'Bearer',
          parsedTokens.access_token,
          3600,
          [],
          () => resolve(),
          false
        );
      });

      await new Promise<void>((resolve, reject) => {
        ee.initialize(null, null, () => resolve(), (err: any) => reject(err));
      });
    } catch (err) {
      return res.status(401).json({ error: 'Failed to initialize Earth Engine with user tokens' });
    }
  }

  try {
    const region = ee.Geometry(aoi.geometry);

    const s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(region)
      .filterDate(dateRange.start, dateRange.end)
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloudCover));

    let indexImg, visParams;

    if (layerType === 'chlorophyll') {
      indexImg = s2.map((img: any) => {
        return img.normalizedDifference(['B5', 'B4']).rename('chlorophyll');
      }).median().clip(region);

      visParams = {
        min: -0.1,
        max: 0.3,
        palette: ['0000ff', '00ffff', '00ff00', 'ffff00', 'ff0000']
      };
    } else {
      indexImg = s2.map((img: any) => {
        return img.normalizedDifference(['B4', 'B3']).rename('turbidity');
      }).median().clip(region);

      visParams = {
        min: -0.1,
        max: 0.3,
        palette: [
          '000080', '0000d9', '4000ff', '8000ff', '0080ff', '00ffff', 
          '00ff80', '80ff00', 'daff00', 'ffff00', 'fff500', 'ffda00', 
          'ffb000', 'ffa400', 'ff4f00', 'ff2500', 'ff0a00', 'ff00ff'
        ]
      };
    }

    const mapInfo = await new Promise<any>((resolve, reject) => {
      indexImg.getMap(visParams, (mapInfo: any, err: any) => {
        if (err) reject(err);
        else resolve(mapInfo);
      });
    });

    res.json({ urlFormat: mapInfo.urlFormat });

  } catch (error) {
    console.error('GEE Map Layer Error:', error);
    res.status(500).json({ error: 'Map layer generation failed', details: error instanceof Error ? error.message : String(error) });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

