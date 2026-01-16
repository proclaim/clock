package handlers

import (
	"github.com/go-playground/validator/v10"
	"github.com/kataras/iris/v12"
	"go.uber.org/zap"

	"github.com/jim/clock-backend/config"
	"github.com/jim/clock-backend/pkg/reqres"
	"github.com/jim/clock-backend/pkg/services"
)

// Handler holds all dependencies for HTTP handlers
type Handler struct {
	authService            *services.AuthService
	attendanceService      *services.AttendanceService
	adminAttendanceService *services.AdminAttendanceService
	cfg                    *config.Config
	logger                 *zap.Logger
	validate               *validator.Validate
}

// NewHandler creates a new handler instance
func NewHandler(
	authService *services.AuthService,
	attendanceService *services.AttendanceService,
	adminAttendanceService *services.AdminAttendanceService,
	cfg *config.Config,
	logger *zap.Logger,
) *Handler {
	return &Handler{
		authService:            authService,
		attendanceService:      attendanceService,
		adminAttendanceService: adminAttendanceService,
		cfg:                    cfg,
		logger:                 logger,
		validate:               validator.New(),
	}
}

// respondWithError sends an error response
func (h *Handler) respondWithError(ctx iris.Context, statusCode int, message string) {
	ctx.StatusCode(statusCode)
	ctx.JSON(reqres.ErrorResponse{Error: message})
}

// respondWithJSON sends a JSON response
func (h *Handler) respondWithJSON(ctx iris.Context, statusCode int, data interface{}) {
	ctx.StatusCode(statusCode)
	ctx.JSON(data)
}
