# WaterWatch Africa - Water Quality Analysis Dashboard

A full-stack web application that leverages Google Earth Engine (GEE) and Sentinel-2 satellite imagery to monitor water quality over time. Users can draw an Area of Interest (AOI) on an interactive map or select predefined waterbodies to instantly generate a time-series analysis of both **Turbidity** and **Chlorophyll-a** levels.

## 🌟 Features

*   **Dual Metric Analysis**: Simultaneously computes Turbidity (NDTI) and Chlorophyll indices (NDCI).
*   **Interactive Map**: Built with React Leaflet. Allows users to draw custom polygons/rectangles or select predefined major water bodies (e.g., Lake Victoria, Lake Tahoe).
*   **Map Layer Toggling**: View spatial heatmaps of median Turbidity or Chlorophyll directly overlaid on the satellite map.
*   **Google Earth Engine Integration**: Communicates with GEE via a Node.js Express backend to process heavy satellite data without overloading the client.
*   **Analytics Dashboard**: Visualizes the water quality time-series using Recharts, highlighting anomalies, mean values, and status distributions.
*   **Advanced Analysis**: View seasonal trends (monthly averages) and status distributions.
*   **Methodology Section**: Built-in documentation explaining the scientific indices (NDTI, NDCI) and satellite data used.
*   **Data Export**: Download the raw time-series data (CSV) or your drawn Area of Interest boundary (GeoJSON).

## 🔬 Scientific Methodology

The application uses the **Copernicus Sentinel-2** satellite constellation, which provides high-resolution (10m-20m) multispectral imagery.

- **Turbidity (NDTI)**: Calculated using the Normalized Difference Turbidity Index `(Band 4 - Band 3) / (Band 4 + Band 3)`. It measures suspended sediments by comparing Red and Green light reflectance.
- **Chlorophyll (NDCI)**: Calculated using the Normalized Difference Chlorophyll Index `(Band 5 - Band 4) / (Band 5 + Band 4)`. It detects phytoplankton/algae concentration using the Red Edge and Red bands.

*Note: The raw indices are linearly scaled to a 0-100 range for visualization purposes. For regulatory or strict scientific use, these indices must be calibrated against in-situ physical water samples.*

## 🏗️ Tech Stack

*   **Frontend**: React 18, Vite, Tailwind CSS, React Leaflet, Recharts, Lucide React.
*   **Backend**: Node.js, Express, `@google/earthengine`, `google-auth-library`.
*   **Build System**: `tsx` for running the TypeScript server, concurrently serving Vite middleware in development.

## 📂 Project Structure

*   `/server.ts`: The Express backend. Handles Google OAuth, Service Account initialization, and the `/api/analyze` and `/api/map-layer` endpoints.
*   `/src/App.tsx`: The main React application layout, managing state between the Map, Dashboard, and Sidebar.
*   `/src/components/Map.tsx`: The Leaflet map component with drawing tools and layer toggling.
*   `/src/components/Dashboard.tsx`: The analytics dashboard displaying combined charts and statistics.
*   `/src/components/Methodology.tsx`: Documentation on the scientific methods used.
*   `/src/services/geeService.ts`: Frontend service for communicating with the backend API.
*   `/src/services/turbidityService.ts`: (WaterQualityService) Handles statistical calculations and status categorizations.

---

## 🚀 How to Run Locally

Follow these steps to run the application on your local machine after downloading the ZIP file.

### 1. Prerequisites
*   **Node.js**: Ensure you have Node.js (v18 or higher) installed.
*   **Google Cloud Project**: You need a Google Cloud Project with the **Earth Engine API** enabled.
*   **Earth Engine Access**: Your Google account (or Service Account) must be registered for Earth Engine access at [signup.earthengine.google.com](https://signup.earthengine.google.com/).

### 2. Install Dependencies
Open your terminal, navigate to the extracted project folder, and run:
```bash
npm install
```

### 3. Configure Environment Variables
Create a file named `.env` in the root of the project (next to `package.json`). You can base it on the provided `.env.example`.

You have two options for authentication:

**Option A: Service Account (Recommended for seamless local dev)**
This allows the app to run without requiring a browser login popup.
1. Create a Service Account in Google Cloud Console.
2. Generate a JSON key for it.
3. Register the Service Account email at [signup.earthengine.google.com/#!/service_accounts](https://signup.earthengine.google.com/#!/service_accounts).
4. Add these to your `.env`:
```env
GEE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GEE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Option B: User OAuth (Requires browser login)**
1. Create OAuth 2.0 Client IDs in Google Cloud Console.
2. Add `http://localhost:3000/auth/callback` to the Authorized Redirect URIs.
3. Add these to your `.env`:
```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
APP_URL="http://localhost:3000"
```

### 4. Start the Development Server
Run the following command to start both the Express backend and the Vite frontend:
```bash
npm run dev
```

### 5. Open the App
Open your browser and navigate to:
**http://localhost:3000**

If you used Option B (OAuth), click "Connect Account" in the center of the screen to log in. If you used Option A (Service Account), the app will automatically authenticate in the background!
