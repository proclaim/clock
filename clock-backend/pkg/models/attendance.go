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
	ID                 int              `db:"id" json:"id"`
	EmployeeID         int              `db:"employee_id" json:"employee_id"`
	CheckInTime        time.Time        `db:"check_in_time" json:"check_in_time"`
	CheckOutTime       sql.NullTime     `db:"check_out_time" json:"check_out_time,omitempty"`
	ActualCheckInTime  sql.NullTime     `db:"actual_check_in_time" json:"actual_check_in_time,omitempty"`
	ActualCheckOutTime sql.NullTime     `db:"actual_check_out_time" json:"actual_check_out_time,omitempty"`
	Status             AttendanceStatus `db:"status" json:"status"`
	CheckInNote        sql.NullString   `db:"check_in_note" json:"check_in_note,omitempty"`
	CheckOutNote       sql.NullString   `db:"check_out_note" json:"check_out_note,omitempty"`
	CreatedAt          time.Time        `db:"created_at" json:"created_at"`
	UpdatedAt          time.Time        `db:"updated_at" json:"updated_at"`
	DeletedAt          sql.NullTime     `db:"deleted_at" json:"-"`
	EditedBy           sql.NullInt64    `db:"edited_by" json:"edited_by,omitempty"`
	EditedAt           sql.NullTime     `db:"edited_at" json:"edited_at,omitempty"`
	EditReason         sql.NullString   `db:"edit_reason" json:"edit_reason,omitempty"`
}

// AttendanceRecordResponse represents attendance record data for API responses
type AttendanceRecordResponse struct {
	ID                 int              `json:"id"`
	EmployeeID         int              `json:"employee_id"`
	CheckInTime        time.Time        `json:"check_in_time"`
	CheckOutTime       *time.Time       `json:"check_out_time,omitempty"`
	ActualCheckInTime  *time.Time       `json:"actual_check_in_time,omitempty"`
	ActualCheckOutTime *time.Time       `json:"actual_check_out_time,omitempty"`
	Status             AttendanceStatus `json:"status"`
	CheckInNote        string           `json:"check_in_note,omitempty"`
	CheckOutNote       string           `json:"check_out_note,omitempty"`
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

	if a.ActualCheckInTime.Valid {
		resp.ActualCheckInTime = &a.ActualCheckInTime.Time
	}

	if a.ActualCheckOutTime.Valid {
		resp.ActualCheckOutTime = &a.ActualCheckOutTime.Time
	}

	if a.CheckInNote.Valid {
		resp.CheckInNote = a.CheckInNote.String
	}

	if a.CheckOutNote.Valid {
		resp.CheckOutNote = a.CheckOutNote.String
	}

	return resp
}

// AttendanceRecordWithEmployee includes employee information
type AttendanceRecordWithEmployee struct {
	ID                 int              `db:"id" json:"id"`
	EmployeeID         int              `db:"employee_id" json:"employee_id"`
	CheckInTime        time.Time        `db:"check_in_time" json:"check_in_time"`
	CheckOutTime       sql.NullTime     `db:"check_out_time" json:"check_out_time"`
	ActualCheckInTime  sql.NullTime     `db:"actual_check_in_time" json:"actual_check_in_time"`
	ActualCheckOutTime sql.NullTime     `db:"actual_check_out_time" json:"actual_check_out_time"`
	Status           AttendanceStatus `db:"status" json:"status"`
	CheckInNote      sql.NullString   `db:"check_in_note" json:"check_in_note"`
	CheckOutNote     sql.NullString   `db:"check_out_note" json:"check_out_note"`
	CreatedAt        time.Time        `db:"created_at" json:"created_at"`
	UpdatedAt        time.Time        `db:"updated_at" json:"updated_at"`
	EditedBy         sql.NullInt64    `db:"edited_by" json:"edited_by"`
	EditedAt         sql.NullTime     `db:"edited_at" json:"edited_at"`
	EditReason       sql.NullString   `db:"edit_reason" json:"edit_reason"`
	EmployeeName     string           `db:"employee_name" json:"employee_name"`
	EmployeeUsername string           `db:"employee_username" json:"employee_username"`
}

// AttendanceRecordWithEmployeeResponse for API responses
type AttendanceRecordWithEmployeeResponse struct {
	ID                 int              `json:"id"`
	EmployeeID         int              `json:"employee_id"`
	CheckInTime        time.Time        `json:"check_in_time"`
	CheckOutTime       *time.Time       `json:"check_out_time,omitempty"`
	ActualCheckInTime  *time.Time       `json:"actual_check_in_time,omitempty"`
	ActualCheckOutTime *time.Time       `json:"actual_check_out_time,omitempty"`
	Status           AttendanceStatus `json:"status"`
	CheckInNote      string           `json:"check_in_note,omitempty"`
	CheckOutNote     string           `json:"check_out_note,omitempty"`
	CreatedAt        time.Time        `json:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
	EditedBy         *int64           `json:"edited_by,omitempty"`
	EditedAt         *time.Time       `json:"edited_at,omitempty"`
	EditReason       string           `json:"edit_reason,omitempty"`
	EmployeeName     string           `json:"employee_name"`
	EmployeeUsername string           `json:"employee_username"`
}

// ToResponse converts AttendanceRecordWithEmployee to AttendanceRecordWithEmployeeResponse
func (a *AttendanceRecordWithEmployee) ToResponse() *AttendanceRecordWithEmployeeResponse {
	resp := &AttendanceRecordWithEmployeeResponse{
		ID:               a.ID,
		EmployeeID:       a.EmployeeID,
		CheckInTime:      a.CheckInTime,
		Status:           a.Status,
		CreatedAt:        a.CreatedAt,
		UpdatedAt:        a.UpdatedAt,
		EmployeeName:     a.EmployeeName,
		EmployeeUsername: a.EmployeeUsername,
	}

	if a.CheckOutTime.Valid {
		resp.CheckOutTime = &a.CheckOutTime.Time
	}

	if a.ActualCheckInTime.Valid {
		resp.ActualCheckInTime = &a.ActualCheckInTime.Time
	}

	if a.ActualCheckOutTime.Valid {
		resp.ActualCheckOutTime = &a.ActualCheckOutTime.Time
	}

	if a.CheckInNote.Valid {
		resp.CheckInNote = a.CheckInNote.String
	}

	if a.CheckOutNote.Valid {
		resp.CheckOutNote = a.CheckOutNote.String
	}

	if a.EditedBy.Valid {
		resp.EditedBy = &a.EditedBy.Int64
	}

	if a.EditedAt.Valid {
		resp.EditedAt = &a.EditedAt.Time
	}

	if a.EditReason.Valid {
		resp.EditReason = a.EditReason.String
	}

	return resp
}

// EmployeeAttendanceSummary represents aggregated attendance data per employee
type EmployeeAttendanceSummary struct {
	EmployeeID   int     `db:"employee_id" json:"employee_id"`
	EmployeeName string  `db:"employee_name" json:"employee_name"`
	Username     string  `db:"username" json:"username"`
	TotalRecords int     `db:"total_records" json:"total_records"`
	TotalMinutes float64 `db:"total_minutes" json:"total_minutes"`
}

// EmployeeAttendanceSummaryResponse for API
type EmployeeAttendanceSummaryResponse struct {
	EmployeeID      int     `json:"employee_id"`
	EmployeeName    string  `json:"employee_name"`
	Username        string  `json:"username"`
	TotalRecords    int     `json:"total_records"`
	TotalHours      int     `json:"total_hours"`
	TotalMinutes    int     `json:"total_minutes"`
	TotalMinutesRaw float64 `json:"total_minutes_raw"`
}

// ToResponse converts to response with calculated hours
func (s *EmployeeAttendanceSummary) ToResponse() *EmployeeAttendanceSummaryResponse {
	hours := int(s.TotalMinutes / 60)
	minutes := int(s.TotalMinutes) % 60

	return &EmployeeAttendanceSummaryResponse{
		EmployeeID:      s.EmployeeID,
		EmployeeName:    s.EmployeeName,
		Username:        s.Username,
		TotalRecords:    s.TotalRecords,
		TotalHours:      hours,
		TotalMinutes:    minutes,
		TotalMinutesRaw: s.TotalMinutes,
	}
}
