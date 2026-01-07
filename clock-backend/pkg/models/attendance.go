package models

import (
	"database/sql"
	"time"
)

// AttendanceStatus represents the status of an attendance record
type AttendanceStatus string

const (
	StatusCheckedIn  AttendanceStatus = "CHECKED_IN"
	StatusCheckedOut AttendanceStatus = "CHECKED_OUT"
	StatusAutoClosed AttendanceStatus = "AUTO_CLOSED"
)

// AttendanceRecord represents a check-in/check-out record
type AttendanceRecord struct {
	ID            int              `db:"id" json:"id"`
	EmployeeID    int              `db:"employee_id" json:"employee_id"`
	CheckInTime   time.Time        `db:"check_in_time" json:"check_in_time"`
	CheckOutTime  sql.NullTime     `db:"check_out_time" json:"check_out_time,omitempty"`
	Status        AttendanceStatus `db:"status" json:"status"`
	CheckInNote   sql.NullString   `db:"check_in_note" json:"check_in_note,omitempty"`
	CheckOutNote  sql.NullString   `db:"check_out_note" json:"check_out_note,omitempty"`
	CreatedAt     time.Time        `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time        `db:"updated_at" json:"updated_at"`
	DeletedAt     sql.NullTime     `db:"deleted_at" json:"-"`
}

// AttendanceRecordResponse represents attendance record data for API responses
type AttendanceRecordResponse struct {
	ID           int              `json:"id"`
	EmployeeID   int              `json:"employee_id"`
	CheckInTime  time.Time        `json:"check_in_time"`
	CheckOutTime *time.Time       `json:"check_out_time,omitempty"`
	Status       AttendanceStatus `json:"status"`
	CheckInNote  string           `json:"check_in_note,omitempty"`
	CheckOutNote string           `json:"check_out_note,omitempty"`
}

// ToResponse converts AttendanceRecord to AttendanceRecordResponse
func (a *AttendanceRecord) ToResponse() *AttendanceRecordResponse {
	resp := &AttendanceRecordResponse{
		ID:          a.ID,
		EmployeeID:  a.EmployeeID,
		CheckInTime: a.CheckInTime,
		Status:      a.Status,
	}

	if a.CheckOutTime.Valid {
		resp.CheckOutTime = &a.CheckOutTime.Time
	}

	if a.CheckInNote.Valid {
		resp.CheckInNote = a.CheckInNote.String
	}

	if a.CheckOutNote.Valid {
		resp.CheckOutNote = a.CheckOutNote.String
	}

	return resp
}
