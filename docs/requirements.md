# Functional & Technical Requirements

## 1. Project Overview

FundsRoom Mini ERP + CRM is a web-based internal operations portal for a wholesale/distribution company.

The system manages:

- Customers
- Products
- Inventory
- Stock movements
- Sales challans
- CRM follow-ups
- User authentication and role-based access

The application is intended for internal employees such as Sales, Warehouse, Accounts, and Admin users.

---

## 2. Objectives

The primary objectives of the system are:

1. Provide secure user authentication.
2. Provide role-based access to application features.
3. Manage customer information and CRM follow-ups.
4. Manage products and inventory.
5. Track stock movements.
6. Create and manage sales challans.
7. Prevent stock from becoming negative.
8. Maintain historical product information within confirmed challans.
9. Provide clean REST APIs.
10. Provide a responsive administrative frontend.
11. Provide clear setup, deployment, and API documentation.

---

## 3. User Roles

The system will support the following roles:

### Admin

- Full access to the system.
- Manage users.
- Manage customers.
- Manage products.
- Manage inventory.
- Manage challans.

### Sales

- View and manage customers.
- Add customer follow-ups.
- View products and stock.
- Create sales challans.
- View challans.

### Warehouse

- View products.
- Manage stock movements.
- View inventory.
- View sales challans.

### Accounts

- View customers.
- View products and inventory.
- View sales challans.

---

# 4. Functional Requirements

## 4.1 Authentication & Authorization

The system shall provide:

- User login using email and password.
- JWT-based authentication.
- Protected API routes.
- Role-based authorization.
- Secure password hashing.
- Appropriate authentication error responses.

---

## 4.2 Customer CRM Module

Each customer shall contain:

- Customer name
- Mobile number
- Email
- Business name
- GST number 
- Customer type
- Address
- Status
- Follow-up date
- Notes

Customer types:

- Retail
- Wholesale
- Distributor

Customer statuses:

- Lead
- Active
- Inactive

### Customer Features

The system shall support:

- Add customer
- Edit customer
- Search customer
- View customer details
- Add follow-up notes

---

## 4.3 Product & Inventory Module

Each product shall contain:

- Product name
- SKU/code
- Category
- Unit price
- Current stock
- Minimum stock alert quantity
- Warehouse/location

### Product Features

The system shall support:

- Add product
- Edit product
- View products
- Search/filter products
- Identify low-stock products

---

## 4.4 Stock Movement

The system shall maintain a stock movement log.

Each movement shall contain:

- Product
- Quantity changed
- Movement type
- Reason
- Created by
- Timestamp

Movement types:

- IN
- OUT

Stock movements shall provide an audit trail of inventory changes.

---

## 4.5 Sales Challan Module

A Sales user shall be able to:

- Select a customer.
- Add multiple products.
- Specify quantities.
- Generate a challan number automatically.
- Save a challan as Draft.
- Confirm a challan.

Each challan shall contain:

- Challan number
- Customer
- Products
- Total quantity
- Status
- Created by
- Created date

Challan statuses:

- Draft
- Confirmed
- Cancelled

---

## 4.6 Challan Business Rules

The following business rules are mandatory:

### Stock Reduction

When a challan is confirmed:

- The stock quantity of each product shall be reduced.
- A stock OUT movement shall be created.

### Negative Stock Prevention

The system shall never allow stock to become negative.

If available stock is less than the requested quantity:

- Challan confirmation shall fail.
- Stock shall remain unchanged.
- The API shall return an appropriate error response.

### Product Snapshot

A challan shall store snapshot information about products at the time the challan is created/confirmed.

This prevents historical challan information from changing when the product record is later modified.

---

# 5. REST API Requirements

The backend shall expose REST APIs.

Examples include:

```text
POST /api/auth/login

GET /api/customers
POST /api/customers
GET /api/customers/:id
PUT /api/customers/:id
POST /api/customers/:id/followups

GET /api/products
POST /api/products
GET /api/products/:id
PUT /api/products/:id

GET /api/stock/movements
POST /api/stock/movements

GET /api/challans
POST /api/challans
GET /api/challans/:id
PUT /api/challans/:id
POST /api/challans/:id/confirm
POST /api/challans/:id/cancel

```
# 6. Frontend Requirements

The frontend shall provide a clean admin-style user interface.

The frontend shall be built using:

- React
- HTML
- CSS
- JavaScript/TypeScript

The interface shall be responsive.

The frontend shall provide interfaces for the required system modules, including:

- Login
- Customer management
- Product and inventory management
- Sales challan management

---

# 7. Deployment Requirements

AWS deployment is preferred but optional.

The application may be deployed using a free hosting platform.

Acceptable examples include:

### Frontend

- Vercel
- Netlify
- Render Static Site
- Similar free hosting platform

### Backend

- Render
- Railway
- Fly.io
- Similar free hosting platform

### Database

- Supabase
- Neon
- Render Postgres
- Similar free database platform

The server setup must be documented.

Environment variables must be used for configuration.

---

# 8. Local Setup Requirements

If the application is not deployed, the project must provide a working local setup.

The submission shall include:

- Working local application
- Screen recording demonstrating the complete flow
- Postman collection
- Clear README instructions

---

# 9. Documentation Requirements

The project documentation shall explain:

- How the server was set up
- How environment variables are managed
- How to run the project locally
- How to deploy the project
- Assumptions made during development

The README shall also contain:

- Project setup instructions
- Architecture explanation
- API documentation or Postman collection information
- Known limitations or incomplete parts

---

# 10. Submission Requirements

The final submission shall include:

1. GitHub repository link
2. Live frontend URL
3. Live backend API URL
4. Test login credentials for all roles
5. Postman collection or API documentation
6. README with setup and deployment instructions
7. Short explanation of the architecture
8. Known limitations or incomplete parts

A screen recording demonstrating the approach and completed solution is also mandatory.

---

# 11. Optional Bonus Features

The following features are optional and shall only be considered after completing the required functionality:

- Docker setup
- GitHub Actions deployment
- Export invoice as PDF
- Upload product images to AWS S3