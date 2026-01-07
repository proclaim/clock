# Documentation Updates Summary

## Changes Made for Intranet Environment Requirements

This document summarizes the updates made to accommodate the following user requirements:

1. **Extended session duration** (up to 30 days) - reduce login friction for intranet users
2. **Password change functionality** - allow users to update their passwords
3. **Manual logout option** - users can explicitly log out
4. **Auto-close forgotten check-outs** - handle cases where users forget to check out

---

## Key Changes

### 1. Extended Session Duration

**Changed Files:**
- `PROJECT_PLAN.md`
- `ARCHITECTURE.md`
- `.env.example`

**Updates:**
- JWT access token expiration: **3600 seconds (1 hour) → 2,592,000 seconds (30 days)**
- JWT refresh token expiration: **604,800 seconds (7 days) → 2,592,000 seconds (30 days)**
- Added note explaining this is suitable for closed corporate network (intranet)

**Environment Variables:**
```env
JWT_EXPIRATION=2592000        # 30 days
JWT_REFRESH_EXPIRATION=2592000 # 30 days
```

**Benefits:**
- Users login once and stay authenticated for up to 30 days
- Reduced friction in daily usage
- No need for aggressive token refresh mechanisms

---

### 2. Password Change Functionality

**Changed Files:**
- `PROJECT_PLAN.md` - Added new API endpoint
- `ARCHITECTURE.md` - Updated authentication service

**New API Endpoint:**
```
PUT /api/v1/auth/change-password
```

**Request:**
```json
{
  "current_password": "old_password",
  "new_password": "new_password"
}
```

**Business Rules:**
- Validate current password before allowing change
- New password must be at least 6 characters
- Hash new password with bcrypt before storing
- Optional: Invalidate all existing tokens (force re-login)

**Frontend Updates:**
- Added `src/components/auth/ChangePasswordForm.tsx` component
- Added `src/app/(dashboard)/settings/page.tsx` settings page
- Form with current password and new password fields
- Validation using Formik + Yup

---

### 3. Manual Logout

**Changed Files:**
- `PROJECT_PLAN.md` - Added logout endpoint

**New API Endpoint:**
```
POST /api/v1/auth/logout
```

**Functionality:**
- Clears tokens from client-side storage (localStorage or cookies)
- Optional: Server-side token invalidation (if using token blacklist)
- Redirects user to login page

**Frontend Updates:**
- Logout button in Header component
- Clears user state from AuthContext
- Removes tokens from storage
- Redirects to `/login`

---

### 4. Auto-Close Forgotten Check-Outs

**Changed Files:**
- `PROJECT_PLAN.md` - Updated check-in business logic
- `ARCHITECTURE.md` - Updated check-in flow diagram
- `migrations/20260105000001-initial-schema.sql` - Added new status

**Database Schema Change:**
```sql
CREATE TYPE attendance_status AS ENUM ('CHECKED_IN', 'CHECKED_OUT', 'AUTO_CLOSED');
```

**New Status: `AUTO_CLOSED`**
- Indicates a check-in that was automatically closed by the system
- Occurs when user has an active check-in from a previous day
- `check_out_time` remains NULL for auto-closed records

**Updated Check-In Business Logic:**

1. **If user has active check-in from PREVIOUS DAY:**
   - Auto-close old record with `status='AUTO_CLOSED'`
   - `check_out_time` remains NULL (user forgot to check out)
   - Create new check-in for today
   - Return both new record and info about auto-closed record

2. **If user has active check-in from TODAY (same calendar day):**
   - Return error: "You already have an active check-in today. Please check out first."

3. **Otherwise:**
   - Create new check-in record with `status='CHECKED_IN'`

**API Response Example (with auto-close):**
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

**Frontend Updates:**
- Handle `previous_record_auto_closed` flag in check-in response
- Show notification to user: "Your previous check-in from [date] was automatically closed"
- Display AUTO_CLOSED records in attendance table with special styling

---

## Updated Business Rules

### Check-In Rules

| Scenario | Action |
|----------|--------|
| No active check-in | Create new check-in with status='CHECKED_IN' |
| Active check-in from **previous day** | Auto-close old record (status='AUTO_CLOSED'), create new check-in |
| Active check-in from **today** | Return error, prevent duplicate check-in |

### Check-Out Rules

| Scenario | Action |
|----------|--------|
| Active check-in exists (today) | Update `check_out_time`, set status='CHECKED_OUT' |
| No active check-in | Return error |

### Password Change Rules

| Validation | Rule |
|------------|------|
| Current password | Must match existing password (bcrypt compare) |
| New password length | Minimum 6 characters |
| Storage | Hash with bcrypt cost factor 10 |

### Session/Token Rules (Intranet)

| Setting | Value |
|---------|-------|
| Access token expiration | 30 days (2,592,000 seconds) |
| Refresh token expiration | 30 days (2,592,000 seconds) |
| Token storage | localStorage or httpOnly cookies |
| Auto-refresh | Not strictly needed due to long expiration |

---

## Updated File Summary

### Configuration Files
- ✅ `.env.example` - Updated JWT expiration values with comments

### Database Files
- ✅ `migrations/20260105000001-initial-schema.sql` - Added AUTO_CLOSED status to enum

### Documentation Files
- ✅ `PROJECT_PLAN.md` - Updated sections:
  - Key Features
  - Intranet Environment Considerations
  - Database Schema (attendance_status enum)
  - API endpoints (added change-password, logout)
  - Check-in endpoint business logic
  - Frontend directory structure (added settings page)
  - Backend components (updated service descriptions)
  - Business Rules (comprehensive update)
  - Environment Configuration (JWT expiration)
  - Security Considerations (intranet approach)

- ✅ `ARCHITECTURE.md` - Updated sections:
  - Check-In Flow diagram
  - Database schema table (status column)
  - JWT Tokens section (expiration times)

### New Components to Implement

**Backend:**
- `ChangePassword()` service function in `pkg/services/auth.go`
- `HandleChangePassword()` handler in `pkg/handlers/auth.go`
- `HandleLogout()` handler in `pkg/handlers/auth.go`
- `AutoCloseForgottenCheckIn()` service function in `pkg/services/attendance.go`
- Updated `CheckIn()` service with auto-close logic

**Frontend:**
- `src/components/auth/ChangePasswordForm.tsx` - Password change form
- `src/app/(dashboard)/settings/page.tsx` - Settings page
- Update `src/components/layout/Header.tsx` - Add logout button
- Update `src/components/attendance/AttendanceTable.tsx` - Handle AUTO_CLOSED status display
- Update check-in logic to handle and display auto-close notifications

---

## Implementation Notes

### Date Comparison Logic (Backend)

For determining if a check-in is from "today" vs "previous day":

```go
func isSameDay(t1, t2 time.Time) bool {
    y1, m1, d1 := t1.Date()
    y2, m2, d2 := t2.Date()
    return y1 == y2 && m1 == m2 && d1 == d2
}
```

### Auto-Close Transaction

The auto-close and new check-in should be performed in a single database transaction:

```go
tx, err := db.Begin()
// 1. Update old record: status='AUTO_CLOSED'
// 2. Insert new record: status='CHECKED_IN'
tx.Commit()
```

### Frontend Notification

When auto-close occurs, show a user-friendly message:

```
✓ Checked in successfully
ℹ️ Your check-in from January 4, 2026 was automatically closed
```

### Attendance Table Display

| Date | Check-In | Check-Out | Status | Duration |
|------|----------|-----------|--------|----------|
| 2026-01-05 | 08:30 | 17:30 | ✓ Checked Out | 9h 0m |
| 2026-01-04 | 08:25 | - | ⚠ Auto-Closed | - |
| 2026-01-03 | 08:20 | 17:35 | ✓ Checked Out | 9h 15m |

---

## Testing Checklist

### Extended Session
- [ ] User logs in and remains authenticated for 30 days
- [ ] Token does not expire before 30 days
- [ ] User can continue using app without re-login within 30 days

### Password Change
- [ ] User can change password with correct current password
- [ ] System rejects incorrect current password
- [ ] System validates new password (minimum 6 characters)
- [ ] User can login with new password after change

### Logout
- [ ] Logout button clears tokens from client
- [ ] User is redirected to login page after logout
- [ ] User cannot access protected routes after logout

### Auto-Close Forgotten Check-Out
- [ ] User checks in on Day 1, forgets to check out
- [ ] User checks in on Day 2
- [ ] System auto-closes Day 1 check-in with status='AUTO_CLOSED'
- [ ] System creates new check-in for Day 2
- [ ] User sees notification about auto-closed record
- [ ] Attendance table shows Day 1 record with AUTO_CLOSED status
- [ ] User cannot check in twice on the same day

---

## Security Implications

### Longer Token Expiration

**Pros:**
- Better user experience in closed network
- Reduced login friction
- Suitable for intranet environment with physical access controls

**Cons:**
- Longer window if token is compromised
- Cannot revoke tokens without blacklist mechanism

**Mitigation:**
- Implement on intranet only (not exposed to public internet)
- Physical security of devices accessing the system
- Password change invalidates old tokens (optional implementation)
- Logout functionality for users to manually end session

### Password Change

**Security Measures:**
- Always verify current password before allowing change
- Hash new password with bcrypt cost factor 10
- Consider: Invalidate all existing tokens after password change
- Log password change events for audit trail

---

## Migration Guide

### For Existing Databases

If you already have an existing `attendance_status` enum, you'll need to alter it:

```sql
-- Add new value to existing enum
ALTER TYPE attendance_status ADD VALUE 'AUTO_CLOSED';

-- Verify
SELECT enum_range(NULL::attendance_status);
```

### For New Databases

The migration file `20260105000001-initial-schema.sql` already includes the AUTO_CLOSED status.

---

## Next Steps

1. ✅ Documentation updated
2. ⏳ Implement backend changes:
   - Password change endpoint
   - Logout endpoint
   - Auto-close logic in check-in service
3. ⏳ Implement frontend changes:
   - Settings page with password change form
   - Logout button in header
   - Auto-close notification handling
4. ⏳ Update tests for new features
5. ⏳ Deploy and test in staging environment

---

**Last Updated:** 2026-01-05
**Version:** 2.0.0 (Updated for intranet requirements)
