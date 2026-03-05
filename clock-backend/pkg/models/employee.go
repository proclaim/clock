package models

import (
	"database/sql"
	"time"
)

// EmployeeRole represents the role of an employee
type EmployeeRole string

const (
	RoleStaff EmployeeRole = "STAFF"
	RoleAdmin EmployeeRole = "ADMIN"
)

// Employee represents an employee in the system
type Employee struct {
	ID           int            `db:"id" json:"id"`
	Username     string         `db:"username" json:"username"`
	Name         string         `db:"name" json:"name"`
	Email        sql.NullString `db:"email" json:"email,omitempty"`
	Phone        sql.NullString `db:"phone" json:"phone,omitempty"`
	PasswordHash string         `db:"password_hash" json:"-"` // Never expose in JSON
	Role         EmployeeRole   `db:"role" json:"role"`
	IsActive     bool           `db:"is_active" json:"is_active"`
	HourlyRate   sql.NullInt64  `db:"hourly_rate" json:"hourly_rate,omitempty"`
	CreatedAt    time.Time      `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time      `db:"updated_at" json:"updated_at"`
	DeletedAt    sql.NullTime   `db:"deleted_at" json:"-"`
}

// EmployeeResponse represents employee data for API responses
type EmployeeResponse struct {
	ID         int          `json:"id"`
	Username   string       `json:"username"`
	Name       string       `json:"name"`
	Email      string       `json:"email,omitempty"`
	Phone      string       `json:"phone,omitempty"`
	Role       EmployeeRole `json:"role"`
	IsActive   bool         `json:"is_active"`
	HourlyRate *int64       `json:"hourly_rate,omitempty"`
}

// ToResponse converts Employee to EmployeeResponse
func (e *Employee) ToResponse() *EmployeeResponse {
	resp := &EmployeeResponse{
		ID:       e.ID,
		Username: e.Username,
		Name:     e.Name,
		Role:     e.Role,
		IsActive: e.IsActive,
	}

	if e.Email.Valid {
		resp.Email = e.Email.String
	}

	if e.Phone.Valid {
		resp.Phone = e.Phone.String
	}

	if e.HourlyRate.Valid {
		resp.HourlyRate = &e.HourlyRate.Int64
	}

	return resp
}
