package config

import (
	"fmt"
	"os"
)

type Config struct {
	AppEnv          string
	Port            string
	CORSOrigin      string
	PostgresDSN     string
	RedisAddr       string
	Judge0URL       string
	EnableMockJudge bool
	SessionTTLHours int
	SessionCookie   string
}

func Load() Config {
	return Config{
		AppEnv:          envOr("APP_ENV", "development"),
		Port:            envOr("API_PORT", "8080"),
		CORSOrigin:      envOr("CORS_ORIGIN", "http://localhost:3000"),
		PostgresDSN:     envOr("POSTGRES_DSN", ""),
		RedisAddr:       envOr("REDIS_ADDR", ""),
		Judge0URL:       envOr("JUDGE0_URL", ""),
		EnableMockJudge: envOr("ENABLE_MOCK_JUDGE", "true") != "false",
		SessionTTLHours: envIntOr("SESSION_TTL_HOURS", 720),
		SessionCookie:   envOr("SESSION_COOKIE_NAME", "cppstudy_session"),
	}
}

func envOr(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func envIntOr(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	var parsed int
	if _, err := fmt.Sscanf(value, "%d", &parsed); err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}
