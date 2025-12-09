# Military Asset Management System - Setup Guide

## Prerequisites

- **PostgreSQL** (version 12 or higher)
- **Python** (version 3.8 or higher)
- **Node.js** (version 16 or higher)
- **npm** or **yarn**

## Installation Steps

### 1. Database Setup

```powershell
# Install PostgreSQL if not already installed
# Create a new database
createdb military_asset_db

# Run the schema to create tables and insert sample data
psql -d military_asset_db -f database/schema.sql
```

### 2. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
copy .env.example .env

# Edit .env file and update your database credentials
# DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/military_asset_db

# Start the backend server
python app.py
```

The backend API will be running at `http://localhost:5000`

### 3. Frontend Setup

```powershell
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be running at `http://localhost:3000`

## Default Login Credentials

### Admin Account
- **Username:** `admin`
- **Password:** `password123`
- **Access:** Full system access

### Base Commander Account
- **Username:** `commander_alpha`
- **Password:** `password123`
- **Access:** Base Alpha data and operations

### Logistics Officer Account
- **Username:** `logistics_alpha`
- **Password:** `password123`
- **Access:** Purchases and transfers

## Features Overview

### Dashboard
- View key metrics (Opening Balance, Closing Balance, Net Movement)
- Filter by date range, base, and equipment type
- Interactive charts for movement distribution and asset status
- Click on Net Movement to see detailed breakdown

### Purchases
- Record new asset purchases
- Track purchase history
- Mark purchases as received
- View vendor information and pricing

### Transfers
- Initiate transfers between bases
- Track transfer status (Pending → In Transit → Completed)
- View transfer history
- Update transfer status

### Assignments
- Assign assets to personnel
- Track active assignments
- Return assigned assets
- View assignment history

### Expenditures
- Record expended assets
- Categorize by reason (Training, Combat, Maintenance, etc.)
- Track authorized expenditures
- View expenditure history

## API Endpoints

All endpoints are prefixed with `/api`

### Authentication
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Dashboard
- `GET /dashboard/metrics` - Get dashboard metrics
- `GET /dashboard/movement-details` - Get movement breakdown

### Purchases
- `GET /purchases` - List purchases
- `POST /purchases` - Create purchase
- `PUT /purchases/:id` - Update purchase
- `DELETE /purchases/:id` - Delete purchase (admin only)

### Transfers
- `GET /transfers` - List transfers
- `POST /transfers` - Create transfer
- `PUT /transfers/:id/status` - Update transfer status
- `DELETE /transfers/:id` - Delete transfer (admin only)

### Assignments
- `GET /assignments` - List assignments
- `POST /assignments` - Create assignment
- `PUT /assignments/:id/return` - Return assignment
- `DELETE /assignments/:id` - Delete assignment (admin only)

### Expenditures
- `GET /expenditures` - List expenditures
- `POST /expenditures` - Record expenditure
- `DELETE /expenditures/:id` - Delete expenditure (admin only)

### Common
- `GET /common/bases` - Get all bases
- `GET /common/equipment-types` - Get equipment types
- `GET /common/users` - Get users (admin only)
- `GET /common/audit-logs` - Get audit logs (admin only)

## Technology Stack

### Backend
- **Flask** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **Chart.js** - Data visualization

### Database Design
- **ACID compliance** for data integrity
- **Triggers** for automatic timestamp updates
- **Indexes** for optimized queries
- **Foreign keys** for referential integrity
- **Audit logging** for all transactions

## Security Features

1. **JWT-based authentication**
2. **Role-based access control (RBAC)**
3. **Password hashing with bcrypt**
4. **API request logging**
5. **Transaction auditing**
6. **Base-level access restrictions**

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists: `psql -l`

### Backend Issues
- Activate virtual environment
- Check all dependencies are installed
- Verify Python version: `python --version`

### Frontend Issues
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall
- Check Node.js version: `node --version`

### Port Conflicts
- Backend: Change `PORT` in `.env`
- Frontend: Change port in `vite.config.js`

## Production Deployment

1. Update `JWT_SECRET_KEY` in backend `.env`
2. Set `DEBUG=False` in production
3. Use environment variables for sensitive data
4. Build frontend: `npm run build`
5. Serve frontend build with a web server
6. Use HTTPS for secure communication
7. Set up database backups
8. Configure CORS origins properly

## Support

For issues or questions, refer to the README.md or check the system documentation.
