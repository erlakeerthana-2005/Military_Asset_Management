# Military Asset Management System

## Overview
A comprehensive system for managing military assets across multiple bases with role-based access control, enabling commanders and logistics personnel to track movements, assignments, and expenditures of critical assets.

## Technology Stack

### Backend
- **Python Flask**: RESTful API development
- **PostgreSQL**: Relational database for data integrity
- **Flask-JWT-Extended**: Authentication and authorization
- **Flask-CORS**: Cross-origin resource sharing
- **SQLAlchemy**: ORM for database operations

### Frontend
- **React**: Component-based UI
- **React Router**: Navigation
- **Axios**: HTTP client
- **Chart.js**: Data visualization

## Features

1. **Dashboard**
   - Key metrics: Opening Balance, Closing Balance, Net Movement
   - Filters: Date, Base, Equipment Type
   - Interactive charts and pop-ups

2. **Purchases Management**
   - Record asset purchases
   - Historical view with filters

3. **Transfer Management**
   - Inter-base asset transfers
   - Complete transfer history

4. **Assignments & Expenditures**
   - Track asset assignments to personnel
   - Record expended assets

5. **Role-Based Access Control (RBAC)**
   - Admin: Full system access
   - Base Commander: Base-specific data
   - Logistics Officer: Purchases and transfers only

## Project Structure

```
military-asset-management/
├── backend/
│   ├── app.py                 # Main application
│   ├── config.py              # Configuration
│   ├── models.py              # Database models
│   ├── routes/                # API endpoints
│   ├── middleware/            # RBAC middleware
│   ├── database/              # Database utilities
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/        # React components
│       ├── pages/            # Page components
│       ├── services/         # API services
│       └── App.js            # Main app component
└── database/
    └── schema.sql            # Database schema
```

## Setup Instructions

### Database Setup
1. Install PostgreSQL
2. Create database: `createdb military_asset_db`
3. Run schema: `psql -d military_asset_db -f database/schema.sql`

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Default Users

- **Admin**: username: `admin`, password: `admin123`
- **Base Commander**: username: `commander1`, password: `cmd123`
- **Logistics Officer**: username: `logistics1`, password: `log123`

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/movements` - Get movement details

### Purchases
- `GET /api/purchases` - List purchases
- `POST /api/purchases` - Create purchase

### Transfers
- `GET /api/transfers` - List transfers
- `POST /api/transfers` - Create transfer

### Assignments
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment

### Expenditures
- `GET /api/expenditures` - List expenditures
- `POST /api/expenditures` - Record expenditure

## Security Features

- JWT-based authentication
- Role-based access control
- API request logging
- Transaction auditing
- Encrypted password storage
