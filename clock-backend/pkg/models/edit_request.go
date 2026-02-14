package models

import (
	"database/sql"
	"time"
)

type EditRequestStatus string

const (
	EditRequestPending  EditRequestStatus = "PENDING"
	EditRequestApproved EditRequestStatus = "APPROVED"
	EditRequestRejected EditRequestStatus = "REJECTED"
)

type EditRequest struct {
	ID                    int               `db:"id" json:"id"`
	AttendanceRecordID    int               `db:"attendance_record_id" json:"attendance_record_id"`
	EmployeeID            int               `db:"employee_id" json:"employee_id"`
	RequestedCheckInTime  sql.NullTime      `db:"requested_check_in_time" json:"requested_check_in_time,omitempty"`
	RequestedCheckOutTime sql.NullTime      `db:"requested_check_out_time" json:"requested_check_out_time,omitempty"`
	Note                  sql.NullString    `db:"note" json:"note,omitempty"`
	Status                EditRequestStatus `db:"status" json:"status"`
	ReviewedBy            sql.NullInt64     `db:"reviewed_by" json:"reviewed_by,omitempty"`
	ReviewedAt            sql.NullTime      `db:"reviewed_at" json:"reviewed_at,omitempty"`
	ReviewNote            sql.NullString    `db:"review_note" json:"review_note,omitempty"`
	CreatedAt             time.Time         `db:"created_at" json:"created_at"`
	UpdatedAt             time.Time         `db:"updated_at" json:"updated_at"`
}

type EditRequestWithDetails struct {
	ID                    int               `db:"id" json:"id"`
	AttendanceRecordID    int               `db:"attendance_record_id" json:"attendance_record_id"`
	EmployeeID            int               `db:"employee_id" json:"employee_id"`
	EmployeeName          string            `db:"employee_name" json:"employee_name"`
	EmployeeUsername      string            `db:"employee_username" json:"employee_username"`
	RequestedCheckInTime  sql.NullTime      `db:"requested_check_in_time" json:"requested_check_in_time,omitempty"`
	RequestedCheckOutTime sql.NullTime      `db:"requested_check_out_time" json:"requested_check_out_time,omitempty"`
	Note                  sql.NullString    `db:"note" json:"note,omitempty"`
	Status                EditRequestStatus `db:"status" json:"status"`
	ReviewedBy            sql.NullInt64     `db:"reviewed_by" json:"reviewed_by,omitempty"`
	ReviewedAt            sql.NullTime      `db:"reviewed_at" json:"reviewed_at,omitempty"`
	ReviewNote            sql.NullString    `db:"review_note" json:"review_note,omitempty"`
	CreatedAt             time.Time         `db:"created_at" json:"created_at"`
	UpdatedAt             time.Time         `db:"updated_at" json:"updated_at"`
	// Original record info
	OriginalCheckInTime  time.Time    `db:"original_check_in_time" json:"original_check_in_time"`
	OriginalCheckOutTime sql.NullTime `db:"original_check_out_time" json:"original_check_out_time,omitempty"`
	OriginalStatus       string       `db:"original_status" json:"original_status"`
}

type EditRequestResponse struct {
	ID                    int               `json:"id"`
	AttendanceRecordID    int               `json:"attendance_record_id"`
	EmployeeID            int               `json:"employee_id"`
	RequestedCheckInTime  *time.Time        `json:"requested_check_in_time,omitempty"`
	RequestedCheckOutTime *time.Time        `json:"requested_check_out_time,omitempty"`
	Note                  string            `json:"note,omitempty"`
	Status                EditRequestStatus `json:"status"`
	ReviewedBy            *int64            `json:"reviewed_by,omitempty"`
	ReviewedAt            *time.Time        `json:"reviewed_at,omitempty"`
	ReviewNote            string            `json:"review_note,omitempty"`
	CreatedAt             time.Time         `json:"created_at"`
}

type EditRequestWithDetailsResponse struct {
	ID                    int               `json:"id"`
	AttendanceRecordID    int               `json:"attendance_record_id"`
	EmployeeID            int               `json:"employee_id"`
	EmployeeName          string            `json:"employee_name"`
	EmployeeUsername      string            `json:"employee_username"`
	RequestedCheckInTime  *time.Time        `json:"requested_check_in_time,omitempty"`
	RequestedCheckOutTime *time.Time        `json:"requested_check_out_time,omitempty"`
	Note                  string            `json:"note,omitempty"`
	Status                EditRequestStatus `json:"status"`
	ReviewedBy            *int64            `json:"reviewed_by,omitempty"`
	ReviewedAt            *time.Time        `json:"reviewed_at,omitempty"`
	ReviewNote            string            `json:"review_note,omitempty"`
	CreatedAt             time.Time         `json:"created_at"`
	OriginalCheckInTime   time.Time         `json:"original_check_in_time"`
	OriginalCheckOutTime  *time.Time        `json:"original_check_out_time,omitempty"`
	OriginalStatus        string            `json:"original_status"`
}

func (e *EditRequest) ToResponse() *EditRequestResponse {
	resp := &EditRequestResponse{
		ID:                 e.ID,
		AttendanceRecordID: e.AttendanceRecordID,
		EmployeeID:         e.EmployeeID,
		Status:             e.Status,
		CreatedAt:          e.CreatedAt,
	}

	if e.RequestedCheckInTime.Valid {
		resp.RequestedCheckInTime = &e.RequestedCheckInTime.Time
	}
	if e.RequestedCheckOutTime.Valid {
		resp.RequestedCheckOutTime = &e.RequestedCheckOutTime.Time
	}
	if e.Note.Valid {
		resp.Note = e.Note.String
	}
	if e.ReviewedBy.Valid {
		resp.ReviewedBy = &e.ReviewedBy.Int64
	}
	if e.ReviewedAt.Valid {
		resp.ReviewedAt = &e.ReviewedAt.Time
	}
	if e.ReviewNote.Valid {
		resp.ReviewNote = e.ReviewNote.String
	}

	return resp
}

func (e *EditRequestWithDetails) ToResponse() *EditRequestWithDetailsResponse {
	resp := &EditRequestWithDetailsResponse{
		ID:                  e.ID,
		AttendanceRecordID:  e.AttendanceRecordID,
		EmployeeID:          e.EmployeeID,
		EmployeeName:        e.EmployeeName,
		EmployeeUsername:     e.EmployeeUsername,
		Status:              e.Status,
		CreatedAt:           e.CreatedAt,
		OriginalCheckInTime: e.OriginalCheckInTime,
		OriginalStatus:      e.OriginalStatus,
	}

	if e.RequestedCheckInTime.Valid {
		resp.RequestedCheckInTime = &e.RequestedCheckInTime.Time
	}
	if e.RequestedCheckOutTime.Valid {
		resp.RequestedCheckOutTime = &e.RequestedCheckOutTime.Time
	}
	if e.Note.Valid {
		resp.Note = e.Note.String
	}
	if e.ReviewedBy.Valid {
		resp.ReviewedBy = &e.ReviewedBy.Int64
	}
	if e.ReviewedAt.Valid {
		resp.ReviewedAt = &e.ReviewedAt.Time
	}
	if e.ReviewNote.Valid {
		resp.ReviewNote = e.ReviewNote.String
	}
	if e.OriginalCheckOutTime.Valid {
		resp.OriginalCheckOutTime = &e.OriginalCheckOutTime.Time
	}

	return resp
}
