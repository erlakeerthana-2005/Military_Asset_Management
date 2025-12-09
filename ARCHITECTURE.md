# Military Asset Management System - Architecture Document

## System Overview

The Military Asset Management System is a full-stack web application designed to manage critical military assets across multiple bases. It provides real-time tracking, role-based access control, and comprehensive audit logging.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │          React Frontend (Port 3000)                 │    │
│  │  - Modern UI with military theme                   │    │
│  │  - Dashboard with charts (Chart.js)                │    │
│  │  - Responsive design                               │    │
│  │  - Role-based UI components                        │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │        Flask Backend (Port 5000)                    │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Authentication & Authorization              │  │    │
│  │  │  - JWT tokens                                │  │    │
│  │  │  - RBAC middleware                           │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  API Routes                                  │  │    │
│  │  │  - Dashboard  - Purchases                    │  │    │
│  │  │  - Transfers  - Assignments                  │  │    │
│  │  │  - Expenditures - Common                     │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Audit Logging                               │  │    │
│  │  │  - All transactions logged                   │  │    │
│  │  │  - IP tracking                               │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ psycopg2
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │         PostgreSQL Database                         │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Core Tables                                 │  │    │
│  │  │  - users          - bases                    │  │    │
│  │  │  - equipment_types - asset_inventory         │  │    │
│  │  │  - purchases      - transfers                │  │    │
│  │  │  - assignments    - expenditures             │  │    │
│  │  │  - audit_logs                                │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Features                                    │  │    │
│  │  │  - Foreign keys & constraints                │  │    │
│  │  │  - Indexes for performance                   │  │    │
│  │  │  - Triggers for timestamps                   │  │    │
│  │  │  - ACID compliance                           │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Entities

1. **users** - System users with role-based access
2. **bases** - Military bases/locations
3. **equipment_types** - Types of military equipment
4. **asset_inventory** - Current stock at each base
5. **purchases** - Asset purchase records
6. **transfers** - Inter-base asset transfers
7. **assignments** - Asset assignments to personnel  
8. **expenditures** - Expended/consumed assets
9. **audit_logs** - Complete transaction history

### Relationships

```
users ──┬─> bases (base_id)
        └─> audit_logs (user_id)

asset_inventory ──┬─> bases (base_id)
                  └─> equipment_types (equipment_type_id)

purchases ──┬─> bases (base_id)
            ├─> equipment_types (equipment_type_id)
            └─> users (created_by)

transfers ──┬─> bases (from_base_id, to_base_id)
            ├─> equipment_types (equipment_type_id)
            └─> users (initiated_by, approved_by)

assignments ──┬─> bases (base_id)
              ├─> equipment_types (equipment_type_id)
              └─> users (created_by)

expenditures ──┬─> bases (base_id)
               ├─> equipment_types (equipment_type_id)
               └─> users (created_by)
```

## Role-Based Access Control (RBAC)

### Admin
- **Access:** All features and all bases
- **Capabilities:**
  - View/manage all data across all bases
  - Delete records
  - Access audit logs
  - Manage users

### Base Commander
- **Access:** Own base only
- **Capabilities:**
  - View base-specific data
  - Create purchases (own base)
  - Initiate transfers (from own base)
  - Manage assignments & expenditures (own base)

### Logistics Officer
- **Access:** Limited to logistics operations
- **Capabilities:**
  - View purchases and transfers
  - Create purchases
  - Create transfers
  - View inventory

## Data Flow Examples

### Example 1: Creating a Purchase

```
1. User (Logistics Officer) submits purchase form
2. Frontend validates input
3. API receives POST /api/purchases
4. Middleware verifies JWT token
5. Middleware checks role permissions
6. Backend validates data
7. Insert into purchases table
8. If received_date provided:
   - Update asset_inventory (increment quantity)
9. Insert audit log entry
10. Return success response
11. Frontend refreshes purchase list
```

### Example 2: Transfer Between Bases

```
1. User initiates transfer
2. API creates transfer (status: pending)
3. Deduct from source base inventory
4. Commander updates to "in_transit"
5. Commander updates to "completed"
6. Add to destination base inventory
7. All steps logged in audit_logs
```

## Security Measures

1. **Authentication:**
   - JWT tokens with 8-hour expiry
   - Secure password hashing (bcrypt)
   - Token refresh mechanism

2. **Authorization:**
   - Role-based middleware
   - Base-level access control
   - Function-level permissions

3. **Data Protection:**
   - SQL injection prevention (parameterized queries)
   - XSS protection
   - CORS configuration

4. **Audit Trail:**
   - All CRUD operations logged
   - User tracking
   - IP address logging
   - Timestamp tracking

## Performance Optimizations

1. **Database:**
   - Indexes on foreign keys
   - Indexes on frequently queried fields
   - Efficient query design

2. **API:**
   - Connection pooling
   - Lazy loading
   - Pagination support

3. **Frontend:**
   - Code splitting
   - Lazy route loading
   - Optimized bundle size

## Scalability Considerations

1. **Horizontal Scaling:**
   - Stateless API design
   - JWT for distributed auth
   - Database connection pooling

2. **Caching:**
   - Redis for session management
   - API response caching
   - Static asset caching

3. **Load Balancing:**
   - Multiple API instances
   - Database read replicas
   - CDN for frontend

## Monitoring & Maintenance

1. **Logging:**
   - Application logs
   - Error tracking
   - Performance metrics

2. **Backups:**
   - Daily database backups
   - Transaction log backups
   - Point-in-time recovery

3. **Health Checks:**
   - `/api/health` endpoint
   - Database connectivity checks
   - Service status monitoring

## Future Enhancements

1. **Real-time Updates:**
   - WebSocket integration
   - Live notifications
   - Real-time dashboard

2. **Advanced Analytics:**
   - Predictive maintenance
   - Trend analysis
   - Custom reports

3. **Mobile App:**
   - React Native version
   - Offline capabilities
   - Push notifications

4. **Integration:**
   - External systems API
   - Import/export functionality
   - Third-party services

## Justification of Technology Choices

### PostgreSQL
✅ **Chosen for:**
- ACID compliance ensures data integrity
- Complex queries for asset tracking
- Excellent transaction support for transfers
- Strong security features
- Mature ecosystem

### Flask (Python)
✅ **Chosen for:**
- Lightweight and flexible
- Excellent library ecosystem
- Easy to implement RBAC
- Strong database integration
- Rapid development

### React
✅ **Chosen for:**
- Component reusability
- Large community support
- Excellent state management
- Rich ecosystem of libraries
- Great performance

This architecture provides a solid foundation for managing military assets with strong security, auditability, and scalability.
