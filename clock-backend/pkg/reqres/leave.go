package reqres

import "github.com/jim/clock-backend/pkg/models"

// CreateLeaveRequest represents the request body for creating a leave
type CreateLeaveRequest struct {
	StartDate string `json:"start_date" validate:"required"`
	EndDate   string `json:"end_date" validate:"required"`
	Note      string `json:"note,omitempty"`
}

// UpdateLeaveRequest represents the request body for updating a leave (admin only)
type UpdateLeaveRequest struct {
	StartDate *string `json:"start_date,omitempty"`
	EndDate   *string `json:"end_date,omitempty"`
	Note      *string `json:"note,omitempty"`
}

// LeaveResponse represents the response for a single leave
type LeaveResponse struct {
	Leave *models.LeaveResponse `json:"leave"`
}

// LeavesResponse represents the response for multiple leaves
type LeavesResponse struct {
	Leaves []*models.LeaveResponse `json:"leaves"`
	Total  int                     `json:"total"`
}

// AdminLeavesResponse represents paginated leaves response for admin
type AdminLeavesResponse struct {
	Leaves  []*models.LeaveWithEmployeeResponse `json:"leaves"`
	Total   int                                 `json:"total"`
	Page    int                                 `json:"page"`
	PerPage int                                 `json:"per_page"`
}
