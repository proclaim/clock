# Admin Features Documentation

## Overview

The Clock application includes comprehensive administrative functionality that allows administrators to manage employee attendance records, view aggregated time summaries, and maintain full audit trails of all changes.

## Admin User Access

### Role-Based System
- **ADMIN Role**: Has full access to admin dashboard and management features
- **STAFF Role**: Regular employees with standard check-in/out functionality

### Default Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Location**: Defined in initial database migration

### Login Behavior
After successful login:
- **Admin users** are automatically redirected to `/admin/dashboard`
- **Staff users** are redirected to `/attendance` (standard check-in/out page)

## Admin Exemption from Time Tracking

**Important**: Admin users are exempt from time tracking and cannot check-in or check-out.

When an admin user navigates to the regular `/attendance` page, they will see:
- A message indicating they are exempt from time tracking
- A prompt to visit the Admin Dashboard instead
- No check-in/out buttons or status displays

## Admin Dashboard

### Accessing the Dashboard
1. Login with an admin account
2. You'll be automatically redirected to `/admin/dashboard`
3. Or manually navigate to `/admin/dashboard` after login

### Dashboard Features

#### 1. Filters Section
Located at the top of the dashboard with the following options:

**Start Date**
- Date picker to select the beginning of the date range
- Default: First day of current month

**End Date**
- Date picker to select the end of the date range
- Default: Current date

**Employee Filter**
- Dropdown to select a specific employee
- Default: "All Employees" (shows data for all staff)
- List includes employee name and username

**Clear Filters Button**
- Resets all filters to default values

#### 2. Employee Time Summary Table

Displays aggregated time data for all employees (or filtered employee):

**Columns:**
- **Employee**: Full name of the employee
- **Username**: Employee username (displayed as chip)
- **Total Records**: Number of attendance records in the period
- **Total Hours**: Accumulated working hours (format: XXh YYm)

**Features:**
- Click on any employee row to automatically filter detailed records
- Grand Total row at the bottom showing sum of all hours
- Empty state message if no data found
- Styled with somilk color scheme

#### 3. Attendance Records Table

Comprehensive table showing individual attendance records:

**Columns:**
- **Employee**: Name and username
- **Date**: Check-in date (formatted based on language)
- **Check-In Time**: Time when employee checked in
- **Check-Out Time**: Time when employee checked out (or "—" if still checked in)
- **Duration**: Calculated time between check-in and check-out
- **Status**: Color-coded chip (Green=Checked Out, Blue=Checked In, Orange=Auto-Closed)
- **Actions**: Edit, Delete, and Audit Info buttons

**Features:**
- Pagination controls (25, 50, or 100 rows per page)
- Rows highlighted for AUTO_CLOSED status (warning color)
- "Add Record" button at top-right
- Audit info icon (ⓘ) appears for edited records

## Admin Operations

### Adding a New Attendance Record

1. Click the **"Add Record"** button at the top-right of the records table
2. In the dialog:
   - **Employee**: Select from autocomplete dropdown (searchable)
   - **Check-In Time**: Use date-time picker
   - **Check-Out Time**: Optional, use date-time picker
   - **Status**: Select CHECKED_IN or CHECKED_OUT
   - **Check-In Note**: Optional text field
   - **Check-Out Note**: Optional text field
   - **Reason for Adding Record**: **REQUIRED** (minimum 3 characters)
3. Click **"Create Record"**

**Validation:**
- Employee selection is mandatory
- Check-in time is mandatory
- Reason must be at least 3 characters
- Check-out time must be after check-in time

### Editing an Existing Record

1. Click the **Edit icon** (pencil) for the record you want to modify
2. In the dialog:
   - All fields are pre-filled with current values
   - Modify any field as needed
   - **Edit Reason**: **REQUIRED** (minimum 3 characters) - explain why you're making the change
3. Click **"Save Changes"**

**What Can Be Edited:**
- Check-in time
- Check-out time
- Status (CHECKED_IN, CHECKED_OUT, AUTO_CLOSED)
- Check-in note
- Check-out note

**Validation:**
- Edit reason is mandatory and tracked in audit trail
- Times must be valid date-time values

### Deleting a Record

1. Click the **Delete icon** (trash) for the record you want to remove
2. Review the confirmation dialog showing:
   - Employee name
   - Date and times
   - Warning about soft-delete
3. Click **"Delete"** to confirm

**Important Notes:**
- Deletion is a **soft delete** (record is marked as deleted, not permanently removed)
- The `deleted_at` timestamp is set
- The `edited_by` field records which admin deleted the record
- Record can potentially be recovered from database if needed

### Viewing Audit Information

1. Click the **Info icon** (ⓘ) for any edited record
2. The dialog displays:
   - **Last Edited At**: Timestamp of the most recent edit
   - **Edited By**: Admin ID who made the change
   - **Edit Reason**: The reason provided by the admin

**When Does the Info Icon Appear:**
- Only appears for records that have been edited or created by an admin
- Does not appear for regular employee-created records

## Audit Trail System

Every admin action is tracked with comprehensive audit information:

### Audit Fields
**edited_by** (Integer)
- Foreign key to employees table
- Records the admin user ID who performed the action
- Nullable (null for non-edited records)

**edited_at** (Timestamp)
- Timestamp when the record was last modified by an admin
- Timezone-aware (TIMESTAMP WITH TIME ZONE)
- Nullable

**edit_reason** (Text)
- Required explanation for why the change was made
- Minimum 3 characters
- Displayed in audit info dialog

### Audit Events
The following actions trigger audit logging:
- Creating a new attendance record (admin creates for employee)
- Updating an existing attendance record (any field)
- Deleting an attendance record (soft delete)

### Accessing Audit Logs
- Click the **ⓘ Info** icon on any edited record
- Audit information is stored permanently in the database
- Can be queried directly from `attendance_records` table if needed

## API Endpoints

All admin endpoints require authentication AND admin role.

### Authorization
- All requests must include `Authorization: Bearer <token>` header
- Token must contain `role: "ADMIN"`
- Non-admin users receive `403 Forbidden` error

### Available Endpoints

#### GET /api/v1/admin/attendance/summary
Get aggregated attendance summary for all employees.

**Query Parameters:**
- `start_date` (optional): YYYY-MM-DD format
- `end_date` (optional): YYYY-MM-DD format
- `employee_id` (optional): Filter for specific employee

**Response:**
```json
{
  "summaries": [
    {
      "employee_id": 1,
      "employee_name": "Jane Smith",
      "username": "jane.smith",
      "total_records": 20,
      "total_hours": 160,
      "total_minutes": 30,
      "total_minutes_raw": 9630.0
    }
  ],
  "total": 1
}
```

#### GET /api/v1/admin/attendance/records
Get paginated attendance records with employee information.

**Query Parameters:**
- `start_date` (optional): YYYY-MM-DD format
- `end_date` (optional): YYYY-MM-DD format
- `employee_id` (optional): Filter for specific employee
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Records per page (default: 50, max: 100)

**Response:**
```json
{
  "records": [ /* array of records */ ],
  "total": 100,
  "page": 1,
  "per_page": 50
}
```

#### PUT /api/v1/admin/attendance/records/:id
Update an existing attendance record.

**Request Body:**
```json
{
  "check_in_time": "2026-01-10T09:00:00Z",
  "check_out_time": "2026-01-10T17:30:00Z",
  "status": "CHECKED_OUT",
  "check_in_note": "Optional note",
  "check_out_note": "Optional note",
  "edit_reason": "Correcting missed checkout"
}
```

**Validation:**
- `edit_reason` is required (minimum 3 characters)
- All other fields are optional
- Times must be ISO 8601 format (RFC3339)

#### POST /api/v1/admin/attendance/records
Create a new attendance record.

**Request Body:**
```json
{
  "employee_id": 2,
  "check_in_time": "2026-01-10T09:00:00Z",
  "check_out_time": "2026-01-10T17:30:00Z",
  "status": "CHECKED_OUT",
  "check_in_note": "Optional",
  "check_out_note": "Optional",
  "edit_reason": "Manual entry for forgotten check-in"
}
```

**Validation:**
- `employee_id`, `check_in_time`, `status`, and `edit_reason` are required
- `status` must be "CHECKED_IN" or "CHECKED_OUT"

#### DELETE /api/v1/admin/attendance/records/:id
Soft delete an attendance record.

**Response:**
```json
{
  "message": "Record deleted successfully"
}
```

#### GET /api/v1/admin/employees
Get list of all active employees (for dropdowns).

**Response:**
```json
{
  "employees": [ /* array of employee objects */ ],
  "total": 5
}
```

## Database Schema

### attendance_records Table (Audit Fields)

```sql
ALTER TABLE attendance_records
  ADD COLUMN edited_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN edit_reason TEXT;
```

**Indexes:**
- `idx_attendance_edited_by`: Index on edited_by (conditional)
- `idx_attendance_edited_at`: Index on edited_at (conditional)

**Migration File:** `migrations/20260110000001-add-admin-audit-fields.sql`

## Security Considerations

1. **Role-Based Access Control**
   - Admin endpoints check for ADMIN role via middleware
   - Staff users cannot access admin functionality

2. **Audit Trail**
   - All changes are logged with admin ID, timestamp, and reason
   - Provides accountability and traceability

3. **Soft Deletes**
   - Records are never permanently deleted
   - Data can be recovered if needed
   - Maintains referential integrity

4. **Input Validation**
   - Edit reasons are required (minimum 3 characters)
   - Times validated in ISO 8601 format
   - Employee IDs validated against database

## Styling

The admin dashboard follows the somilk design system:

**Colors:**
- Primary: #0085db (blue) - buttons, chips, highlights
- Success: #4bd08b (green) - completed status, totals
- Warning: #f8c076 (orange) - auto-closed status
- Error: #fb977d (coral) - delete actions

**Components:**
- Tables with grey header backgrounds (#F2F6FA)
- Paper components with custom shadow
- Status chips with theme colors
- Hover effects on clickable rows

## Troubleshooting

### "403 Forbidden" Error
- Verify you're logged in as an admin user
- Check that JWT token contains `role: "ADMIN"`
- Confirm admin middleware is properly configured

### "Admin users are exempt from time tracking" Message
- This is expected behavior for admin users
- Navigate to `/admin/dashboard` instead
- Admin users cannot check-in or check-out

### Changes Not Appearing
- Ensure you provided a valid edit reason (minimum 3 characters)
- Check browser console for error messages
- Verify backend is running and accessible

### Pagination Not Working
- Check that `page` and `per_page` parameters are valid integers
- Maximum `per_page` is 100
- Page numbers start at 1 (not 0)

## Best Practices

1. **Always Provide Clear Edit Reasons**
   - Be specific about why you're making changes
   - Examples: "Correcting missed checkout", "Manual entry for sick leave"

2. **Verify Before Deleting**
   - Double-check you're deleting the correct record
   - Remember that deletion is soft (recoverable)

3. **Use Filters Effectively**
   - Filter by employee when editing specific user's records
   - Use date range to focus on relevant time periods

4. **Review Audit Trails**
   - Check audit info before making additional edits
   - Understand the history of changes to a record

## Future Enhancements

Potential improvements to admin functionality:
- Bulk operations (edit/delete multiple records)
- Export attendance data to CSV/Excel
- Advanced reporting and analytics
- Email notifications for admin actions
- Restore deleted records functionality
- Admin activity dashboard

## Support

For questions or issues with admin functionality:
- Check this documentation first
- Review API error messages for details
- Contact system administrator if problems persist
