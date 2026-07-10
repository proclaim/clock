package reqres

import "github.com/jim/clock-backend/pkg/models"

// CheckInRequest represents the check-in request payload
type CheckInRequest struct {
	Note string `json:"note"`
	// CheckInTime is an optional RFC3339 chosen time to record as the official
	// check-in time. Must be on today's date; the actual press time is always
	// recorded server-side for audit.
	CheckInTime string `json:"check_in_time,omitempty"`
}

// CheckOutRequest represents the check-out request payload
type CheckOutRequest struct {
	Note string `json:"note"`
	// CheckOutTime is an optional RFC3339 chosen time to record as the official
	// check-out time. Must be on today's date and after the check-in time; the
	// actual press time is always recorded server-side for audit.
	CheckOutTime string `json:"check_out_time,omitempty"`
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

// SuggestedTimeResponse represents the usual clock time suggestion derived
// from the employee's attendance history
type SuggestedTimeResponse struct {
	Action        string `json:"action"`
	HasSuggestion bool   `json:"has_suggestion"`
	SuggestedTime string `json:"suggested_time,omitempty"`
	SampleCount   int    `json:"sample_count"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}
