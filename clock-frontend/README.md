# Clock Frontend - Check-In/Check-Out System

React-based frontend for the Clock employee time tracking system, built with Next.js 14, TypeScript, and Material-UI.

## Features

- User authentication (login/logout)
- Extended session (30 days)
- Check-in/check-out functionality
- Automatic handling of forgotten check-outs
- Monthly attendance record viewing
- Password change functionality
- Responsive Material-UI design

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Material-UI (MUI) v5** - UI component library
- **Formik + Yup** - Form management and validation
- **Axios** - HTTP client
- **date-fns** - Date manipulation

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
clock-frontend/
├── app/                      # Next.js App Router pages
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── attendance/       # Attendance tracking page
│   │   ├── settings/         # User settings page
│   │   └── layout.tsx        # Dashboard layout with Header
│   ├── login/                # Login page
│   ├── layout.tsx            # Root layout (MUI theme, AuthProvider)
│   ├── page.tsx              # Root redirect page
│   └── globals.css           # Global styles
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx           # Login form
│   │   └── ChangePasswordForm.tsx  # Password change form
│   ├── attendance/
│   │   ├── AttendanceStatus.tsx    # Current check-in status display
│   │   ├── CheckInButton.tsx       # Check-in action button
│   │   ├── CheckOutButton.tsx      # Check-out action button
│   │   ├── MonthSelector.tsx       # Month/year filter
│   │   └── AttendanceTable.tsx     # Records table
│   └── layout/
│       └── Header.tsx        # App header with navigation
├── context/
│   └── AuthContext.tsx       # Authentication state management
├── services/
│   ├── mockData.ts           # Mock data for testing
│   ├── authService.ts        # Authentication API calls
│   └── attendanceService.ts  # Attendance API calls
├── types/
│   ├── auth.ts               # Auth-related types
│   └── attendance.ts         # Attendance-related types
├── utils/
│   └── dateUtils.ts          # Date formatting utilities
└── public/                   # Static assets
```

## Mock Data

The frontend currently uses mock data for demonstration. You can test with these accounts:

### Demo Accounts

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN |
| john.doe | staff123 | STAFF |
| jane.smith | staff123 | STAFF |

### Mock Features

- **Login**: Simulates authentication with 500ms delay
- **Check-In/Check-Out**: Manages mock attendance records
- **Auto-Close**: Automatically closes previous day's check-ins
- **Monthly Records**: Filter by year and month

The mock data includes:
- 3 test users
- Sample attendance records for January 2026
- In-memory persistence (resets on page refresh)

## Key Features

### 1. Authentication

- JWT-based authentication (mock)
- 30-day token expiration
- Automatic token storage in localStorage
- Protected routes with redirect

### 2. Check-In/Check-Out

- One-click check-in/check-out
- Real-time status display
- Automatic check-in closure from previous days
- Visual feedback with notifications

### 3. Attendance Records

- Monthly view with year/month selector
- Table shows: Date, Check-In Time, Check-Out Time, Duration, Status
- Status indicators:
  - ✓ **Checked Out** (green) - Normal completion
  - ✓ **Checked In** (blue) - Currently active
  - ⚠ **Auto-Closed** (orange) - Forgotten check-out

### 4. Settings

- View account information
- Change password functionality
- Form validation

### 5. UI/UX

- Material-UI components for professional look
- Responsive design
- Loading states and error handling
- Success/error notifications

## Business Logic

### Check-In Rules

- If no active check-in → Create new check-in
- If active check-in from **previous day** → Auto-close old record, create new check-in
- If active check-in from **today** → Show error

### Check-Out Rules

- Must have active check-in to check out
- Updates check-out time and status
- If no active check-in → Show error

### Auto-Close Functionality

When a user forgets to check out and checks in the next day:
1. Previous day's record is marked as `AUTO_CLOSED`
2. `check_out_time` remains `NULL`
3. New check-in is created for today
4. User sees notification about the auto-closed record

## Environment Variables

Create a `.env.local` file:

```env
# API URL (for future backend integration)
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# Use mock data flag (true for demo mode)
NEXT_PUBLIC_USE_MOCK_DATA=true
```

## API Integration (Future)

To connect to a real backend:

1. Set `NEXT_PUBLIC_USE_MOCK_DATA=false`
2. Update `NEXT_PUBLIC_API_URL` to your backend URL
3. Replace mock services with real API calls in `services/`

The API interfaces are already defined in the types and services, matching the backend specification in `PROJECT_PLAN.md`.

## Component Documentation

### AuthContext

Provides authentication state and methods throughout the app:

```tsx
const { user, isAuthenticated, login, logout, changePassword } = useAuth();
```

### Attendance Components

- **AttendanceStatus**: Displays current check-in status
- **CheckInButton**: Handles check-in action with auto-close logic
- **CheckOutButton**: Handles check-out action
- **MonthSelector**: Year/month dropdown filters
- **AttendanceTable**: Displays attendance records in a table

### Layout Components

- **Header**: App bar with user menu and navigation
- **Dashboard Layout**: Wraps protected pages, enforces authentication

## Styling

- Material-UI theme with primary color: `#1976d2`
- Responsive design using MUI breakpoints
- Custom styling via `sx` prop
- Global styles in `app/globals.css`

## State Management

- **AuthContext**: Global authentication state using React Context
- **Component State**: Local state for form inputs, loading, errors
- **localStorage**: Persistent token and user data storage

## Form Validation

Using Formik and Yup:

- Login: Username and password required
- Password Change: Current password, new password (min 6 chars), confirm password match
- Real-time validation feedback
- Error messages displayed inline

## Testing the App

1. **Login**: Use any demo account (e.g., `john.doe` / `staff123`)
2. **Check In**: Click "Check In" button
3. **View Status**: See current check-in status and time
4. **View Records**: Browse attendance records by month
5. **Check Out**: Click "Check Out" button
6. **Auto-Close Test**:
   - Check in
   - Change mock data to make it yesterday's date
   - Check in again → See auto-close notification
7. **Change Password**: Go to Settings → Change Password
8. **Logout**: Click user menu → Logout

## Known Limitations (Mock Mode)

- Data resets on page refresh
- No actual backend persistence
- Token validation is simulated
- Date/time uses client system time

## Next Steps

- [ ] Integrate with real backend API
- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Add E2E tests (Playwright)
- [ ] Implement real-time WebSocket updates
- [ ] Add dark mode theme
- [ ] Mobile responsive improvements
- [ ] PWA support for mobile app

## Troubleshooting

**Port 3000 already in use:**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill

# Or use a different port
PORT=3001 npm run dev
```

**Module not found errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Type errors:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## License

[Add your license here]

---

**Version:** 1.0.0
**Last Updated:** 2026-01-05
