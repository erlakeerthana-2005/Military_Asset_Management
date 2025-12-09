
# How to Deploy Backend on Render

Since your project is configured with a `render.yaml` Blueprint, deploying is very simple.

## Step 1: Push Latest Changes
Ensure all your local changes are on GitHub (I have already done this for you).

## Step 2: Open Render Dashboard
1. Go to [https://dashboard.render.com/](https://dashboard.render.com/)
2. Log in with your GitHub account.

## Step 3: Create Blueprint Instance
1. Click the **"New +"** button in the top right corner.
2. Select **"Blueprint Instance"** from the menu.
3. Connect your GitHub repository `Military_Asset_Management`.
   - If you don't see it, click "Connect account" or "Configure" to grant Render access to this repo.

## Step 4: Validate and Deploy
1. Render will automatically detect the `render.yaml` file in your repository.
2. It will show you a plan with two resources:
   - `military-asset-db` (Postgres Database)
   - `military-asset-backend` (Python Web Service)
3. Click **"Apply"** or **"Create Service"**.

## Step 5: Wait for Deployment
Render will now:
1. Create the database.
2. Build your Python backend.
3. Run the `init_db.py` script to set up your tables and sample data.
4. Start the server with `gunicorn`.

## Step 6: Get Backend URL
1. Once deployed (green "Live" status), go to the Dashboard.
2. Click on the **military-asset-backend** service.
3. Copy the URL (e.g., `https://military-asset-backend.onrender.com`).

## Step 7: Update Frontend (Optional)
If you want your Netlify frontend to talk to this real backend instead of using Mock mode:
1. Go to Netlify Dashboard.
2. Update the `VITE_API_URL` environment variable to your new Render Backend URL.
3. Set `VITE_USE_MOCK` to `false` (or delete it).
4. Redeploy Netlify.
