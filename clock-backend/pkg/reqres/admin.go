package reqres

import "github.com/jim/clock-backend/pkg/models"

// AdminAttendanceSummaryResponse represents the response for employee attendance summaries
type AdminAttendanceSummaryResponse struct {
	Summaries []*models.EmployeeAttendanceSummaryResponse `json:"summaries"`
	Total     int                                          `json:"total"`
}

// AdminAttendanceRecordsResponse represents paginated attendance records response
type AdminAttendanceRecordsResponse struct {
	Records []*models.AttendanceRecordWithEmployeeResponse `json:"records"`
	Total   int                                            `json:"total"`
	Page    int                                            `json:"page"`
	PerPage int                                            `json:"per_page"`
}

// UpdateAttendanceRecordRequest represents the request body for updating an attendance record
type UpdateAttendanceRecordRequest struct {
	CheckInTime  *string `json:"check_in_time,omitempty"`
	CheckOutTime *string `json:"check_out_time,omitempty"`
	Status       *string `json:"status,omitempty"`
	CheckInNote  *string `json:"check_in_note,omitempty"`
	CheckOutNote *string `json:"check_out_note,omitempty"`
	EditReason   *string `json:"edit_reason,omitempty"`
}

// CreateAttendanceRecordRequest represents the request body for creating an attendance record
type CreateAttendanceRecordRequest struct {
	EmployeeID   int     `json:"employee_id" validate:"required,gt=0"`
	CheckInTime  string  `json:"check_in_time" validate:"required"`
	CheckOutTime *string `json:"check_out_time,omitempty"`
	Status       string  `json:"status" validate:"required,oneof=CHECKED_IN CHECKED_OUT"`
	CheckInNote  *string `json:"check_in_note,omitempty"`
	CheckOutNote *string `json:"check_out_note,omitempty"`
	EditReason   string  `json:"edit_reason" validate:"required,min=3"`
}

// EmployeeListResponse represents the response for employee list
type EmployeeListResponse struct {
	Employees []*models.EmployeeResponse `json:"employees"`
	Total     int                        `json:"total"`
}

// ResetPasswordRequest represents the request body for resetting an employee's password
type ResetPasswordRequest struct {
	NewPassword string `json:"new_password" validate:"required"`
}

// CreateEmployeeRequest represents the request body for creating a new employee
type CreateEmployeeRequest struct {
	Username string `json:"username" validate:"required"`
	Name     string `json:"name" validate:"required"`
	Password string `json:"password" validate:"required"`
	Role     string `json:"role" validate:"required,oneof=STAFF ADMIN"`
}

// UpdateEmployeeStatusRequest represents the request body for updating employee status
type UpdateEmployeeStatusRequest struct {
	IsActive bool `json:"is_active"`
}
