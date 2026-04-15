from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import ee
import json
import os

app = FastAPI()

# Enable CORS so the React/JS frontend can communicate with this Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Earth Engine using a Service Account
# In production, set the GEE_SERVICE_ACCOUNT_EMAIL and GEE_PRIVATE_KEY environment variables
try:
    service_account = os.environ.get("GEE_SERVICE_ACCOUNT_EMAIL")
    private_key = os.environ.get("GEE_PRIVATE_KEY")
    
    if service_account and private_key:
        # Format the private key correctly (replace literal \n with actual newlines)
        private_key = private_key.replace('\\n', '\n')
        credentials = ee.ServiceAccountCredentials(service_account, key_data=private_key)
        ee.Initialize(credentials)
        print("Earth Engine Initialized Successfully.")
    else:
        print("Warning: GEE credentials not found in environment. Please authenticate manually.")
except Exception as e:
    print(f"Failed to initialize Earth Engine: {e}")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Python Earth Engine Backend is running!"}

@app.post("/api/analyze")
async def analyze_water_quality(request: Request):
    data = await request.json()
    aoi = data.get('aoi')
    date_range = data.get('dateRange')
    cloud_cover = data.get('cloudCover', 20)
    
    if not aoi or not date_range:
        raise HTTPException(status_code=400, detail="Missing AOI or dateRange")
        
    try:
        region = ee.Geometry(aoi['geometry'])
        
        # Fetch Sentinel-2 Surface Reflectance Data
        s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
            .filterBounds(region) \
            .filterDate(date_range['start'], date_range['end']) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloud_cover))
            
        def calculate_indices(img):
            # NDTI (Turbidity) = (Red - Green) / (Red + Green)
            ndti = img.normalizedDifference(['B4', 'B3']).rename('turbidity')
            # NDCI (Chlorophyll) = (Red Edge 1 - Red) / (Red Edge 1 + Red)
            ndci = img.normalizedDifference(['B5', 'B4']).rename('chlorophyll')
            # NDWI (Water Index) = (Green - NIR) / (Green + NIR)
            ndwi = img.normalizedDifference(['B3', 'B8'])
            water_area = ndwi.gt(0).multiply(ee.Image.pixelArea()).rename('surfaceArea')
            
            return img.addBands([ndti, ndci, water_area]) \
                      .select(['turbidity', 'chlorophyll', 'surfaceArea']) \
                      .set('date', img.date().format('YYYY-MM-dd'))
            
        water_quality_col = s2.map(calculate_indices)
        
        def reduce_region(img):
            mean_stats = img.select(['turbidity', 'chlorophyll']).reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=region,
                scale=20,
                maxPixels=1e9
            )
            area_stats = img.select(['surfaceArea']).reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=region,
                scale=20,
                maxPixels=1e9
            )
            return ee.Feature(None, {
                'date': img.get('date'),
                'turbidity': mean_stats.get('turbidity'),
                'chlorophyll': mean_stats.get('chlorophyll'),
                'surfaceArea': area_stats.get('surfaceArea')
            })
            
        time_series = water_quality_col.map(reduce_region)
        
        # Execute the computation on Google's servers and pull the results to Python
        results = time_series.getInfo()
        
        formatted_data = []
        for f in results.get('features', []):
            props = f.get('properties', {})
            
            if props.get('turbidity') is not None and props.get('chlorophyll') is not None:
                t_val = props['turbidity']
                c_val = props['chlorophyll']
                s_val = props.get('surfaceArea', 0)
                
                # Scale indices to 0-100 range
                scaled_t = round((t_val + 1) * 50, 2)
                scaled_c = round((c_val + 1) * 50, 2)
                surface_area_ha = round(s_val / 10000, 2) if s_val else 0
                
                # Determine Turbidity Status
                t_status = 'Clear'
                if scaled_t > 60: t_status = 'Very Turbid'
                elif scaled_t > 40: t_status = 'Turbid'
                elif scaled_t > 20: t_status = 'Moderate'
                
                # Determine Chlorophyll Status
                c_status = 'Low'
                if scaled_c > 60: c_status = 'High'
                elif scaled_c > 45: c_status = 'Moderate'
                
                formatted_data.append({
                    'date': props['date'],
                    'turbidity': scaled_t,
                    'chlorophyll': scaled_c,
                    'surfaceArea': surface_area_ha,
                    'turbidityStatus': t_status,
                    'chlorophyllStatus': c_status,
                    'anomaly': scaled_t > 70 or scaled_c > 70
                })
                
        return formatted_data
        
    except Exception as e:
        print(f"GEE Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/map-layer")
async def get_map_layer(request: Request):
    data = await request.json()
    aoi = data.get('aoi')
    date_range = data.get('dateRange')
    cloud_cover = data.get('cloudCover', 20)
    layer_type = data.get('layerType', 'turbidity')
    
    try:
        region = ee.Geometry(aoi['geometry'])
        s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
            .filterBounds(region) \
            .filterDate(date_range['start'], date_range['end']) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloud_cover))

        if layer_type == 'chlorophyll':
            index_img = s2.map(lambda img: img.normalizedDifference(['B5', 'B4']).rename('chlorophyll')) \
                          .median().clip(region)
            vis_params = {
                'min': -0.1,
                'max': 0.3,
                'palette': ['0000ff', '00ffff', '00ff00', 'ffff00', 'ff0000']
            }
        else:
            index_img = s2.map(lambda img: img.normalizedDifference(['B4', 'B3']).rename('turbidity')) \
                          .median().clip(region)
            vis_params = {
                'min': -0.1,
                'max': 0.3,
                'palette': [
                    '000080', '0000d9', '4000ff', '8000ff', '0080ff', '00ffff', 
                    '00ff80', '80ff00', 'daff00', 'ffff00', 'fff500', 'ffda00', 
                    'ffb000', 'ffa400', 'ff4f00', 'ff2500', 'ff0a00', 'ff00ff'
                ]
            }

        # Generate the map tile URL format
        map_id_dict = ee.Image(index_img).getMapId(vis_params)
        
        return {"urlFormat": map_id_dict['tile_fetcher'].url_format}
        
    except Exception as e:
        print(f"GEE Map Layer Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
