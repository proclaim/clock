package reqres

import "github.com/jim/clock-backend/pkg/models"

// CheckInRequest represents the check-in request payload
type CheckInRequest struct {
	Note string `json:"note"`
}

// CheckOutRequest represents the check-out request payload
type CheckOutRequest struct {
	Note string `json:"note"`
}

// CheckInResponse represents the check-in response
type CheckInResponse struct {
	ID                      int                               `json:"id"`
	EmployeeID              int                               `json:"employee_id"`
	CheckInTime             string                            `json:"check_in_time"`
	Status                  models.AttendanceStatus           `json:"status"`
	Note                    string                            `json:"note,omitempty"`
	PreviousRecordAutoClosed bool                             `json:"previous_record_auto_closed"`
	AutoClosedRecord        *models.AttendanceRecordResponse  `json:"auto_closed_record,omitempty"`
}

// CheckOutResponse represents the check-out response
type CheckOutResponse struct {
	ID           int                     `json:"id"`
	EmployeeID   int                     `json:"employee_id"`
	CheckInTime  string                  `json:"check_in_time"`
	CheckOutTime string                  `json:"check_out_time"`
	Status       models.AttendanceStatus `json:"status"`
	CheckInNote  string                  `json:"check_in_note,omitempty"`
	CheckOutNote string                  `json:"check_out_note,omitempty"`
}

// AttendanceStatusResponse represents the current attendance status
type AttendanceStatusResponse struct {
	IsCheckedIn   bool                              `json:"is_checked_in"`
	CurrentRecord *models.AttendanceRecordResponse  `json:"current_record,omitempty"`
}

// AttendanceRecordsResponse represents the list of attendance records
type AttendanceRecordsResponse struct {
	Records []*models.AttendanceRecordResponse `json:"records"`
	Total   int                                `json:"total"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}
