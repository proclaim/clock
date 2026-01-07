package utils

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jim/clock-backend/config"
	"github.com/jim/clock-backend/pkg/models"
)

// JWTClaims represents the claims in the JWT token
type JWTClaims struct {
	EmployeeID int                 `json:"employee_id"`
	Username   string              `json:"username"`
	Role       models.EmployeeRole `json:"role"`
	jwt.RegisteredClaims
}

// GenerateAccessToken generates a JWT access token for an employee
func GenerateAccessToken(employee *models.Employee, cfg *config.JWTConfig) (string, error) {
	claims := JWTClaims{
		EmployeeID: employee.ID,
		Username:   employee.Username,
		Role:       employee.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(cfg.Expiration) * time.Second)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.Secret))
}

// GenerateRefreshToken generates a JWT refresh token for an employee
func GenerateRefreshToken(employee *models.Employee, cfg *config.JWTConfig) (string, error) {
	claims := JWTClaims{
		EmployeeID: employee.ID,
		Username:   employee.Username,
		Role:       employee.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(cfg.RefreshExpiration) * time.Second)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.RefreshSecret))
}

// ValidateAccessToken validates a JWT access token and returns the claims
func ValidateAccessToken(tokenString string, cfg *config.JWTConfig) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(cfg.Secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// ValidateRefreshToken validates a JWT refresh token and returns the claims
func ValidateRefreshToken(tokenString string, cfg *config.JWTConfig) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(cfg.RefreshSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid refresh token")
}
