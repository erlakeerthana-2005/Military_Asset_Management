
# Netlify Deployment Guide

## 1. Get your Backend URL
1. Go to your **Render Dashboard**.
2. Click on the **military-asset-backend** service.
3. Copy the URL from the top left (it should look like `https://military-asset-backend.onrender.com`).

## 2. Configure Netlify Frontend
1. Go to your **Netlify Dashboard**.
2. Select the **kristalballproject** site.
3. Go to **Site Configuration** > **Environment variables**.
4. Click **Add a variable**.
   - Key: `VITE_API_URL`
   - Value: `YOUR_RENDER_BACKEND_URL` (paste the URL you copied, e.g., `https://military-asset-backend.onrender.com`)
5. Click **Create variable**.

## 3. Redeploy Frontend
1. Go to the **Deploys** tab in Netlify.
2. Click **Trigger deploy** > **Clear cache and deploy site**.

## 4. Configure Backend CORS (If not using render.yaml)
1. Go to **Render Dashboard** > **Backend Service** > **Environment**.
2. Edit `CORS_ORIGINS` to include your Netlify URL:
   `https://military-asset-frontend.onrender.com,https://kristalballproject.netlify.app`
