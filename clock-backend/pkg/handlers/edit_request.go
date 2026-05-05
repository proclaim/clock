package handlers

import (
	"time"

	"github.com/kataras/iris/v12"
	"go.uber.org/zap"

	customErrors "github.com/jim/clock-backend/pkg/errors"
	"github.com/jim/clock-backend/pkg/middleware"
	"github.com/jim/clock-backend/pkg/models"
	"github.com/jim/clock-backend/pkg/reqres"
)

// SubmitEditRequest handles employee edit request submission
func (h *Handler) SubmitEditRequest(ctx iris.Context) {
	employeeID := middleware.GetEmployeeID(ctx)

	var req reqres.SubmitEditRequestRequest
	if err := ctx.ReadJSON(&req); err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid request body")
		return
	}

	var checkInTime, checkOutTime *time.Time

	if req.CheckInTime != nil {
		if t, err := time.Parse(time.RFC3339, *req.CheckInTime); err == nil {
			checkInTime = &t
		} else {
			h.respondWithError(ctx, iris.StatusBadRequest, "Invalid check-in time format")
			return
		}
	}

	if req.CheckOutTime != nil {
		if t, err := time.Parse(time.RFC3339, *req.CheckOutTime); err == nil {
			checkOutTime = &t
		} else {
			h.respondWithError(ctx, iris.StatusBadRequest, "Invalid check-out time format")
			return
		}
	}

	if checkInTime == nil && checkOutTime == nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "At least one of check-in time or check-out time must be provided")
		return
	}

	editRequest, err := h.editRequestService.SubmitEditRequest(
		employeeID, req.AttendanceRecordID, checkInTime, checkOutTime, req.Note,
	)
	if err != nil {
		switch err {
		case customErrors.ErrRecordNotFound:
			h.respondWithError(ctx, iris.StatusNotFound, "Attendance record not found")
		case customErrors.ErrUnauthorized:
			h.respondWithError(ctx, iris.StatusForbidden, "You can only edit your own records")
		case customErrors.ErrEditRequestAlreadyPending:
			h.respondWithError(ctx, iris.StatusConflict, err.Error())
		case customErrors.ErrCheckOutBeforeCheckIn:
			h.respondWithError(ctx, iris.StatusBadRequest, err.Error())
		default:
			h.logger.Error("Failed to submit edit request", zap.Error(err))
			h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		}
		return
	}

	h.respondWithJSON(ctx, iris.StatusCreated, editRequest.ToResponse())
}

// SubmitAddRequest handles employee add request submission
func (h *Handler) SubmitAddRequest(ctx iris.Context) {
	employeeID := middleware.GetEmployeeID(ctx)

	var req reqres.SubmitAddRequestRequest
	if err := ctx.ReadJSON(&req); err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid request body")
		return
	}

	checkInTime, err := time.Parse(time.RFC3339, req.CheckInTime)
	if err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid check-in time format")
		return
	}

	var checkOutTime *time.Time
	if req.CheckOutTime != nil {
		if t, err := time.Parse(time.RFC3339, *req.CheckOutTime); err == nil {
			checkOutTime = &t
		} else {
			h.respondWithError(ctx, iris.StatusBadRequest, "Invalid check-out time format")
			return
		}
	}

	editRequest, err := h.editRequestService.SubmitAddRequest(
		employeeID, checkInTime, checkOutTime, req.Note,
	)
	if err != nil {
		if err == customErrors.ErrCheckOutBeforeCheckIn {
			h.respondWithError(ctx, iris.StatusBadRequest, err.Error())
			return
		}
		h.logger.Error("Failed to submit add request", zap.Error(err))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	h.respondWithJSON(ctx, iris.StatusCreated, editRequest.ToResponse())
}

// GetMyEditRequests handles fetching employee's own edit requests
func (h *Handler) GetMyEditRequests(ctx iris.Context) {
	employeeID := middleware.GetEmployeeID(ctx)

	requests, err := h.editRequestService.GetEmployeeEditRequests(employeeID)
	if err != nil {
		h.logger.Error("Failed to get edit requests", zap.Error(err))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	responses := make([]*models.EditRequestResponse, len(requests))
	for i, r := range requests {
		responses[i] = r.ToResponse()
	}

	h.respondWithJSON(ctx, iris.StatusOK, reqres.EditRequestListResponse{
		EditRequests: responses,
		Total:        len(responses),
	})
}

// GetPendingEditRequests handles fetching all pending edit requests (admin)
func (h *Handler) GetPendingEditRequests(ctx iris.Context) {
	requests, err := h.editRequestService.GetPendingEditRequests()
	if err != nil {
		h.logger.Error("Failed to get pending edit requests", zap.Error(err))
		h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		return
	}

	responses := make([]*models.EditRequestWithDetailsResponse, len(requests))
	for i, r := range requests {
		responses[i] = r.ToResponse()
	}

	h.respondWithJSON(ctx, iris.StatusOK, reqres.AdminEditRequestListResponse{
		EditRequests: responses,
		Total:        len(responses),
	})
}

// ApproveEditRequest handles approving an edit request (admin)
func (h *Handler) ApproveEditRequest(ctx iris.Context) {
	adminID := middleware.GetEmployeeID(ctx)

	editRequestIDStr := ctx.Params().Get("id")
	editRequestID, err := parseID(editRequestIDStr)
	if err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid edit request ID")
		return
	}

	var req reqres.ReviewEditRequestRequest
	if err := ctx.ReadJSON(&req); err != nil {
		req = reqres.ReviewEditRequestRequest{}
	}

	err = h.editRequestService.ApproveEditRequest(editRequestID, adminID, req.ReviewNote)
	if err != nil {
		switch err {
		case customErrors.ErrRecordNotFound:
			h.respondWithError(ctx, iris.StatusNotFound, "Edit request not found")
		case customErrors.ErrEditRequestAlreadyReviewed:
			h.respondWithError(ctx, iris.StatusConflict, err.Error())
		default:
			h.logger.Error("Failed to approve edit request", zap.Error(err))
			h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		}
		return
	}

	h.respondWithJSON(ctx, iris.StatusOK, reqres.MessageResponse{
		Message: "Edit request approved successfully",
	})
}

// RejectEditRequest handles rejecting an edit request (admin)
func (h *Handler) RejectEditRequest(ctx iris.Context) {
	adminID := middleware.GetEmployeeID(ctx)

	editRequestIDStr := ctx.Params().Get("id")
	editRequestID, err := parseID(editRequestIDStr)
	if err != nil {
		h.respondWithError(ctx, iris.StatusBadRequest, "Invalid edit request ID")
		return
	}

	var req reqres.ReviewEditRequestRequest
	if err := ctx.ReadJSON(&req); err != nil {
		req = reqres.ReviewEditRequestRequest{}
	}

	err = h.editRequestService.RejectEditRequest(editRequestID, adminID, req.ReviewNote)
	if err != nil {
		switch err {
		case customErrors.ErrRecordNotFound:
			h.respondWithError(ctx, iris.StatusNotFound, "Edit request not found")
		case customErrors.ErrEditRequestAlreadyReviewed:
			h.respondWithError(ctx, iris.StatusConflict, err.Error())
		default:
			h.logger.Error("Failed to reject edit request", zap.Error(err))
			h.respondWithError(ctx, iris.StatusInternalServerError, "Internal server error")
		}
		return
	}

	h.respondWithJSON(ctx, iris.StatusOK, reqres.MessageResponse{
		Message: "Edit request rejected successfully",
	})
}

func parseID(s string) (int, error) {
	if s == "" {
		return 0, customErrors.ErrRecordNotFound
	}
	var id int
	for _, c := range s {
		if c < '0' || c > '9' {
			return 0, customErrors.ErrRecordNotFound
		}
		id = id*10 + int(c-'0')
	}
	return id, nil
}
