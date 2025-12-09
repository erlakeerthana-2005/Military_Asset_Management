# Backend Environment Setup for Render

## Local Development Environment

### 1. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in the backend directory:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/military_asset_db
JWT_SECRET_KEY=your-secret-key-for-dev
CORS_ORIGINS=http://localhost:3000
DEBUG=True
HOST=0.0.0.0
PORT=5000
```

### 3. Initialize Database
```bash
python init_db.py
```

This will:
- Create all tables from schema.sql
- Insert test bases (Alpha, Beta, Gamma)
- Create test users with hashed passwords
- Insert equipment types for testing

### 4. Start Development Server
```bash
python app.py
```

Server runs on: http://localhost:5000

## Production Environment (Render)

### Environment Variables (Auto-managed by Render)

| Variable | Source | Purpose |
|----------|--------|---------|
| DATABASE_URL | PostgreSQL service | Database connection string |
| JWT_SECRET_KEY | Auto-generated | JWT token signing |
| CORS_ORIGINS | render.yaml | Allowed frontend origins |
| DEBUG | render.yaml | Disable in production |

### Configuration in render.yaml
```yaml
services:
  - type: web
    name: military-asset-backend
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn --bind 0.0.0.0:10000 --workers 2 --timeout 30 wsgi:app
    healthCheckPath: /api/health
```

### Key Points for Production

1. **Database Initialization**
   - Automatic when service starts
   - `init_db()` is called in `app.py` → `create_app()`
   - Safe to run multiple times (uses ON CONFLICT DO NOTHING)

2. **CORS Configuration**
   - Update CORS_ORIGINS in render.yaml with your frontend URL
   - Format: comma-separated URLs

3. **Gunicorn Workers**
   - Current: 2 workers
   - For more traffic, increase workers (uses more memory)
   - Timeout: 30 seconds for long-running requests

## Test Users

After initialization, these accounts are available:

### Admin Account
- Username: `admin`
- Password: `password123`
- Role: Admin (access to all features)

### Base Commander Account
- Username: `commander_alpha`
- Password: `password123`
- Role: Base Commander (limited to Alpha Base)

### Logistics Officer Account
- Username: `logistics_alpha`
- Password: `password123`
- Role: Logistics Officer (operations staff)

## Database Schema

The database includes:
- **bases**: Military base locations
- **users**: User accounts with roles
- **equipment_types**: Asset categories
- **asset_inventory**: Current inventory levels
- **purchases**: Equipment purchases
- **transfers**: Base-to-base transfers
- **assignments**: Equipment assignments to personnel
- **expenditures**: Equipment usage/consumption
- **audit_logs**: Audit trail of operations

## Troubleshooting

### Connection Issues
```bash
# Check if PostgreSQL is running
psql -U postgres -h localhost -d military_asset_db -c "SELECT version();"
```

### Database Reset (Local)
```bash
# Drop the database
dropdb military_asset_db

# Recreate it
createdb military_asset_db

# Reinitialize
python init_db.py
```

### Verify API Health
```bash
# Health check
curl http://localhost:5000/api/health

# Should return: {"status": "healthy", "message": "Military Asset Management API"}
```

## Dependencies
- Flask 3.0.0
- Flask-CORS 4.0.0
- Flask-JWT-Extended 4.5.3
- psycopg2-binary 2.9.9
- bcrypt 4.1.1
- gunicorn 21.2.0

All are specified in `requirements.txt`
