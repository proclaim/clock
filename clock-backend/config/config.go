package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Database DatabaseConfig
	JWT      JWTConfig
	Server   ServerConfig
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type JWTConfig struct {
	Secret              string
	RefreshSecret       string
	Expiration          int // in seconds
	RefreshExpiration   int // in seconds
}

type ServerConfig struct {
	Port     string
	ENV      string
	LogLevel string
}

func Load() (*Config, error) {
	// Load .env file if it exists
	godotenv.Load()

	config := &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "clock_user"),
			Password: getEnv("DB_PASSWORD", "clock_pass"),
			DBName:   getEnv("DB_NAME", "clock"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret:            getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
			RefreshSecret:     getEnv("JWT_REFRESH_SECRET", "your-refresh-secret-key"),
			Expiration:        getEnvAsInt("JWT_EXPIRATION", 2592000),      // 30 days
			RefreshExpiration: getEnvAsInt("JWT_REFRESH_EXPIRATION", 2592000), // 30 days
		},
		Server: ServerConfig{
			Port:     getEnv("PORT", "8080"),
			ENV:      getEnv("ENV", "development"),
			LogLevel: getEnv("LOG_LEVEL", "debug"),
		},
	}

	if err := config.Validate(); err != nil {
		return nil, err
	}

	return config, nil
}

func (c *Config) Validate() error {
	if c.JWT.Secret == "" || c.JWT.Secret == "your-secret-key-change-in-production" {
		if c.Server.ENV == "production" || c.Server.ENV == "staging" {
			return fmt.Errorf("JWT_SECRET must be set in production/staging environment")
		}
	}

	// Allow empty password for local development with trust authentication
	if c.Database.Password == "" && (c.Server.ENV == "production" || c.Server.ENV == "staging") {
		return fmt.Errorf("DB_PASSWORD must be set in production/staging environment")
	}

	return nil
}

func (c *DatabaseConfig) ConnectionString() string {
	// Build connection string, omitting password if empty or trust auth
	if c.Password == "" || c.Password == "not_needed_for_local_trust_auth" {
		return fmt.Sprintf(
			"host=%s port=%s user=%s dbname=%s sslmode=%s",
			c.Host, c.Port, c.User, c.DBName, c.SSLMode,
		)
	}
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.DBName, c.SSLMode,
	)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}
