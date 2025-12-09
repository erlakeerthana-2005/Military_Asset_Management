# How to Deploy Backend on Render

Your project is configured with a `render.yaml` Blueprint for easy deployment. Follow these steps:

## Step 1: Prepare Your Repository
1. Ensure all changes are committed to GitHub:
   ```bash
   git add .
   git commit -m "Backend deployment configuration"
   git push
   ```

## Step 2: Connect Render to GitHub
1. Go to [https://dashboard.render.com/](https://dashboard.render.com/)
2. Click **"New +"** button in the top right
3. Select **"Blueprint Instance"**

## Step 3: Select Your Repository
1. Click **"Connect account"** if needed to authorize GitHub
2. Search for and select `Military_Asset_Management`
3. Select your branch (usually `main`)
4. Click **"Next"**

## Step 4: Verify Configuration
Render will automatically detect `render.yaml` and show:
- **Backend Service**: `military-asset-backend`
- **Database**: `military-asset-db`
- **Region**: Singapore (free tier available)
- **Plan**: Free

Review the environment variables and adjust if needed:
- `CORS_ORIGINS`: Already configured for your frontend
- `JWT_SECRET_KEY`: Render will auto-generate
- `DATABASE_URL`: Auto-configured from database

## Step 5: Deploy
1. Click **"Deploy"** button
2. Wait for the deployment to complete (usually 2-5 minutes)
3. Once deployed, your backend URL will be displayed

## Step 6: Update Frontend API URL
Once your backend is deployed, update your frontend:

### For Production (Netlify/Render):
1. Go to `frontend/` folder
2. Create/update `.env.production`:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

3. Rebuild and redeploy your frontend

### For Local Development:
The `.env` is already configured for `http://localhost:5000/api`

## Environment Variables on Render

| Variable | Auto-Generated | Value |
|----------|---|---|
| `DATABASE_URL` | ✓ | From PostgreSQL database |
| `JWT_SECRET_KEY` | ✓ | Random secure key |
| `CORS_ORIGINS` | Manual | Comma-separated URLs |
| `DEBUG` | Manual | `False` for production |

## Monitoring Deployment

1. Go to your service dashboard
2. Click **"Logs"** tab to view real-time logs
3. Check for any errors during initialization
4. The health check endpoint `/api/health` should return `200 OK`

## Troubleshooting

### Database Connection Fails
- Ensure database is deployed first
- Check `DATABASE_URL` environment variable
- Database must be in the same region

### Build Fails
- Check `build.log` for errors
- Ensure all Python dependencies are in `requirements.txt`
- Verify `buildCommand` is correct

### CORS Errors
- Add your frontend URL to `CORS_ORIGINS`
- Multiple URLs should be comma-separated
- Include both `https://` and `http://` if needed

### Health Check Fails
- Ensure `/api/health` endpoint is accessible
- Check if database connection is working
- Review application logs for startup errors

## Testing Your Backend

Once deployed, test with curl:
```bash
# Health check
curl https://your-backend-url.onrender.com/api/health

# Login (should return 200)
curl -X POST https://your-backend-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

## Need Help?
- Render Documentation: https://render.com/docs
- Check application logs in Render dashboard
- Verify database is running and accessible
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
