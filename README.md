# 🛡️ Crime Records Management System (CRMS)

**A secure, role-based platform for modernizing police investigations and record-keeping.**

The **Crime Records Management System (CRMS)** is a comprehensive full-stack solution designed to streamline law enforcement operations. It digitizes the entire lifecycle of criminal justice processes—from the initial FIR registration and case assignment to investigation tracking and final case closure. By providing a centralized, secure database, CRMS enhances collaboration between departments (CID, NCO, Superintendents) and ensures data integrity through strict role-based access control and audit logging.

---

## 🚀 Key Features

### 📂 Case & Investigation Management
*   **Digital FIR Registration:** Rapidly log First Information Reports with automated case creation.
*   **Case Lifecycle Tracking:** Monitor cases through statuses (Open, Under Investigation, Chargesheeted, Closed).
*   **Investigation Modules:** Assign officers, record progress notes, and manage evidence logs.
*   **Advanced Search:** Filter cases by FIR number, crime type, status, or location.

### 👥 Criminal Record Database
*   **Detailed Profiles:** Store personal details, physical attributes (biometrics), and known aliases.
*   **Case Linking:** Associate criminals with specific cases as primary accused or suspects.
*   **Status Management:** Toggle "Wanted" status and track arrest history.

### 🔐 Security & Administration
*   **Role-Based Access Control (RBAC):** Distinct portals for Admins, Superintendents, CIDs, and NCOs with granular permissions.
*   **Audit Trails:**Immutable logs of all sensitive actions (views, edits, deletions) for accountability.
*   **Secure Authentication:** JWT-based session management.

### 📊 Real-Time Analytics
*   **Interactive Dashboard:** Visualizing crime trends, open case counts, and officer workload.
*   **Resource Management:** Track active police staff and departmental assignments.

---

## 🛠️ Technology Stack

*   **Frontend:** React.js, Tailwind CSS, Lucide React
*   **Backend:** Node.js, Express.js
*   **Database:** MySQL
*   **Authentication:** JSON Web Tokens (JWT)

---

## ⚙️ Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/saanvi-chauhan/crms.git
    cd crms
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    # Configure your .env file with DB details
    npm start
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm start
    ```

4.  **Database**
    *   Import the provided SQL schema to initialize the MySQL database.
