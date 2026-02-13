# CRMS - Crime Records Management System
## Complete Project Presentation Guide

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technical Architecture](#technical-architecture)
3. [Database Schema](#database-schema)
4. [Core Features & Functionalities](#core-features)
5. [Role-Based Access Control](#role-based-access-control)
6. [User Interface](#user-interface)
7. [API Endpoints](#api-endpoints)
8. [Demo Credentials](#demo-credentials)
9. [Key Highlights](#key-highlights)

---

## 1. Project Overview

### What is CRMS?

**CRMS (Crime Records Management System)** is a comprehensive web-based application designed for police departments to efficiently manage crime records, criminal databases, investigations, and police staff information.

### Purpose

- Digitize and centralize crime record management
- Streamline FIR (First Information Report) registration
- Track criminal records and wanted persons
- Manage investigations and assign officers
- Provide role-based access for different police personnel
- Maintain audit logs for accountability

### Target Users

- **Police Administrators** - Full system control
- **Superintendents** - Oversight and reporting
- **CID Officers** (Criminal Investigation Department) - Investigation management
- **NCO Officers** (Non-Commissioned Officers/Station Writers) - Data entry and FIR registration

---

## 2. Technical Architecture

### Technology Stack

#### **Frontend**
- **Framework**: React 19.2.4
- **Styling**: Tailwind CSS 3.4.19
- **Icons**: Lucide React
- **Build Tool**: Create React App (react-scripts 5.0.1)

#### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js 5.2.1
- **Database**: MySQL 8.0
- **Authentication**: JWT (JSON Web Tokens)
- **API Architecture**: RESTful API

#### **Database**
- **DBMS**: MySQL
- **Connection**: mysql2 driver with connection pooling
- **Port**: 3306 (default)

### Application Architecture

```
┌─────────────────┐
│   React Frontend│  (Port 3000)
│   (Single Page  │
│   Application)  │
└────────┬────────┘
         │ HTTP/REST API
         │ JWT Authentication
┌────────▼────────┐
│  Express.js     │  (Port 3001)
│  Backend API    │
│  - Routes       │
│  - Middleware   │
│  - Auth Logic   │
└────────┬────────┘
         │ SQL Queries
┌────────▼────────┐
│  MySQL Database │  (Port 3306)
│  - 8 Tables     │
│  - Relationships│
│  - Constraints  │
└─────────────────┘
```

---

## 3. Database Schema

### Database Tables (8 Total)

#### **1. Roles**
Defines user roles in the system.

| Column | Type | Description |
|--------|------|-------------|
| role_id | INT (PK) | Unique role identifier |
| role_name | VARCHAR(50) | Role name (Admin, Superintendent, CID, NCO) |

**Sample Data**: 4 roles - Admin, Superintendent, CID, NCO

---

#### **2. Police_Staff**
Stores information about police personnel.

| Column | Type | Description |
|--------|------|-------------|
| staff_id | INT (PK) | Unique staff identifier |
| name | VARCHAR(100) | Officer's full name |
| pol_rank | VARCHAR(50) | Police rank (Inspector, Sub-Inspector, etc.) |
| badge_number | VARCHAR(20) | Unique badge number |
| contact | VARCHAR(15) | Contact number |
| department | VARCHAR(50) | Department name |
| join_date | DATE | Date of joining |
| is_active | BOOLEAN | Active status |

**Sample Data**: 5 police officers with different ranks

---

#### **3. Users**
System user accounts linked to police staff.

| Column | Type | Description |
|--------|------|-------------|
| user_id | INT (PK) | Unique user identifier |
| username | VARCHAR(50) | Login username |
| password_hash | VARCHAR(255) | Password (plain text for demo) |
| role_id | INT (FK) | Links to Roles table |
| staff_id | INT (FK) | Links to Police_Staff table |
| created_at | DATETIME | Account creation timestamp |
| last_login | DATETIME | Last login timestamp |

**Current Users**: 4 users (admin_vikram, cid_rajesh, nco_priya, nco_amit)

---

#### **4. Crime_Category**
Categorizes types of crimes with IPC sections.

| Column | Type | Description |
|--------|------|-------------|
| crime_type_id | INT (PK) | Unique crime type identifier |
| ipc_section | VARCHAR(20) | Indian Penal Code section |
| crime_name | VARCHAR(100) | Name of the crime |
| description | TEXT | Detailed description |
| severity_level | INT (1-5) | Severity rating |

**Sample Data**: 7 crime categories (Murder-302, Theft-379, Cheating-420, Assault-354, Rash Driving-336, Cruelty-498A, Rape-376)

---

#### **5. Criminals**
Database of criminal records.

| Column | Type | Description |
|--------|------|-------------|
| criminal_id | INT (PK) | Unique criminal identifier |
| name | VARCHAR(100) | Criminal's name |
| alias | VARCHAR(100) | Known alias/nickname |
| dob | DATE | Date of birth |
| gender | VARCHAR(10) | Gender |
| address | TEXT | Address |
| height_cm | INT | Height in centimeters |
| weight_kg | INT | Weight in kilograms |
| identifying_marks | TEXT | Scars, tattoos, etc. |
| photo_path | VARCHAR(255) | Path to photo |
| case_list | JSON | List of associated cases |
| total_cases | INT | Total number of cases |
| pending_cases | INT | Number of pending cases |
| is_wanted | BOOLEAN | Wanted status |

**Sample Data**: 5 criminals with various profiles

---

#### **6. Cases**
Crime case records with FIR numbers.

| Column | Type | Description |
|--------|------|-------------|
| case_id | INT (PK) | Unique case identifier |
| FIR_number | VARCHAR(50) | Unique FIR number |
| crime_type_id | INT (FK) | Links to Crime_Category |
| primary_accused_id | INT (FK) | Links to Criminals table |
| city | VARCHAR(50) | City where crime occurred |
| district | VARCHAR(50) | District |
| police_station_code | VARCHAR(20) | Police station code |
| latitude | DECIMAL(10,8) | GPS latitude |
| longitude | DECIMAL(11,8) | GPS longitude |
| description | TEXT | Case description |
| date_reported | DATE | Date case was reported |
| status | VARCHAR(30) | Case status (Open, Under Investigation, Closed, Chargesheeted) |

**Sample Data**: 5 cases from Bangalore with different statuses

---

#### **7. FIR (First Information Report)**
Detailed FIR information linked to cases.

| Column | Type | Description |
|--------|------|-------------|
| FIR_number | VARCHAR(50) (PK) | Unique FIR number |
| complainant_name | VARCHAR(100) | Name of complainant |
| complainant_contact | VARCHAR(15) | Contact number |
| complainant_address | TEXT | Address |
| place_of_offence | TEXT | Where crime occurred |
| police_station | VARCHAR(100) | Police station name |
| date_filed | DATETIME | When FIR was filed |
| case_id | INT (FK) | Links to Cases table |

**Sample Data**: 5 FIRs corresponding to the cases

---

#### **8. Investigations**
Investigation details and progress tracking.

| Column | Type | Description |
|--------|------|-------------|
| investigation_id | INT (PK) | Unique investigation identifier |
| case_id | INT (FK) | Links to Cases table |
| assigned_to | INT (FK) | Links to Police_Staff (investigating officer) |
| progress_notes | TEXT | Investigation progress notes |
| evidence_list | TEXT | List of evidence collected |
| final_report | TEXT | Final investigation report |
| last_updated | DATETIME | Last update timestamp |

**Sample Data**: 5 investigations with different progress levels

---

#### **9. Audit_Log**
System activity tracking for accountability.

| Column | Type | Description |
|--------|------|-------------|
| log_id | INT (PK) | Unique log identifier |
| user_id | INT (FK) | User who performed action |
| action | VARCHAR(100) | Action performed |
| table_name | VARCHAR(50) | Table affected |
| record_id | INT | Record ID affected |
| timestamp | DATETIME | When action occurred |

**Purpose**: Tracks all CREATE, UPDATE, DELETE, LOGIN operations

---

## 4. Core Features & Functionalities

### 🔐 **Authentication & Authorization**

#### Login System
- **JWT-based authentication** with 8-hour token expiration
- Secure session management
- Password validation (currently plain text for demo)
- Automatic logout on token expiration

#### Role-Based Access Control (RBAC)
- 4 distinct user roles with different permissions
- Permission-based UI rendering
- Backend API route protection
- Granular access control for each feature

---

### 📊 **Dashboard**

#### Statistics Overview
Displays real-time statistics:
- **Total Cases**: Count of all cases in the system
- **Open Cases**: Cases currently being investigated
- **Wanted Criminals**: Number of criminals with wanted status
- **Active Staff**: Number of active police personnel

#### Recent Cases Table
- Shows last 5 cases registered
- Quick view of FIR number, crime type, location, status, and date
- Color-coded status badges (Yellow=Open, Blue=Under Investigation, Green=Closed)

---

### 📁 **Cases Management**

#### View All Cases
- **Comprehensive case listing** with all details
- **Search functionality**: Search by FIR number or crime type
- **Status filtering**: Filter by case status
- **Detailed information display**:
  - FIR number
  - Crime category and IPC section
  - Location (city, district)
  - Primary accused (if linked)
  - Case status
  - Date reported

#### Edit Case Status
- Update case status (Open → Under Investigation → Closed/Chargesheeted)
- Add/update case description
- Real-time updates across the system

#### Register New FIR
- **Complete FIR registration form**:
  - FIR number (unique identifier)
  - Complainant details (name, contact, address)
  - Crime details (type, location, description)
  - Place of offense
  - Police station information
  - Date and time of filing
- **Automatic case creation** when FIR is registered
- **Validation**: Prevents duplicate FIR numbers

---

### 👤 **Criminal Records Management**

#### View Criminal Database
- **Card-based layout** for easy browsing
- **Criminal profile display**:
  - Full name and alias
  - Photo placeholder
  - Gender and physical attributes
  - Total cases linked
  - Wanted status badge (red highlight)

#### Add New Criminal
- **Comprehensive criminal profile form**:
  - Personal details (name, alias, gender, DOB)
  - Physical description (height, weight)
  - Identifying marks (scars, tattoos)
  - Address and contact
  - Wanted status and reason
  - **Link to existing case** (optional)
- **Automatic case linking**: When linked, updates case with primary accused

#### Edit Criminal Records
- Update wanted status
- Modify criminal information
- Track changes via audit log

---

### 🔍 **Investigations Management**

#### View All Investigations
- **Investigation tracking dashboard**
- **Displays**:
  - Investigation ID
  - Linked case (FIR number)
  - Crime type
  - Assigned investigating officer
  - Investigation status
  - Progress notes
  - Last updated timestamp

#### Create New Investigation
- **Assign investigation to officer**
- **Link to existing case**
- **Add initial investigation notes**
- **Set investigation status** (Open, In Progress, Suspended, Closed)

#### Update Investigation
- **Add progress notes**
- **Update investigation status**
- **Reassign to different officer**
- **Track evidence and findings**
- **Add final report** when investigation concludes

---

### 👮 **Police Staff Management**

#### View All Staff
- **Complete staff directory**
- **Staff information**:
  - Name and badge number
  - Rank (Inspector, Sub-Inspector, Constable, etc.)
  - Department
  - Contact information
  - Join date
  - Active status

#### Add New Staff (Admin/Superintendent only)
- Register new police personnel
- Assign badge numbers
- Set department and rank
- Activate/deactivate staff members

---

### 👥 **User Management** (Admin Only)

#### View All Users
- **User account listing**
- **Displays**:
  - Username
  - Linked staff member
  - Role assignment
  - Badge number
  - Account creation date
  - Last login timestamp
  - Active status

#### Create New User
- Create login accounts for police staff
- Assign roles (Admin, Superintendent, CID, NCO)
- Link to existing staff member
- Set initial password

#### Edit User
- Change user role
- Activate/deactivate accounts
- Update permissions

#### Delete/Deactivate User
- Soft delete (deactivates rather than removes)
- Maintains data integrity
- Logged in audit trail

---

### 📜 **Audit Logs** (Superintendent Only)

#### System Activity Tracking
- **Complete audit trail** of all system actions
- **Logged actions**:
  - User logins
  - Case creation/updates
  - Criminal record changes
  - Investigation assignments
  - FIR registrations
  - User management actions

#### Audit Log Details
- **Who**: User who performed the action
- **What**: Action type (CREATE, UPDATE, DELETE, LOGIN, etc.)
- **When**: Exact timestamp
- **Where**: Table/record affected
- **Record ID**: Specific record modified

#### Benefits
- **Accountability**: Track all user actions
- **Security**: Detect unauthorized access
- **Compliance**: Meet regulatory requirements
- **Debugging**: Troubleshoot data issues

---

## 5. Role-Based Access Control (RBAC)

### Permission Matrix

| Feature | Admin | Superintendent | CID | NCO |
|---------|-------|----------------|-----|-----|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ |
| **View Cases** | ✅ | ✅ | ✅ | ✅ |
| **Create Case/FIR** | ✅ | ❌ | ❌ | ✅ |
| **Edit Case** | ✅ | ✅ | ✅ | ❌ |
| **Delete Case** | ✅ | ❌ | ❌ | ❌ |
| **View Criminals** | ✅ | ✅ | ✅ | ✅ |
| **Create Criminal** | ✅ | ❌ | ✅ | ✅ |
| **Edit Criminal** | ✅ | ✅ | ✅ | ❌ |
| **Delete Criminal** | ✅ | ❌ | ❌ | ❌ |
| **View Investigations** | ✅ | ✅ | ✅ | ✅ |
| **Create Investigation** | ✅ | ❌ | ✅ | ❌ |
| **Edit Investigation** | ✅ | ❌ | ✅ | ❌ |
| **Assign Investigations** | ✅ | ✅ | ❌ | ❌ |
| **View Staff** | ✅ | ✅ | ✅ | ✅ |
| **Manage Staff** | ✅ | ✅ | ❌ | ❌ |
| **User Management** | ✅ | ❌ | ❌ | ❌ |
| **View Audit Logs** | ✅ | ✅ | ❌ | ❌ |
| **System Settings** | ✅ | ❌ | ❌ | ❌ |

### Role Descriptions

#### **1. Admin (Administrator)**
- **Full system access** - All permissions
- **User management** - Create, edit, delete users
- **System configuration** - Manage settings
- **Complete CRUD** operations on all entities
- **Example**: Police IT Administrator, System Manager

#### **2. Superintendent**
- **Oversight and monitoring** role
- **View audit logs** for accountability
- **Assign cases and investigations**
- **Generate reports** (future feature)
- **Approve critical actions**
- **Cannot create/delete** records, only view and assign
- **Example**: Police Station Superintendent, Senior Officer

#### **3. CID (Criminal Investigation Department)**
- **Investigation-focused** role
- **Create and manage investigations**
- **Create and edit criminal records**
- **Update case status**
- **Add evidence and reports**
- **Cannot manage users or staff**
- **Example**: Detective, Investigating Officer

#### **4. NCO (Non-Commissioned Officer / Station Writer)**
- **Data entry** role
- **Register FIRs** (primary responsibility)
- **Create cases** from complaints
- **Create criminal records** (basic entry)
- **View-only** for investigations
- **Cannot edit** existing cases or criminals
- **Example**: Station Writer, Desk Officer, Constable

---

## 6. User Interface

### Design Principles

#### **Modern & Professional**
- Clean, gradient-based design
- Blue color scheme (police/authority theme)
- Card-based layouts for better organization
- Responsive design (works on desktop, tablet, mobile)

#### **User-Friendly**
- Intuitive navigation sidebar
- Clear action buttons
- Search and filter capabilities
- Modal-based forms (non-intrusive)
- Color-coded status indicators

#### **Security-Focused**
- Secure login page
- Session timeout handling
- Role-based UI rendering (users only see what they can access)
- Logout confirmation

### Key UI Components

#### **Login Page**
- Gradient background (blue theme)
- CRMS logo with shield icon
- Username and password fields
- Demo credentials display
- Error message display

#### **Sidebar Navigation**
- User profile display (name, badge, department)
- Role indicator
- Menu items (filtered by permissions)
- Active page highlighting
- Logout button at bottom

#### **Dashboard Cards**
- Gradient stat cards with icons
- Large numbers for quick viewing
- Color-coded by metric type
- Hover effects for interactivity

#### **Data Tables**
- Sortable columns
- Search functionality
- Action buttons (Edit, View, Delete)
- Status badges
- Pagination (for large datasets)

#### **Forms & Modals**
- Centered modal overlays
- Clear field labels
- Required field indicators (*)
- Validation messages
- Submit and cancel buttons

---

## 7. API Endpoints

### Authentication
- `POST /api/auth/login` - User login with JWT token generation

### Cases
- `GET /api/cases` - Get all cases (with search/filter)
- `GET /api/cases/:id` - Get specific case details
- `GET /api/cases/active` - Get active cases (for linking)
- `PUT /api/cases/:id` - Update case status/description

### Criminals
- `GET /api/criminals` - Get all criminal records
- `POST /api/criminals` - Create new criminal record
- `PUT /api/criminals/:id` - Update criminal (wanted status)

### Investigations
- `GET /api/investigations` - Get all investigations
- `POST /api/investigations` - Create new investigation
- `PUT /api/investigations/:id` - Update investigation progress

### Police Staff
- `GET /api/staff` - Get all police staff
- `POST /api/staff` - Add new staff member (Admin/Superintendent)

### User Management (Admin Only)
- `GET /api/users` - Get all system users
- `POST /api/users` - Create new user account
- `PUT /api/users/:id` - Update user role/status
- `DELETE /api/users/:id` - Deactivate user account

### Audit Logs (Superintendent Only)
- `GET /api/audit-logs` - Get system audit logs (last 500 entries)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Crime Categories
- `GET /api/crime-categories` - Get all crime types with IPC sections

### FIR Registration
- `POST /api/fir` - Register new FIR (creates case + FIR entry)

### Roles
- `GET /api/roles` - Get all available roles

---

## 8. Demo Credentials

### Test Users

| Username | Password | Role | Staff Name | Department |
|----------|----------|------|------------|------------|
| `admin_vikram` | `secret123` | Admin | Vikram Rao | Administration |
| `cid_rajesh` | `secret123` | CID | Rajesh Kumar | CID |
| `nco_priya` | `secret123` | NCO | Priya Sharma | Crime Branch |
| `nco_amit` | `secret123` | NCO | Amit Singh | Patrol |

### Sample Data Available

- **5 Cases** - Various crime types and statuses
- **5 Criminals** - Different profiles with wanted status
- **5 Investigations** - Linked to cases with progress notes
- **5 Police Staff** - Different ranks and departments
- **7 Crime Categories** - IPC sections 302, 379, 420, 354, 336, 498A, 376

---

## 9. Key Highlights

### ✨ **Strengths of the System**

#### **1. Comprehensive Crime Management**
- End-to-end workflow from FIR registration to case closure
- Links criminals, cases, investigations, and officers
- Maintains data integrity with foreign key relationships

#### **2. Role-Based Security**
- Granular permission control
- Prevents unauthorized access
- Audit trail for accountability

#### **3. Real-Time Updates**
- Dashboard statistics update automatically
- Case status changes reflect immediately
- Investigation progress tracked in real-time

#### **4. User-Friendly Interface**
- Intuitive design for non-technical police staff
- Quick search and filter capabilities
- Mobile-responsive for field use

#### **5. Data Integrity**
- MySQL constraints prevent invalid data
- Foreign key relationships maintain consistency
- Unique constraints on FIR numbers and badge numbers

#### **6. Scalability**
- Connection pooling for database efficiency
- RESTful API architecture
- Modular codebase for easy expansion

### 🎯 **Use Cases**

#### **Scenario 1: Registering a New Crime**
1. NCO officer logs in
2. Citizen reports a theft
3. NCO registers FIR with complainant details
4. System creates case automatically
5. CID officer can view and create investigation
6. Investigation assigned to detective
7. Criminal identified and added to database
8. Criminal linked to case as primary accused
9. Investigation updated with progress
10. Case status changed to "Chargesheeted"
11. All actions logged in audit trail

#### **Scenario 2: Tracking Wanted Criminals**
1. CID officer marks criminal as "wanted"
2. Dashboard shows updated wanted criminal count
3. All officers can view wanted status
4. When arrested, status updated
5. Linked to new case if applicable

#### **Scenario 3: Administrative Oversight**
1. Superintendent logs in
2. Views dashboard statistics
3. Checks audit logs for user activity
4. Assigns investigation to available officer
5. Monitors case progress
6. Generates reports (future feature)

### 🚀 **Future Enhancements** (Suggestions)

- **Report Generation**: PDF reports for cases, criminals, investigations
- **Advanced Search**: Multi-criteria search across all entities
- **Document Upload**: Attach evidence photos, documents to cases
- **Notifications**: Email/SMS alerts for case updates
- **Analytics Dashboard**: Charts and graphs for crime trends
- **Mobile App**: Native mobile application for field officers
- **Biometric Integration**: Fingerprint/face recognition for criminals
- **GIS Mapping**: Crime hotspot mapping with GPS coordinates
- **Case Assignment Automation**: AI-based officer assignment
- **Multi-language Support**: Regional language support

---

## 📝 Presentation Tips

### **Opening**
1. Start with the problem: Manual crime record management is inefficient
2. Introduce CRMS as the digital solution
3. Show the login page and explain security

### **Demo Flow**
1. **Login** as Admin (show full access)
2. **Dashboard** - Explain statistics
3. **Cases** - Show search, create FIR, edit case
4. **Criminals** - Add new criminal, link to case
5. **Investigations** - Create investigation, assign officer
6. **Staff** - Show police personnel management
7. **Users** - Demonstrate user management (Admin only)
8. **Audit Logs** - Show accountability features
9. **Logout and re-login** as different role (CID) to show RBAC

### **Technical Highlights**
- Mention full-stack development (React + Express + MySQL)
- Explain JWT authentication
- Highlight role-based access control
- Show database relationships
- Mention RESTful API architecture

### **Closing**
- Summarize key features
- Emphasize security and accountability
- Mention scalability and future enhancements
- Thank the audience

---

## 🎓 Technical Concepts to Explain

### **JWT Authentication**
- Token-based authentication (no sessions)
- Secure, stateless
- 8-hour expiration for security

### **RESTful API**
- Standard HTTP methods (GET, POST, PUT, DELETE)
- JSON data format
- Stateless communication

### **Role-Based Access Control (RBAC)**
- Permissions assigned to roles, not individual users
- Easier to manage as organization grows
- Industry standard for enterprise applications

### **Database Normalization**
- Data organized into related tables
- Reduces redundancy
- Maintains data integrity

### **Connection Pooling**
- Reuses database connections
- Improves performance
- Handles concurrent users efficiently

---

## 📊 Project Statistics

- **Total Lines of Code**: ~2,800+ lines
- **Frontend Components**: 10+ React components
- **Backend API Endpoints**: 20+ routes
- **Database Tables**: 8 tables
- **User Roles**: 4 distinct roles
- **Sample Data**: 30+ records across all tables
- **Technologies Used**: 10+ (React, Express, MySQL, JWT, Tailwind, etc.)

---

**Good luck with your presentation! 🎉**
