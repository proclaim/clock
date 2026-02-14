package reqres

import "github.com/jim/clock-backend/pkg/models"

// SubmitEditRequestRequest represents the request body for submitting an edit request
type SubmitEditRequestRequest struct {
	AttendanceRecordID int     `json:"attendance_record_id" validate:"required,gt=0"`
	CheckInTime        *string `json:"check_in_time,omitempty"`
	CheckOutTime       *string `json:"check_out_time,omitempty"`
	Note               string  `json:"note"`
}

// EditRequestListResponse represents a list of edit requests
type EditRequestListResponse struct {
	EditRequests []*models.EditRequestResponse `json:"edit_requests"`
	Total        int                           `json:"total"`
}

// AdminEditRequestListResponse represents a list of edit requests with details for admin
type AdminEditRequestListResponse struct {
	EditRequests []*models.EditRequestWithDetailsResponse `json:"edit_requests"`
	Total        int                                      `json:"total"`
}

// ReviewEditRequestRequest represents the request body for approving/rejecting an edit request
type ReviewEditRequestRequest struct {
	ReviewNote string `json:"review_note,omitempty"`
}
