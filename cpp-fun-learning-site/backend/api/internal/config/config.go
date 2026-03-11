package config

import "os"

type Config struct {
	AppEnv          string
	Port            string
	CORSOrigin      string
	PostgresDSN     string
	RedisAddr       string
	Judge0URL       string
	EnableMockJudge bool
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
	}
}

func envOr(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
