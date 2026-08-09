# System Architecture

## 1. Architecture Overview

FundsRoom Mini ERP + CRM will use a simple three-tier web application
architecture:

1.  React frontend
2.  Node.js and Express backend
3.  PostgreSQL database

The frontend communicates with the backend through REST APIs. The
backend handles authentication, authorization, validation, business
logic, inventory operations, and database access.

The architecture is intentionally kept simple and modular because the
case study focuses on demonstrating a working full-stack business
application rather than a large enterprise platform.

------------------------------------------------------------------------

## 2. High-Level Architecture

``` mermaid
flowchart TB
    U[Internal User<br/>Admin / Sales / Warehouse / Accounts]

    FE[React Frontend<br/>Responsive Admin UI]

    API[Express REST API<br/>Node.js + TypeScript]

    AUTH[Authentication & Authorization<br/>JWT + Role Checks]

    MOD[Business Modules<br/>Customers<br/>Products & Inventory<br/>Stock Movements<br/>Sales Challans]

    DB[(PostgreSQL Database)]

    U --> FE
    FE -->|HTTPS / JSON| API
    API --> AUTH
    AUTH --> MOD
    MOD --> DB
```

------------------------------------------------------------------------

## 3. Technology Stack

  Layer               Technology
  ------------------- --------------------------------
  Frontend            React + TypeScript
  Backend             Node.js + Express + TypeScript
  Database            PostgreSQL
  API                 REST / JSON
  Authentication      JWT
  Password Security   Password hashing
  Version Control     Git + GitHub
  API Testing         Postman

The technologies above satisfy the required stack in the case study. The
specific implementation choices are documented here as project
decisions.

------------------------------------------------------------------------

## 4. Application Layers

The backend will follow a layered structure:

``` mermaid
flowchart LR
    R[HTTP Request]
    RT[Route]
    MW[Middleware]
    C[Controller]
    S[Service]
    D[Database Access]
    DB[(PostgreSQL)]

    R --> RT
    RT --> MW
    MW --> C
    C --> S
    S --> D
    D --> DB
```

### Route Layer

Defines API endpoints and connects them to controllers.

Examples:

-   `POST /api/auth/login`
-   `GET /api/customers`
-   `POST /api/customers`
-   `GET /api/products`
-   `POST /api/challans`
-   `POST /api/challans/:id/confirm`

### Middleware Layer

Handles concerns shared across multiple routes:

-   JWT authentication
-   Role authorization
-   Request validation
-   Centralized error handling

### Controller Layer

Controllers handle HTTP-specific responsibilities:

-   Read request parameters and body
-   Call the appropriate service
-   Return the appropriate HTTP response

Controllers will not contain complex business rules.

### Service Layer

Services contain business logic.

Planned services include:

-   Authentication service
-   Customer service
-   Product service
-   Inventory service
-   Challan service

### Database Layer

The database layer handles persistence in PostgreSQL.

------------------------------------------------------------------------

## 5. Authentication Architecture

The application will use JWT-based authentication.

### Login Flow

``` mermaid
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant API as Express API
    participant Auth as Auth Service
    participant DB as PostgreSQL

    User->>UI: Enter email and password
    UI->>API: POST /api/auth/login
    API->>Auth: Validate credentials
    Auth->>DB: Find user
    DB-->>Auth: User + password hash
    Auth->>Auth: Verify password
    Auth-->>API: Generate JWT
    API-->>UI: Return authentication token
    UI-->>User: Open application
```

Invalid credentials will result in an appropriate authentication error
and will not generate a valid session.

------------------------------------------------------------------------

## 6. Protected API Request Flow

After login, protected API requests will include the JWT.

``` mermaid
flowchart TD
    A[Frontend Request] --> B[Authorization Header<br/>Bearer JWT]
    B --> C{Valid JWT?}

    C -->|No| D[401 Unauthorized]
    C -->|Yes| E[Read User Role]

    E --> F{Role Allowed?}

    F -->|No| G[403 Forbidden]
    F -->|Yes| H[Controller]
    H --> I[Service]
    I --> J[(PostgreSQL)]
```

Authentication verifies the identity of the user. Authorization
determines whether that user's role can perform the requested operation.

------------------------------------------------------------------------

## 7. Role-Based Access

The system supports four roles:

-   Admin
-   Sales
-   Warehouse
-   Accounts

The exact permissions will be implemented according to the required
modules and documented assumptions.

``` mermaid
flowchart TD
    LOGIN[Authenticated User] --> ROLE{User Role}

    ROLE --> ADMIN[Admin]
    ROLE --> SALES[Sales]
    ROLE --> WH[Warehouse]
    ROLE --> ACC[Accounts]

    ADMIN --> AM[Required System Modules]
    SALES --> SM[Customer CRM<br/>Products / Stock View<br/>Sales Challans]
    WH --> WM[Products / Inventory<br/>Stock Movements<br/>Challans]
    ACC --> AC[Customers / Products<br/>Inventory / Challans]
```

------------------------------------------------------------------------

## 8. Customer CRM Module

Customer operations will follow the standard backend flow:

``` mermaid
flowchart LR
    UI[Customer UI]
    API[Customer API]
    C[Customer Controller]
    S[Customer Service]
    DB[(Customers)]

    UI --> API
    API --> C
    C --> S
    S --> DB
```

Supported operations:

-   Add customer
-   Edit customer
-   Search customer
-   View customer details
-   Add follow-up notes

Customer information includes:

-   Customer name
-   Mobile number
-   Email
-   Business name
-   GST number
-   Customer type
-   Address
-   Status
-   Follow-up date
-   Notes

------------------------------------------------------------------------

## 9. Product and Inventory Module

The product record stores the current inventory state.

The stock movement records provide the history of inventory changes.

``` mermaid
flowchart TD
    P[Product]
    P --> S[Current Stock]
    P --> M[Stock Movement History]

    M --> IN[IN Movement]
    M --> OUT[OUT Movement]

    IN --> AUDIT[Reason + User + Timestamp]
    OUT --> AUDIT
```

A stock movement records:

-   Product
-   Quantity changed
-   Movement type
-   Reason
-   Created by
-   Timestamp

This provides an audit trail for inventory changes.

------------------------------------------------------------------------

## 10. Sales Challan Module

A sales challan contains a customer and one or more products.

``` mermaid
erDiagram
    CUSTOMER ||--o{ CHALLAN : receives
    USER ||--o{ CHALLAN : creates
    CHALLAN ||--|{ CHALLAN_ITEM : contains
    PRODUCT ||--o{ CHALLAN_ITEM : references
    PRODUCT ||--o{ STOCK_MOVEMENT : has
    USER ||--o{ STOCK_MOVEMENT : creates

    CUSTOMER {
        uuid id PK
        string customer_name
        string mobile
        string email
        string business_name
        string gst_number
        string customer_type
        string address
        string status
        date follow_up_date
    }

    USER {
        uuid id PK
        string name
        string email
        string role
    }

    PRODUCT {
        uuid id PK
        string name
        string sku
        string category
        decimal unit_price
        int current_stock
        int minimum_stock
        string warehouse_location
    }

    STOCK_MOVEMENT {
        uuid id PK
        uuid product_id FK
        int quantity
        string movement_type
        string reason
        uuid created_by FK
        datetime created_at
    }

    CHALLAN {
        uuid id PK
        string challan_number
        uuid customer_id FK
        int total_quantity
        string status
        uuid created_by FK
        datetime created_at
    }

    CHALLAN_ITEM {
        uuid id PK
        uuid challan_id FK
        uuid product_id FK
        string product_name_snapshot
        string sku_snapshot
        decimal unit_price_snapshot
        int quantity
    }
```

------------------------------------------------------------------------

## 11. Product Snapshot Design

Challan items will store product information as a snapshot.

For example:

``` text
Product at time of challan:

Name: Wireless Keyboard
SKU: KB-001
Unit Price: 1200
```

The challan item stores:

``` text
Product Name Snapshot: Wireless Keyboard
SKU Snapshot: KB-001
Unit Price Snapshot: 1200
```

If the product is later renamed or its price changes, the historical
challan still contains the information that applied when the challan was
created.

The product ID is still retained as a reference, but the snapshot fields
preserve historical values.

------------------------------------------------------------------------

## 12. Sales Challan Lifecycle

A challan can move through the following states:

``` mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Confirmed: Confirm
    Draft --> Cancelled: Cancel
    Confirmed --> [*]
    Cancelled --> [*]
```

Only a valid Draft challan should be eligible for confirmation.

------------------------------------------------------------------------

## 13. Challan Confirmation and Stock Transaction

Confirming a challan changes inventory, so this operation must be
treated as one database transaction.

``` mermaid
flowchart TD
    A[Confirm Challan] --> B[Load Challan]
    B --> C{Challan is Draft?}

    C -->|No| D[Reject Request]
    C -->|Yes| E[Load Challan Items]

    E --> F[Check Stock for All Items]
    F --> G{Sufficient Stock for All Items?}

    G -->|No| H[Rollback / Make No Changes]
    H --> I[Return Insufficient Stock Error]

    G -->|Yes| J[Reduce Product Stock]
    J --> K[Create OUT Stock Movements]
    K --> L[Set Challan Status = Confirmed]
    L --> M[Commit Transaction]
    M --> N[Return Success]
```

The important rule is that the operation must not partially update
inventory.

For example, if a challan contains three products and the third product
does not have enough stock, the first two products must also remain
unchanged.

------------------------------------------------------------------------

## 14. REST API Structure

The API will be organized by business module.

``` text
/api
├── /auth
│   └── POST /login
│
├── /customers
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   └── POST /:id/followups
│
├── /products
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   └── PUT /:id
│
├── /stock
│   └── /movements
│       ├── GET /
│       └── POST /
│
└── /challans
    ├── GET /
    ├── POST /
    ├── GET /:id
    ├── PUT /:id
    ├── POST /:id/confirm
    └── POST /:id/cancel
```

------------------------------------------------------------------------

## 15. API Error Handling

The API will return appropriate HTTP status codes.

Examples:

  Situation                                         Status
  ----------------------------------------------- --------
  Successful request                                   200
  Resource created                                     201
  Invalid input                                        400
  Authentication required/invalid                      401
  Insufficient permissions                             403
  Resource not found                                   404
  Business conflict, such as insufficient stock        409
  Unexpected server error                              500

Error responses will use a consistent structure.

Example:

``` json
{
  "success": false,
  "message": "Insufficient stock for product KB-001",
  "code": "INSUFFICIENT_STOCK"
}
```

------------------------------------------------------------------------

## 16. Frontend Architecture

The React application will use reusable components and module-based
pages.

``` mermaid
flowchart TD
    APP[React Application]

    APP --> AUTH[Authentication]
    APP --> LAYOUT[Application Layout]

    AUTH --> LOGIN[Login Page]

    LAYOUT --> DASH[Dashboard]
    LAYOUT --> CUSTOMERS[Customers]
    LAYOUT --> PRODUCTS[Products]
    LAYOUT --> INVENTORY[Inventory]
    LAYOUT --> CHALLANS[Sales Challans]

    CUSTOMERS --> CL[Customer List]
    CUSTOMERS --> CD[Customer Details]
    CUSTOMERS --> CF[Customer Form]

    PRODUCTS --> PL[Product List]
    PRODUCTS --> PF[Product Form]

    INVENTORY --> SM[Stock Movement List]

    CHALLANS --> CHL[Challan List]
    CHALLANS --> CHF[Create Challan]
    CHALLANS --> CHD[Challan Details]
```

------------------------------------------------------------------------

## 17. Frontend to Backend Communication

The frontend will communicate with the backend through REST APIs.

``` mermaid
sequenceDiagram
    participant User
    participant React
    participant API as Express API
    participant DB as PostgreSQL

    User->>React: Submit form
    React->>API: HTTP request + JWT
    API->>API: Authenticate and validate
    API->>DB: Execute operation
    DB-->>API: Result
    API-->>React: JSON response
    React-->>User: Update interface
```

------------------------------------------------------------------------

## 18. Deployment Architecture

AWS deployment is optional. The application can be deployed using free
hosting services.

The planned deployment model is:

``` mermaid
flowchart TB
    USER[User Browser]

    FE[React Frontend<br/>Vercel / Similar]

    BE[Express Backend<br/>Render / Similar]

    DB[(PostgreSQL<br/>Neon / Supabase / Similar)]

    USER -->|HTTPS| FE
    FE -->|REST API / HTTPS| BE
    BE --> DB
```

The final hosting providers will be documented after deployment.

------------------------------------------------------------------------

## 19. Environment Variables

Environment variables will be used for configuration and secrets.

Backend configuration may include:

``` text
DATABASE_URL
JWT_SECRET
PORT
CLIENT_URL
```

Frontend configuration may include:

``` text
VITE_API_URL
```

Environment files containing secrets will not be committed to GitHub.

A `.env.example` file will document the required variable names without
exposing real credentials.

------------------------------------------------------------------------

## 20. Project Structure

The repository will use the following structure:

``` text
fundsroom-erp-crm/
│
├── client/
│   └── React frontend
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── types/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   └── package.json
│
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   ├── database.md
│   └── assumptions.md
│
├── .gitignore
└── README.md
```

------------------------------------------------------------------------

## 21. Design Principles

### Separation of Concerns

Routes, controllers, services, validation, and database operations will
have clearly separated responsibilities.

### Security

Authentication, role-based authorization, password hashing, and
environment variables will be used appropriately.

### Data Integrity

Inventory-changing operations will use database transactions to prevent
inconsistent stock states.

### Maintainability

The application will be organized into logical modules so that
individual features can be modified without unnecessarily affecting
unrelated features.

### Simplicity

The implementation will focus on the functionality required by the
FundsRoom case study.

Additional functionality will not be added unless the required system is
complete and stable.

### Documentation

Technical decisions, setup instructions, API behavior, assumptions,
deployment steps, and known limitations will be documented.
