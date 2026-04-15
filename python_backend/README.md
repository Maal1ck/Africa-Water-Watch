# Python Backend for WaterWatch Africa

This folder contains a complete Python replacement for the Node.js Express backend, built using **FastAPI** and the **Earth Engine Python API**. 

Because the live preview environment in AI Studio is strictly configured for Node.js, this Python version cannot run live in the browser here. However, you can download the project ZIP file and run this Python backend locally alongside the React frontend!

## Prerequisites

1. Python 3.8+
2. A Google Cloud Project with the Earth Engine API enabled.
3. A Service Account JSON key.

## Setup Instructions

1. **Navigate to this directory:**
   ```bash
   cd python_backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set Environment Variables:**
   You must provide your Service Account credentials to authenticate with Earth Engine.
   
   *On Linux/macOS:*
   ```bash
   export GEE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
   export GEE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
   ```
   
   *On Windows (PowerShell):*
   ```powershell
   $env:GEE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
   $env:GEE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
   ```

5. **Run the Server:**
   ```bash
   python main.py
   ```
   The FastAPI server will start on `http://localhost:8000`.

## Connecting the React Frontend

To use this Python backend instead of the Node.js backend, you just need to update the API calls in the React frontend to point to `http://localhost:8000` instead of `/api`.

In `src/services/geeService.ts`, change the fetch URLs:
```typescript
// Change this:
const response = await fetch('/api/analyze', { ... })

// To this:
const response = await fetch('http://localhost:8000/api/analyze', { ... })
```

Do the same for the `/api/map-layer` endpoint. The React app will now communicate directly with your new Python backend!
