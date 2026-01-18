package router

import (
	"github.com/kataras/iris/v12"
	"go.uber.org/zap"

	"github.com/jim/clock-backend/config"
	"github.com/jim/clock-backend/pkg/handlers"
	"github.com/jim/clock-backend/pkg/middleware"
)

// Setup configures all routes and middleware
func Setup(app *iris.Application, handler *handlers.Handler, cfg *config.Config, logger *zap.Logger) {
	// Setup CORS first (must be before other middleware)
	middleware.SetupCORS(app, cfg)

	// Global middleware
	app.Use(middleware.SecurityHeadersMiddleware())
	app.Use(middleware.LoggingMiddleware(logger))

	// Health check endpoint
	app.Get("/health", func(ctx iris.Context) {
		ctx.JSON(iris.Map{"status": "healthy"})
	})

	// API v1 routes
	v1 := app.Party("/api/v1")
	{
		// Public routes (no authentication required)
		auth := v1.Party("/auth")
		{
			auth.Post("/login", handler.Login)
			auth.Post("/refresh", handler.RefreshToken)
			auth.Post("/logout", handler.Logout) // Actually doesn't require auth in our implementation
		}

		// Protected routes (authentication required)
		protected := v1.Party("", middleware.JWTAuthMiddleware(cfg, logger))
		{
			// Attendance routes
			attendance := protected.Party("/attendance")
			{
				attendance.Post("/check-in", handler.CheckIn)
				attendance.Post("/check-out", handler.CheckOut)
				attendance.Get("/status", handler.GetStatus)
				attendance.Get("/records", handler.GetRecords)
			}

			// Leave routes (staff can create and view their own leaves)
			leaves := protected.Party("/leaves")
			{
				leaves.Post("", handler.CreateLeave)
				leaves.Get("", handler.GetLeaves)
			}

			// Admin routes (require ADMIN role)
			admin := protected.Party("/admin", middleware.RequireAdminMiddleware())
			{
				// Employee management
				admin.Get("/employees", handler.GetAllEmployees)
				admin.Post("/employees", handler.CreateEmployee)
				admin.Put("/employees/:id/status", handler.UpdateEmployeeStatus)
				admin.Put("/employees/:id/password", handler.ResetEmployeePassword)

				// Attendance management
				adminAttendance := admin.Party("/attendance")
				{
					adminAttendance.Get("/summary", handler.GetAdminAttendanceSummary)
					adminAttendance.Get("/records", handler.GetAdminAttendanceRecords)
					adminAttendance.Post("/records", handler.CreateAdminAttendanceRecord)
					adminAttendance.Put("/records/:id", handler.UpdateAdminAttendanceRecord)
					adminAttendance.Delete("/records/:id", handler.DeleteAdminAttendanceRecord)
				}

				// Leave management
				adminLeaves := admin.Party("/leaves")
				{
					adminLeaves.Get("", handler.GetAdminLeaves)
					adminLeaves.Put("/:id", handler.UpdateAdminLeave)
					adminLeaves.Delete("/:id", handler.DeleteAdminLeave)
				}
			}

			// Auth routes that require authentication
			authProtected := protected.Party("/auth")
			{
				authProtected.Put("/change-password", handler.ChangePassword)
			}
		}
	}
}
