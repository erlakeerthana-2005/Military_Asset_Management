# Military Asset Management System - Project Documentation

## 1. Project Overview
The **Military Asset Management System** is a secure, web-based application designed to track and manage military assets (weapons, vehicles, ammunition) across multiple bases. It provides real-time visibility into inventory levels, facilitates asset transfers between bases, and tracks asset assignments and expenditures.

**Assumptions & Limitations:**
- **Authentication:** Uses JWT (JSON Web Tokens) for session management.
- **Scope:** Defines specific roles (Admin, Commander, Logistics) with distinct permissions.
- **Inventory Calculation:** Current inventory is calculated dynamically based on the history of transactions (purchases, transfers, expenditures) rather than stored as a static value.
- **Deployment:** designed to run locally with SQLite or on cloud platforms like Render/Netlify with PostgreSQL.

## 2. Tech Stack & Architecture

### Backend
- **Framework:** **Flask (Python)**. Chosen for its lightweight nature, ease of use, and quick setup for RESTful APIs.
- **Libraries:**
    - `flask-sqlalchemy`: ORM for database interactions.
    - `flask-jwt-extended`: For secure authentication.
    - `flask-cors`: To handle Cross-Origin Resource Sharing with the frontend.

### Frontend
- **Framework:** **React (Vite)**. Chosen for its component-based architecture, fast development server, and optimized production builds.
- **Styling:** Vanilla CSS / Tailwind (inferred from design requirements) for responsive and modern UI.

### Database
- **Development:** **SQLite**. Lightweight, file-based, requiring no configuration.
- **Production:** **PostgreSQL**. Robust, relational database suitable for structured data and complex queries.
- **Reasoning:** Relational model is essential for maintaining strict integrity between Bases, Users, and Transactions.

## 3. Data Models / Schema

The database consists of four core entities interacting to form the inventory ledger.

### 1. Base
Represents a physical military location.
- `id` (PK): Integer
- `name`: String (Unique)
- `location`: String

### 2. User
System actors with specific roles.
- `id` (PK): Integer
- `username`: String (Unique)
- `password_hash`: String
- `role`: String ('admin', 'commander', 'logistics')
- `base_id` (FK): Links user to a specific Base (nullable for global admins).

### 3. AssetType
Catalog of trackable items.
- `id` (PK): Integer
- `name`: String (e.g., "M4 Carbine")
- `category`: String (e.g., "Weapon", "Vehicle")

### 4. Transaction
The core ledger recording all changes.
- `id` (PK): Integer
- `timestamp`: DateTime
- `type`: String ('PURCHASE', 'TRANSFER', 'ASSIGN', 'EXPEND')
- `quantity`: Integer
- `asset_type_id` (FK): Reference to AssetType
- `base_id` (FK): The base where the action occurred.
- `related_base_id` (FK): (Optional) For transfers, the destination/source base.
- `user_id` (FK): The user performing the action.
- `notes`: Text

## 4. RBAC Explanation (Role-Based Access Control)

Access is enforced at the API level within `app.py`.

- **Admin**:
    - **Access:** Global.
    - **Permissions:** Can view dashboard for ALL bases, filter transactions by any base, and likely perform administrative tasks (though strictly defined API limits might apply).
- **Logistics Officer**:
    - **Access:** Base-specific.
    - **Permissions:** authorized primarily for **Inbound/Outbound** logistics (Purchases, Transfers).
    - **Restriction:** Cannot access data for other bases.
- **Base Commander**:
    - **Access:** Base-specific.
    - **Permissions:** View full dashboard for their base. Authorized for operational consumption (Assignments, Expenditures).
    - **Restriction:** Cannot access data for other bases.

**Enforcement Method:**
The `@jwt_required` decorator ensures the user is logged in. Inside the route handler, the `current_user`'s role and `base_id` are checked against the requested data. Attempting to post data for a different base results in a `403 Forbidden` error.

## 5. API Logging

The system does not use a traditional text file logger for business logic. Instead, **Transactions** serve as the immutable log of all business operations.

- Every state change (adding or removing assets) requires creating a `Transaction` record.
- This record captures **Who** (user_id), **When** (timestamp), **What** (asset & quantity), **Where** (base_id), and **Why** (notes).
- This "Event Log" approach allows the system to reconstruct inventory states at any point in time and provides a full audit trail.

## 6. Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js & npm

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the application:
   ```bash
   python app.py
   ```
   *Server runs on `http://localhost:5000`*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *App runs on `http://localhost:5173` (typically)*

## 7. API Endpoints

### Authentication
- `POST /api/login`: Authenticates user and returns JWT token + user details.

### Core Data
- `GET /api/metadata`: Returns list of Bases and AssetTypes. (Requires Auth)

### Operations
- `GET /api/dashboard`: Returns inventory metrics (Opening, Closing, Net Movement).
    - Params: `?base_id=<id>`
- `GET /api/transactions`: Lists recent history.
    - Params: `?type=<type>&base_id=<id>`
- `POST /api/transactions`: Records a new action.
    - Body:
      ```json
      {
        "type": "PURCHASE",
        "asset_type_id": 1,
        "quantity": 100,
        "base_id": 1,
        "notes": "Annual restocking"
      }
      ```
