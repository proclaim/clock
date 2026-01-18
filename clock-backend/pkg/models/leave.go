package models

import (
	"database/sql"
	"time"
)

// Leave represents a leave/absence record
type Leave struct {
	ID         int            `db:"id" json:"id"`
	EmployeeID int            `db:"employee_id" json:"employee_id"`
	StartDate  time.Time      `db:"start_date" json:"start_date"`
	EndDate    time.Time      `db:"end_date" json:"end_date"`
	Note       sql.NullString `db:"note" json:"note,omitempty"`
	CreatedAt  time.Time      `db:"created_at" json:"created_at"`
	UpdatedAt  time.Time      `db:"updated_at" json:"updated_at"`
	DeletedAt  sql.NullTime   `db:"deleted_at" json:"-"`
}

// LeaveResponse represents leave data for API responses
type LeaveResponse struct {
	ID         int    `json:"id"`
	EmployeeID int    `json:"employee_id"`
	StartDate  string `json:"start_date"`
	EndDate    string `json:"end_date"`
	Note       string `json:"note,omitempty"`
	Days       int    `json:"days"`
}

// ToResponse converts Leave to LeaveResponse
func (l *Leave) ToResponse() *LeaveResponse {
	resp := &LeaveResponse{
		ID:         l.ID,
		EmployeeID: l.EmployeeID,
		StartDate:  l.StartDate.Format("2006-01-02"),
		EndDate:    l.EndDate.Format("2006-01-02"),
		Days:       int(l.EndDate.Sub(l.StartDate).Hours()/24) + 1,
	}

	if l.Note.Valid {
		resp.Note = l.Note.String
	}

	return resp
}

// LeaveWithEmployee includes employee information for admin views
type LeaveWithEmployee struct {
	ID               int            `db:"id" json:"id"`
	EmployeeID       int            `db:"employee_id" json:"employee_id"`
	StartDate        time.Time      `db:"start_date" json:"start_date"`
	EndDate          time.Time      `db:"end_date" json:"end_date"`
	Note             sql.NullString `db:"note" json:"note"`
	CreatedAt        time.Time      `db:"created_at" json:"created_at"`
	UpdatedAt        time.Time      `db:"updated_at" json:"updated_at"`
	EmployeeName     string         `db:"employee_name" json:"employee_name"`
	EmployeeUsername string         `db:"employee_username" json:"employee_username"`
}

// LeaveWithEmployeeResponse for API responses
type LeaveWithEmployeeResponse struct {
	ID               int    `json:"id"`
	EmployeeID       int    `json:"employee_id"`
	StartDate        string `json:"start_date"`
	EndDate          string `json:"end_date"`
	Note             string `json:"note,omitempty"`
	Days             int    `json:"days"`
	EmployeeName     string `json:"employee_name"`
	EmployeeUsername string `json:"employee_username"`
}

// ToResponse converts LeaveWithEmployee to LeaveWithEmployeeResponse
func (l *LeaveWithEmployee) ToResponse() *LeaveWithEmployeeResponse {
	resp := &LeaveWithEmployeeResponse{
		ID:               l.ID,
		EmployeeID:       l.EmployeeID,
		StartDate:        l.StartDate.Format("2006-01-02"),
		EndDate:          l.EndDate.Format("2006-01-02"),
		Days:             int(l.EndDate.Sub(l.StartDate).Hours()/24) + 1,
		EmployeeName:     l.EmployeeName,
		EmployeeUsername: l.EmployeeUsername,
	}

	if l.Note.Valid {
		resp.Note = l.Note.String
	}

	return resp
}
