# API Documentation - ArmourLink

All API requests should be sent to the base URL:
`http://localhost:5001`

Protected endpoints require the JWT to be supplied in the header:
`Authorization: Bearer <your_jwt_token>`

---

## 🔑 Authentication Endpoints

### 1. User Login
Authenticate credentials and obtain a JWT session token.
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "admin@safety.com",
    "password": "admin123"
  }
  ```
- **Response**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "78a9c2d1-...",
      "email": "admin@safety.com",
      "name": "System Admin",
      "role": "ADMIN",
      "siteId": null,
      "site": null
    }
  }
  ```

### 2. Current Session Profile
Retrieve profile data for the active authenticated token.
- **Endpoint**: `GET /api/auth/me`
- **Headers**: Authorization header required.
- **Response**: Returns matching user object.

---

## 📈 Dashboard Endpoints

### 1. Administrator Dashboard Metrics
Retrieve total metadata and chart arrays.
- **Endpoint**: `GET /api/dashboard/admin`
- **Access Control**: Admin Only.
- **Response**:
  - `metrics`: Counts for sites, supervisors, workers, open violations, and escalated alerts.
  - `charts`: Arrays for `violationsByDepartment`, `violationsByType`, and `violationsTrend` (7 days).
  - `simulationSettings`: Active parameters.

### 2. Supervisor Site Dashboard
Retrieve metrics and recent violations for the supervisor's site.
- **Endpoint**: `GET /api/dashboard/supervisor`
- **Access Control**: Supervisor Only.
- **Response**:
  - `site`: Site location information.
  - `metrics`: Active worker, open violation, and resolved violation counts.
  - `recentViolations`: Array of the 10 most recent violation objects.

---

## ⚠️ Violations Endpoints

### 1. List Violations
Query the violations feed.
- **Endpoint**: `GET /api/violations`
- **Access Control**: Authenticated.
- **Query Parameters**:
  - `isAcknowledged` (boolean, optional): Filter by resolution status.
  - `siteId` (UUID, optional): Filter by site. (Supervisors are locked to their own siteId).
  - `escalatedOnly` (boolean, optional): Returns unacknowledged alerts older than the timeout.
- **Response**: Array of violation objects.

### 2. Acknowledge Violation
Resolve a safety incident.
- **Endpoint**: `PUT /api/violations/:id/acknowledge`
- **Access Control**: Authenticated. (Supervisors can only acknowledge their own site's violations).
- **Response**: Updated violation object containing `acknowledgedBy` and `acknowledgedAt` timestamps.

### 3. Export Violations Report (CSV)
Downloads all violations as a formatted CSV spreadsheet.
- **Endpoint**: `GET /api/violations/export`
- **Response**: Returns file attachment stream (`violations_report_[timestamp].csv`).

---

## 👥 User & Site Management

### 1. List Client Sites
- **Endpoint**: `GET /api/sites`
- **Response**: List of all configured construction/factory sites.

### 2. Create Supervisor Account
Register a supervisor and assign them to a client site.
- **Endpoint**: `POST /api/users/supervisors`
- **Access Control**: Admin Only.
- **Request Body**:
  ```json
  {
    "name": "Anjali Gupta",
    "email": "supervisor2@safety.com",
    "password": "super123",
    "siteId": "a90df2b8-..."
  }
  ```

### 3. List Registered Supervisors
- **Endpoint**: `GET /api/users/supervisors`
- **Access Control**: Admin Only.

---

## ⚙️ Simulator Control Endpoints

### 1. Get Simulator Settings
- **Endpoint**: `GET /api/simulator/settings`

### 2. Configure Simulator
Adjust background runner parameters dynamically.
- **Endpoint**: `POST /api/simulator/configure`
- **Request Body**:
  ```json
  {
    "isActive": true,
    "intervalSeconds": 20,
    "escalationTimeoutSeconds": 600
  }
  ```

### 3. Dispatch Manual Incident
Instantly trigger a violation for testing.
- **Endpoint**: `POST /api/simulator/trigger`
- **Request Body** (optional):
  ```json
  {
    "workerId": "WRK0005"
  }
  ```

---

## 🔌 WebSocket Gateway

Establish WebSocket connections at:
`ws://localhost:5001?token=<your_jwt_token>`

### Message Format Broadcasted:
```json
{
  "type": "NEW_VIOLATION | VIOLATION_ACKNOWLEDGED | VIOLATION_ESCALATED",
  "data": { ...violationObject }
}
```
*Note: The WebSocket gateway automatically filters broadcasts. Supervisors only receive payloads that occurred at their assigned site. Admins receive all messages.*
