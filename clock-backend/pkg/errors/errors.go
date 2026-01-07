package errors

import "errors"

var (
	// Authentication errors
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrInvalidToken       = errors.New("invalid token")
	ErrTokenExpired       = errors.New("token expired")
	ErrUnauthorized       = errors.New("unauthorized")

	// Attendance errors
	ErrAlreadyCheckedIn    = errors.New("you already have an active check-in today. Please check out first")
	ErrNoActiveCheckIn     = errors.New("no active check-in found")
	ErrAlreadyCheckedOut   = errors.New("already checked out")

	// Employee errors
	ErrEmployeeNotFound    = errors.New("employee not found")
	ErrEmployeeNotActive   = errors.New("employee account is not active")
	ErrInvalidPassword     = errors.New("current password is incorrect")
	ErrPasswordTooShort    = errors.New("new password must be at least 6 characters")

	// Database errors
	ErrDatabaseConnection  = errors.New("database connection failed")
	ErrRecordNotFound      = errors.New("record not found")
)
