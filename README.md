# ArmourLink | PPE Compliance & Workforce Operations Portal

ArmourLink is a responsive, real-time full-stack web application designed to manage workforce operations and monitor PPE (Personal Protective Equipment) compliance. Workers are monitored by virtual IoT sensors that send telemetry events when safety violations occur (e.g., missing helmets, safety vests, harness, boots, or gloves).

---

## Key Features

1. **Role-Based Portals**:
   - **Administrators**: Multi-site dashboard, supervisor registration and site allocation, dynamic escalation tracking, and visual analytics (violations by department, violation type breakdown, and compliance trends).
   - **Site Supervisors**: Site-specific metrics, active violations feed with instant WebSocket updates, single-click acknowledgment, and CSV reports generation.
2. **IoT Simulation Engine**:
   - Background event runner that dispatches randomized safety violations.
   - Interactive **Simulator Widget** in the UI to toggle play/pause, accelerate time (dilating 10-minute escalations to 10-seconds for quick verification), or manually dispatch violations to any specific worker.
3. **Escalation Rules**:
   - Safety violations are routed immediately to the assigned site supervisor.
   - If a supervisor fails to acknowledge a violation within **10 minutes** (configurable), the incident escalates directly to the Administrator's "Escalated Alerts" panel in real-time.

---

## Technical Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Styling**: Premium custom CSS (Glassmorphism & animations)
- **Database & ORM**: PostgreSQL + Prisma ORM
- **Authentication**: JWT (JSON Web Tokens) with Role Guards & bcrypt
- **Real-Time Data**: WebSockets (`ws` library)

---

## Setup and Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL server active on localhost (default: port 5432)

### 1. Database Setup
Ensure that a local PostgreSQL database server is running. By default, the application is configured to connect to your local PostgreSQL server:
- **User**: `piyushvarshney`
- **Port**: `5432`
- **Database Name**: `ppe_compliance` (Prisma will automatically create this database if it doesn't exist).

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Confirm the `.env` file exists and has the correct PostgreSQL credentials:
   ```env
   DATABASE_URL="postgresql://piyushvarshney@localhost:5432/ppe_compliance?schema=public"
   PORT=5001
   JWT_SECRET="safety-compliance-jwt-secret-key-2026"
   ```
3. Run the database migration and seed script. This parses `/Users/piyushvarshney/Desktop/AyantrAi_Test/workers_dataset.xlsx` and seeds the 100 workers across 3 default sites, along with Admin and Supervisor accounts:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Start the backend developer API server:
   ```bash
   npm run dev
   ```
   *The backend will boot on `http://localhost:5001` and open a WebSocket channel on the same port.*

### 3. Frontend Setup
1. In a new terminal window, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The frontend will boot on `http://localhost:5173`.*

---

## Verification & Walkthrough Instructions

### Pre-Seeded Accounts
We preseeded the database with testing credentials. Click the **Quick Test Credentials** buttons on the Login page to instantly autofill them:
- **System Admin**:
  - Email: `admin@safety.com`
  - Password: `admin123`
- **Site Supervisor (Site: Main Factory Floor)**:
  - Email: `supervisor1@safety.com`
  - Password: `super123`

### Step-by-Step Verification Flow

1. **Simulate a Violation**:
   - Log in as the Supervisor (`supervisor1@safety.com` / `super123`).
   - Observe the dashboard metrics showing active workers assigned to the **Main Factory Floor**.
   - Open the **IoT Device Simulator** panel in the bottom-right corner.
   - Set the **Escalation Timeout** to `10s` (to test the 10-minute rule instantly).
   - Select a worker or select `-- Random Worker --` and click **Dispatch Simulated Incident**.
   - Observe the incident instantly appear in the supervisor's active violations feed.

2. **Verify Escalation to Admin**:
   - Open a separate browser window (e.g. incognito) and log in as the Admin (`admin@safety.com` / `admin123`).
   - Select the **Escalated Alerts** tab.
   - Do NOT acknowledge the violation in the Supervisor view.
   - Wait **10 seconds** (the accelerated timeout set in the widget).
   - Observe that the violation is pushed in real-time to the Admin's **Escalated Alerts** tab.

3. **Verify Acknowledgment**:
   - In the Supervisor view, click the green **Acknowledge** button on the violation.
   - Observe that the violation instantly disappears from the Supervisor's open queue.
   - Check the Admin's window; see that it has also disappeared from the escalated queue in real-time.
   - Return to the Admin's **Data Insights** tab to observe updated analytics charts!
