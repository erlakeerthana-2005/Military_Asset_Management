# Database Design & Justification

## Database Choice: PostgreSQL

We have selected **PostgreSQL** as the database backend for the Military Asset Management System.

### Justification
1.  **Data Integrity & ACID Compliance**: Military logistics require strict accountability. PostgreSQL determines that all transactions (purchases, transfers) are processed reliably without data loss or corruption.
2.  **Relational Structure**: The problem domain (Bases, Equipment, Personnel, Transfers) is inherently relational. Relationships between these entities are best modeled with Foreign Keys to ensure referential integrity.
3.  **Complex Queries**: The requirement to track "Opening Balance, Closing Balance, Net Movement" requires powerful aggregation and window functions which PostgreSQL excels at.
4.  **Security (RBAC)**: PostgreSQL supports robust role and permission management, aligning with the project's security requirements.
5.  **Extensibility**: Support for JSONB allows us to store semi-structured data if needed in the future (e.g., specific asset attributes) without breaking the schema.

## Database Design

The database schema is designed to track the full lifecycle of assets.

### Core Tables

1.  **`bases`**
    *   `id`: Primary Key
    *   `name`: Name of the base
    *   `location`: Location details
    *   *Purpose*: Represents the physical locations where assets are stored.

2.  **`equipment_types`**
    *   `id`: Primary Key
    *   `name`: e.g., "M4 Carbine", "Humvee"
    *   `category`: e.g., "Weapon", "Vehicle"
    *   `description`: details
    *   *Purpose*: Catalog of standard issue equipment.

3.  **`users`**
    *   `id`: Primary Key
    *   `username`: Login ID
    *   `password_hash`: Securely stored password
    *   `role`: enum('admin', 'base_commander', 'logistics_officer')
    *   `base_id`: Foreign Key (nullable, for Base Commanders)
    *   *Purpose*: Manages authentication and RBAC.

4.  **`inventory`** (The "Current" State)
    *   `id`: Primary Key
    *   `equipment_type_id`: FK
    *   `base_id`: FK (Where it currently is)
    *   `status`: enum('available', 'assigned', 'expended', 'in_transit')
    *   `assigned_to_user_id`: FK (if status is assigned)
    *   *Purpose*: Tracks the current location and status of every individual asset unit.

5.  **`transactions`** (The History/Audit Log)
    *   `id`: Primary Key
    *   `asset_id`: FK to inventory (or equipment type for bulk moves if implemented)
    *   `from_base_id`: FK
    *   `to_base_id`: FK
    *   `type`: enum('purchase', 'transfer_out', 'transfer_in', 'assignment', 'expenditure')
    *   `timestamp`: When it happened
    *   `user_id`: Who performed the action (Audit trail)
    *   *Purpose*: Provides the "Net Movement" calculation and full audit history.

## Supporting Requirements

*   **Tracking Movements**: Every change in location or status is recorded in `transactions`. "Net Movement" is calculated by summing purchases and transfers in/out from this table for a given period.
*   **Assignments & Expenditures**: The `inventory` table holds the current status (`assigned`, `expended`). The `transactions` table records *when* and *by whom* the assignment happened.
*   **Purchases**: Recorded as a transaction with `type='purchase'` and usually a `null` `from_base_id`.
