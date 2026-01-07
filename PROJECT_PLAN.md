# Check-In/Check-Out System - Project Plan & Documentation

## 1. Project Overview

### Purpose
A simple time tracking system that allows employees to check in and check out, view their attendance records by month, with future admin capabilities.

### Key Features (Phase 1)
- User authentication (username/password)
- Extended session duration (up to 30 days) - suitable for intranet environment
- Change password functionality
- Manual logout option
- Check-in/check-out functionality
- Automatic handling of forgotten check-outs (allow check-in next day)
- Monthly attendance view
- Month selection filter

### Future Features (Phase 2+)
- Admin account and dashboard
- User management
- Reports and analytics
- Export functionality

### Intranet Environment Considerations
Since this system operates in a closed corporate network:
- Extended JWT token expiration (30 days) for reduced login friction
- Tokens stored securely in browser (httpOnly cookies or secure localStorage)
- Less aggressive token refresh requirements
- Trust internal network security measures

---

## 2. Technical Stack

### Frontend
- **Framework**: Next.js 14.0.3 with React 18.2.0
- **Language**: TypeScript 5.2.2
- **UI Framework**: Material-UI (MUI) v5.15.20
  - `@mui/material` - Core components
  - `@mui/icons-material` - Icons
  - `@mui/x-date-pickers` - Month/date picker
- **State Management**:
  - React Context API for user authentication
  - Redux Toolkit for app state (if needed)
- **HTTP Client**: Axios 1.5.1 with interceptors
- **Form Management**: Formik 2.4.5 + Yup 0.32.11 for validation
- **Port**: 3000 (internal), exposed via Nginx

### Backend
- **Language**: Go 1.23+
- **Web Framework**: Iris v12
- **Database Driver**: lib/pq (PostgreSQL)
- **Query Builder**: sqlx
- **Authentication**: JWT (golang-jwt/jwt)
- **Password Hashing**: golang.org/x/crypto/bcrypt
- **Validation**: go-playground/validator
- **Logging**: go.uber.org/zap
- **Port**: 8080 (internal)

### Database
- **DBMS**: PostgreSQL 16
- **Migration Tool**: sql-migrate
- **Port**: 5432 (internal), 5433 (external for dev)

### Cache (Optional for Phase 1, Recommended for Phase 2)
- **Cache**: Redis 7-alpine
- **Port**: 6379 (internal), 6380 (external for dev)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Deployment**: Staging and Production environments

---

## 3. Database Schema Design

### 3.1 Custom Types (ENUM)

```sql
-- Employee role enumeration
CREATE TYPE employee_role AS ENUM ('STAFF', 'ADMIN');

-- Attendance record status
CREATE TYPE attendance_status AS ENUM ('CHECKED_IN', 'CHECKED_OUT', 'AUTO_CLOSED');
```

### 3.2 Tables

#### employees
Stores user account information.

```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role employee_role DEFAULT 'STAFF' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_employees_username ON employees(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_email ON employees(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_is_active ON employees(is_active) WHERE deleted_at IS NULL;
```

#### attendance_records
Stores check-in and check-out events.

```sql
CREATE TABLE attendance_records (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE,
    status attendance_status DEFAULT 'CHECKED_IN' NOT NULL,
    check_in_note TEXT,
    check_out_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_attendance_employee_id ON attendance_records(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_check_in_time ON attendance_records(check_in_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_status ON attendance_records(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_employee_month ON attendance_records(employee_id, check_in_time) WHERE deleted_at IS NULL;
```

### 3.3 Seed Data

```sql
-- Default admin user (password: admin123)
-- Password hash generated with bcrypt cost 10
INSERT INTO employees (username, name, email, role, password_hash)
VALUES (
    'admin',
    'System Administrator',
    'admin@clock.local',
    'ADMIN',
    '$2a$10$XxxxxxHashedPasswordHerexxxxxxx' -- Actual hash to be generated during migration
);

-- Sample staff user (password: staff123)
INSERT INTO employees (username, name, email, role, password_hash)
VALUES (
    'john.doe',
    'John Doe',
    'john.doe@clock.local',
    'STAFF',
    '$2a$10$XxxxxxHashedPasswordHerexxxxxxx' -- Actual hash to be generated during migration
);
```

### 3.4 Database Functions & Triggers

```sql
-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for employees table
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for attendance_records table
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 4. API Design

### 4.1 API Base Path
All APIs will be versioned: `/api/v1/*`

### 4.2 Public Endpoints (No Authentication Required)

#### POST /api/v1/auth/login
Login with username and password.

**Request:**
```json
{
  "username": "john.doe",
  "password": "staff123"
}
```

**Response (Success - 200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "employee": {
    "id": 2,
    "username": "john.doe",
    "name": "John Doe",
    "email": "john.doe@clock.local",
    "role": "STAFF"
  }
}
```

**Response (Error - 401):**
```json
{
  "error": "Invalid username or password"
}
```

### 4.3 Protected Endpoints (JWT Required)

#### POST /api/v1/attendance/check-in
Record a check-in event.

**Business Logic:**
- If user has an active check-in from a previous day, automatically close it with status 'AUTO_CLOSED' before creating new check-in
- If user has an active check-in from today (same day), return error
- Otherwise, create new check-in record

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
  "note": "Started work"
}
```

**Response (Success - 201):**
```json
{
  "id": 123,
  "employee_id": 2,
  "check_in_time": "2026-01-05T08:30:00Z",
  "status": "CHECKED_IN",
  "note": "Started work",
  "previous_record_auto_closed": false
}
```

**Response (Success with Auto-Close - 201):**
```json
{
  "id": 124,
  "employee_id": 2,
  "check_in_time": "2026-01-05T08:30:00Z",
  "status": "CHECKED_IN",
  "note": "Started work",
  "previous_record_auto_closed": true,
  "auto_closed_record": {
    "id": 123,
    "check_in_time": "2026-01-04T08:30:00Z",
    "status": "AUTO_CLOSED"
  }
}
```

**Response (Error - 400):**
```json
{
  "error": "You already have an active check-in today. Please check out first."
}
```

#### POST /api/v1/attendance/check-out
Record a check-out event.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
  "note": "End of work day"
}
```

**Response (Success - 200):**
```json
{
  "id": 123,
  "employee_id": 2,
  "check_in_time": "2026-01-05T08:30:00Z",
  "check_out_time": "2026-01-05T17:30:00Z",
  "status": "CHECKED_OUT",
  "check_in_note": "Started work",
  "check_out_note": "End of work day"
}
```

**Response (Error - 400):**
```json
{
  "error": "No active check-in found"
}
```

#### GET /api/v1/attendance/status
Get current check-in status for logged-in user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Checked In - 200):**
```json
{
  "is_checked_in": true,
  "current_record": {
    "id": 123,
    "check_in_time": "2026-01-05T08:30:00Z",
    "status": "CHECKED_IN"
  }
}
```

**Response (Not Checked In - 200):**
```json
{
  "is_checked_in": false,
  "current_record": null
}
```

#### GET /api/v1/attendance/records
Get attendance records for logged-in user with optional month filter.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `year` (optional): Integer, e.g., 2026
- `month` (optional): Integer, 1-12

**Example:**
```
GET /api/v1/attendance/records?year=2026&month=1
```

**Response (Success - 200):**
```json
{
  "records": [
    {
      "id": 123,
      "check_in_time": "2026-01-05T08:30:00Z",
      "check_out_time": "2026-01-05T17:30:00Z",
      "status": "CHECKED_OUT",
      "check_in_note": "Started work",
      "check_out_note": "End of work day"
    },
    {
      "id": 122,
      "check_in_time": "2026-01-04T08:25:00Z",
      "check_out_time": "2026-01-04T17:35:00Z",
      "status": "CHECKED_OUT"
    }
  ],
  "total": 2
}
```

#### POST /api/v1/auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### PUT /api/v1/auth/change-password
Change user's password (requires authentication).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
  "current_password": "old_password",
  "new_password": "new_password"
}
```

**Response (Success - 200):**
```json
{
  "message": "Password changed successfully"
}
```

**Response (Error - 400):**
```json
{
  "error": "Current password is incorrect"
}
```

**Response (Error - 400):**
```json
{
  "error": "New password must be at least 6 characters"
}
```

#### POST /api/v1/auth/logout
Logout user (invalidate tokens if needed, mainly for client-side token cleanup).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Logged out successfully"
}
```

### 4.4 Admin Endpoints (Phase 2)

To be designed in Phase 2. Potential endpoints:
- `GET /api/v1/admin/employees` - List all employees
- `POST /api/v1/admin/employees` - Create employee
- `PUT /api/v1/admin/employees/:id` - Update employee
- `DELETE /api/v1/admin/employees/:id` - Soft delete employee
- `GET /api/v1/admin/attendance/records` - View all attendance records
- `GET /api/v1/admin/reports/monthly` - Monthly reports

---

## 5. Frontend Architecture

### 5.1 Directory Structure

```
clock-frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx              # Login page
│   │   │   └── layout.tsx                # Auth layout (minimal)
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                # Dashboard layout (header, sidebar)
│   │   │   ├── page.tsx                  # Main dashboard (redirect to attendance)
│   │   │   ├── attendance/
│   │   │   │   └── page.tsx              # Attendance tracking page
│   │   │   └── settings/
│   │   │       └── page.tsx              # User settings (password change)
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Landing page (redirect to login)
│   │   └── globals.css
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx             # Login form component
│   │   │   └── ChangePasswordForm.tsx    # Change password form
│   │   ├── attendance/
│   │   │   ├── CheckInButton.tsx         # Check-in action button
│   │   │   ├── CheckOutButton.tsx        # Check-out action button
│   │   │   ├── AttendanceStatus.tsx      # Current status display
│   │   │   ├── AttendanceTable.tsx       # Table of records
│   │   │   └── MonthSelector.tsx         # Month picker
│   │   ├── layout/
│   │   │   ├── Header.tsx                # App header with logout
│   │   │   └── Sidebar.tsx               # Navigation sidebar (future)
│   │   └── shared/
│   │       ├── Loading.tsx               # Loading spinner
│   │       └── ErrorMessage.tsx          # Error display
│   ├── context/
│   │   └── AuthContext.tsx               # User authentication context
│   ├── services/
│   │   ├── api.ts                        # Axios instance with interceptors
│   │   ├── authService.ts                # Auth API calls
│   │   └── attendanceService.ts          # Attendance API calls
│   ├── types/
│   │   ├── auth.ts                       # Auth-related types
│   │   └── attendance.ts                 # Attendance-related types
│   └── utils/
│       ├── dateUtils.ts                  # Date formatting utilities
│       └── tokenUtils.ts                 # JWT token handling
├── public/
│   └── assets/
├── .env.local
├── .env.production
├── next.config.js
├── package.json
├── tsconfig.json
└── Dockerfile
```

### 5.2 Key Frontend Components

#### LoginForm Component
- Material-UI TextField for username and password
- Formik for form state management
- Yup for validation
- Error display for invalid credentials
- Loading state during login

#### Attendance Page
- Display current check-in status
- Check-in button (disabled if already checked in)
- Check-out button (disabled if not checked in)
- Month selector (Material-UI DatePicker)
- Table showing attendance records for selected month
- Auto-refresh status every 30 seconds

#### AttendanceTable Component
- Material-UI Table/DataGrid
- Columns: Date, Check-In Time, Check-Out Time, Duration, Notes
- Formatted timestamps
- Calculate work duration
- Responsive design

#### Header Component
- Display logged-in user name
- Logout button
- Current date/time display (optional)

### 5.3 State Management

#### AuthContext
```typescript
interface AuthContextType {
  user: Employee | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

#### Attendance State (Component-level)
```typescript
interface AttendanceState {
  records: AttendanceRecord[];
  currentStatus: AttendanceStatus | null;
  selectedMonth: Date;
  isLoading: boolean;
  error: string | null;
}
```

### 5.4 Routing & Protection

- `/login` - Public route
- `/` - Redirect to `/attendance` if authenticated, `/login` if not
- `/attendance` - Protected route, shows attendance tracking page

Route protection via middleware or layout-level checks using AuthContext.

---

## 6. Backend Architecture

### 6.1 Directory Structure

```
clock-backend/
├── cmd/
│   └── main.go                           # Application entry point
├── pkg/
│   ├── handlers/
│   │   ├── handler.go                    # Base handler setup
│   │   ├── auth.go                       # Authentication handlers
│   │   └── attendance.go                 # Attendance handlers
│   ├── models/
│   │   ├── employee.go                   # Employee model
│   │   └── attendance.go                 # Attendance model
│   ├── services/
│   │   ├── auth.go                       # Authentication service
│   │   └── attendance.go                 # Attendance service
│   ├── middleware/
│   │   └── middleware.go                 # JWT auth, CORS, rate limiting
│   ├── database/
│   │   └── postgres.go                   # PostgreSQL connection
│   ├── reqres/
│   │   ├── auth.go                       # Auth request/response DTOs
│   │   └── attendance.go                 # Attendance request/response DTOs
│   ├── errors/
│   │   └── errors.go                     # Custom error types
│   └── utils/
│       ├── jwt.go                        # JWT utilities
│       ├── password.go                   # Password hashing utilities
│       └── validator.go                  # Validation utilities
├── router/
│   └── router.go                         # Route setup and middleware
├── migrations/
│   └── 20260105000001-initial-schema.sql # Initial database schema
├── config/
│   └── config.go                         # Configuration management
├── scripts/
│   └── generate_password.go              # Utility to generate bcrypt hashes
├── .env
├── .env.staging
├── .env.production
├── Dockerfile
├── docker-entrypoint.sh
├── go.mod
└── go.sum
```

### 6.2 Key Backend Components

#### JWT Middleware
- Extract token from `Authorization: Bearer <token>` header
- Validate token signature and expiration
- Extract employee info from claims
- Inject employee info into Iris context
- Return 401 if invalid/expired

#### Authentication Service
- `Login(username, password)` - Validate credentials, return JWT with extended expiration
- `ValidateToken(token)` - Validate JWT and return employee info
- `RefreshToken(refreshToken)` - Generate new access token
- `ChangePassword(employeeID, currentPassword, newPassword)` - Change user password
- `Logout(employeeID)` - Optional server-side cleanup

#### Attendance Service
- `CheckIn(employeeID, note)` - Create check-in record, auto-close previous day's forgotten check-out
- `CheckOut(employeeID, note)` - Update record with check-out time
- `GetCurrentStatus(employeeID)` - Get active check-in status
- `GetRecords(employeeID, year, month)` - Retrieve attendance records
- `AutoCloseForgottenCheckIn(employeeID)` - Auto-close check-in from previous days

### 6.3 Middleware Stack

1. **CORS Middleware** - Allow frontend origin
2. **Security Headers Middleware** - X-Content-Type-Options, X-Frame-Options, etc.
3. **Rate Limiting Middleware** - 100 requests/minute per IP (general), 10 requests/minute for login
4. **JWT Auth Middleware** - Protect routes, extract employee info

### 6.4 Business Rules

1. **Check-In Rules:**
   - If user has active check-in from a **previous day** (not today):
     - Auto-close that record with status='AUTO_CLOSED' and check_out_time=NULL
     - Create new check-in for today
     - Return both the new record and info about auto-closed record
   - If user has active check-in from **today** (same calendar day):
     - Return error: "You already have an active check-in today"
   - Otherwise:
     - Create new check-in record with status='CHECKED_IN'

2. **Check-Out Rules:**
   - Employee must have an active check-in (status='CHECKED_IN') to check out
   - Check-in must be from today (same calendar day)
   - Update the existing record's `check_out_time` to current timestamp
   - Update status to 'CHECKED_OUT'
   - If no active check-in found, return error

3. **Records Query:**
   - Default to current month if no filter provided
   - Return records ordered by check_in_time DESC
   - Only show user's own records (enforce at service layer via JWT employee_id)
   - Include all statuses: CHECKED_IN, CHECKED_OUT, AUTO_CLOSED

4. **Password Change Rules:**
   - Validate current password before allowing change
   - New password must be at least 6 characters
   - Hash new password with bcrypt before storing
   - Optional: Invalidate all existing tokens (force re-login)

5. **Session/Token Rules (Intranet Environment):**
   - Access token expiration: 30 days (2,592,000 seconds)
   - Refresh token expiration: 30 days (same as access for simplicity)
   - Token stored in browser localStorage or httpOnly cookie
   - Automatic token refresh not strictly needed due to long expiration

6. **Soft Delete:**
   - Use `deleted_at IS NULL` filter in all queries
   - Admin can soft-delete records (Phase 2)

---

## 7. Docker Setup

### 7.1 Docker Compose - Development

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: clock_postgres_dev
    environment:
      POSTGRES_USER: clock_user
      POSTGRES_PASSWORD: clock_pass
      POSTGRES_DB: clock
    ports:
      - "5433:5432"
    volumes:
      - clock_postgres_data:/var/lib/postgresql/data
    networks:
      - clock_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U clock_user -d clock"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./clock-backend
      dockerfile: Dockerfile
    container_name: clock_backend_dev
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=clock_user
      - DB_PASSWORD=clock_pass
      - DB_NAME=clock
      - JWT_SECRET=your-secret-key-change-in-production
      - JWT_REFRESH_SECRET=your-refresh-secret-key
      - PORT=8080
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - clock_network
    volumes:
      - ./clock-backend:/app
    restart: unless-stopped

  frontend:
    build:
      context: ./clock-frontend
      dockerfile: Dockerfile.dev
    container_name: clock_frontend_dev
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - clock_network
    volumes:
      - ./clock-frontend:/app
      - /app/node_modules
    restart: unless-stopped

networks:
  clock_network:
    driver: bridge

volumes:
  clock_postgres_data:
```

### 7.2 Docker Compose - Staging

**File:** `docker-compose.staging.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: clock_postgres_staging
    environment:
      POSTGRES_USER: clock_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: clock
    ports:
      - "5434:5432"
    volumes:
      - clock_postgres_staging_data:/var/lib/postgresql/data
    networks:
      - clock_internal_staging
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U clock_user -d clock"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    build:
      context: ./clock-backend
      dockerfile: Dockerfile
    container_name: clock_backend_staging
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=clock_user
      - DB_PASSWORD=${POSTGRES_PASSWORD}
      - DB_NAME=clock
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - PORT=8080
      - ENV=staging
    expose:
      - "8080"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - clock_internal_staging
      - clock_web_staging
    restart: unless-stopped

  frontend:
    build:
      context: ./clock-frontend
      dockerfile: Dockerfile
    container_name: clock_frontend_staging
    environment:
      - NEXT_PUBLIC_API_URL=http://192.168.0.77:8002/api/v1
      - NODE_ENV=production
    expose:
      - "3000"
    depends_on:
      - backend
    networks:
      - clock_web_staging
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: clock_nginx_staging
    ports:
      - "8002:80"
    volumes:
      - ./nginx/nginx.staging.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - frontend
    networks:
      - clock_web_staging
    restart: unless-stopped

networks:
  clock_internal_staging:
    driver: bridge
  clock_web_staging:
    driver: bridge

volumes:
  clock_postgres_staging_data:
```

### 7.3 Nginx Configuration

**File:** `nginx/nginx.staging.conf`

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8080;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name _;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### 7.4 Backend Dockerfile

**File:** `clock-backend/Dockerfile`

```dockerfile
FROM golang:1.23-alpine AS builder

# Install dependencies
RUN apk add --no-cache git postgresql-client

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main cmd/main.go

# Install sql-migrate
RUN go install github.com/rubenv/sql-migrate/...@latest

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates postgresql-client tzdata

WORKDIR /root/

# Copy binary and migrations
COPY --from=builder /app/main .
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /go/bin/sql-migrate /usr/local/bin/sql-migrate
COPY docker-entrypoint.sh .

RUN chmod +x docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["./docker-entrypoint.sh"]
```

### 7.5 Frontend Dockerfile

**File:** `clock-frontend/Dockerfile`

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["yarn", "start"]
```

### 7.6 Backend Entrypoint Script

**File:** `clock-backend/docker-entrypoint.sh`

```bash
#!/bin/sh

set -e

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - running migrations"

# Create dbconfig.yml for sql-migrate
cat > dbconfig.yml <<EOF
production:
  dialect: postgres
  datasource: host=$DB_HOST port=$DB_PORT user=$DB_USER password=$DB_PASSWORD dbname=$DB_NAME sslmode=disable
  dir: migrations
EOF

# Run migrations
sql-migrate up -env=production

echo "Migrations completed successfully"

# Start the application
echo "Starting Clock Backend..."
exec ./main
```

---

## 8. Implementation Phases

### Phase 1: Core Functionality (MVP)

**Estimated Tasks:**
1. Database setup
   - Create PostgreSQL schema and migrations
   - Add seed data for testing
   - Test database connections

2. Backend development
   - Setup Go project structure and dependencies
   - Implement authentication (login, JWT generation)
   - Implement JWT middleware
   - Implement check-in endpoint
   - Implement check-out endpoint
   - Implement status endpoint
   - Implement records listing endpoint
   - Add unit tests for services
   - Add integration tests for handlers

3. Frontend development
   - Setup Next.js project with TypeScript and MUI
   - Create login page and form
   - Implement authentication context
   - Create attendance page layout
   - Implement check-in/check-out buttons
   - Implement attendance table
   - Implement month selector
   - Add error handling and loading states

4. Docker setup
   - Create Dockerfiles for backend and frontend
   - Create docker-compose.yml for development
   - Create docker-compose.staging.yml
   - Configure Nginx reverse proxy
   - Test full stack deployment

5. Testing & bug fixes
   - Manual testing of all features
   - Fix any bugs discovered
   - Ensure business rules are enforced

### Phase 2: Admin Features

**Future Tasks:**
1. Admin dashboard
   - View all employees
   - View all attendance records
   - Filter and search functionality

2. User management
   - Create/edit/delete employees
   - Reset employee passwords
   - Manage roles

3. Reporting
   - Monthly attendance summary reports
   - Export to CSV/Excel
   - Attendance statistics and charts

4. Enhanced features
   - Edit attendance records (admin only)
   - Add notes to check-in/check-out
   - Email notifications
   - Late check-in warnings

---

## 9. Environment Configuration

### Backend Environment Variables

**Development (.env):**
```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=clock_user
DB_PASSWORD=clock_pass
DB_NAME=clock
JWT_SECRET=development-secret-key-change-me
JWT_REFRESH_SECRET=development-refresh-secret-key-change-me
JWT_EXPIRATION=2592000
JWT_REFRESH_EXPIRATION=2592000
PORT=8080
ENV=development
LOG_LEVEL=debug
```

**Staging (.env.staging):**
```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=clock_user
DB_PASSWORD=<STRONG_PASSWORD>
DB_NAME=clock
JWT_SECRET=<RANDOM_SECRET_KEY>
JWT_REFRESH_SECRET=<RANDOM_REFRESH_SECRET_KEY>
JWT_EXPIRATION=2592000
JWT_REFRESH_EXPIRATION=2592000
PORT=8080
ENV=staging
LOG_LEVEL=info
```

**Note on JWT Expiration:**
- `JWT_EXPIRATION=2592000` = 30 days in seconds (30 * 24 * 60 * 60)
- Extended expiration suitable for intranet environment
- Users remain logged in for up to 30 days without re-authentication
- Tokens automatically expire after 30 days of inactivity

### Frontend Environment Variables

**Development (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

**Staging (.env.production):**
```env
NEXT_PUBLIC_API_URL=http://192.168.0.77:8002/api/v1
```

---

## 10. Security Considerations

### Intranet Environment Security Approach
This system is designed for a **closed corporate network (intranet)**, which allows for:
- Extended session durations (30 days) for user convenience
- Less aggressive token rotation
- Trust in network-level security measures
- Simplified authentication flow

### Authentication & Authorization
- Use bcrypt with cost factor 10 for password hashing
- JWT tokens with extended expiration (30 days for both access and refresh tokens)
- Tokens stored securely in browser (localStorage or httpOnly cookies)
- Validate all inputs on both frontend and backend
- Rate limiting on login endpoint (10 requests/minute) to prevent brute force
- HTTPS in production (enforced by Nginx) - optional for intranet but recommended
- Password change functionality allows users to update credentials
- Manual logout clears tokens from client-side storage

### Database Security
- Use parameterized queries (sqlx handles this)
- Soft delete instead of hard delete for audit trail
- Database user with minimal necessary permissions
- Regular backups (to be configured in production)

### API Security
- CORS configured to allow only frontend origin
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Request size limits
- Sanitize user inputs
- No sensitive data in logs

### Docker Security
- Run containers as non-root user (to be implemented)
- Use Alpine-based images for smaller attack surface
- Secrets stored in environment variables (consider Docker secrets for production)
- Network isolation (internal network for DB)

---

## 11. Monitoring & Logging

### Logging Strategy
- Structured logging with zap (backend)
- Log levels: DEBUG, INFO, WARN, ERROR
- Log rotation and retention policy (production)
- Sensitive data (passwords, tokens) never logged

### Health Checks
- Database connection health check
- Application readiness endpoint: `GET /health`
- Docker health checks for all services

### Monitoring (Future)
- Prometheus metrics export
- Grafana dashboards
- Alert on high error rates or service downtime

---

## 12. Deployment Process

### Staging Deployment
1. SSH to staging server
2. Pull latest code from git repository
3. Run deployment script:
   ```bash
   ./deploy.sh staging
   ```
4. Script steps:
   - Stop existing containers
   - Build new Docker images
   - Run migrations
   - Start new containers
   - Health check verification

### Production Deployment
1. Test thoroughly in staging
2. Create git tag for release version
3. SSH to production server
4. Run deployment script:
   ```bash
   ./deploy.sh production
   ```
5. Monitor logs for any errors
6. Verify application is accessible

### Rollback Strategy
- Keep previous Docker images tagged
- Quick rollback command:
  ```bash
  ./rollback.sh <previous-version>
  ```

---

## 13. Testing Strategy

### Backend Testing
- Unit tests for all service functions
- Integration tests for API endpoints
- Test database with seed data
- Mock external dependencies
- Aim for >80% code coverage

### Frontend Testing
- Component tests with React Testing Library
- Integration tests for critical flows (login, check-in/out)
- E2E tests with Playwright (future)

### Manual Testing Checklist
- [ ] User can log in with valid credentials
- [ ] User cannot log in with invalid credentials
- [ ] User can check in successfully
- [ ] User cannot check in twice
- [ ] User can check out after checking in
- [ ] User cannot check out without checking in
- [ ] User can view attendance records for current month
- [ ] User can switch month and view historical records
- [ ] User can log out successfully
- [ ] Token refresh works correctly
- [ ] Expired token returns 401 error

---

## 14. API Documentation

Use Swagger/OpenAPI specification for API documentation (to be implemented).

**Tool:** Swagger UI or Redoc

**Location:** `/api/docs`

---

## 15. Future Enhancements (Post-Phase 2)

- Mobile app (React Native)
- Geolocation-based check-in (optional)
- Facial recognition for check-in (optional)
- Integration with payroll systems
- Multi-language support (i18n)
- Dark mode theme
- Real-time notifications (WebSocket)
- Attendance calendar view
- Overtime calculation
- Leave management integration

---

## 16. Success Criteria

### Phase 1 Success Metrics
- All MVP features implemented and working
- Zero critical bugs in production
- System can handle 100 concurrent users
- API response time < 500ms for 95th percentile
- Frontend load time < 3 seconds
- Database schema supports future enhancements
- Docker deployment works smoothly

---

## Conclusion

This document provides a comprehensive plan for the Clock check-in/check-out system. The architecture follows proven patterns from the somilk project while keeping the implementation simple and focused on core requirements.

**Key Design Decisions:**
1. Use Material-UI for consistent, professional UI
2. JWT-based stateless authentication
3. Soft delete for all data (audit trail)
4. Service layer pattern for business logic
5. Docker Compose for easy deployment
6. Structured logging for troubleshooting
7. API versioning for future compatibility

**Next Steps:**
1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Regular testing and iteration
5. Staging deployment
6. Production deployment
