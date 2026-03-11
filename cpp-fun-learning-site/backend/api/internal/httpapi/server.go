package httpapi

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"cpp-fun-learning-site/api/internal/config"
	"cpp-fun-learning-site/api/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type Server struct {
	cfg         config.Config
	store       *store.Store
	mu          sync.RWMutex
	submissions map[string]store.SubmissionRecord
}

type RunRequest struct {
	ProblemSlug string `json:"problemSlug"`
	Language    string `json:"language"`
	SourceCode  string `json:"sourceCode"`
	Input       string `json:"input"`
}

type RunResponse struct {
	Mode          string `json:"mode"`
	Status        string `json:"status"`
	Stdout        string `json:"stdout"`
	CompileOutput string `json:"compileOutput"`
	ExecutionMS   int    `json:"executionMs"`
	MemoryKB      int    `json:"memoryKb"`
}

type SubmitResponse struct {
	Mode          string `json:"mode"`
	Status        string `json:"status"`
	SubmissionID  string `json:"submissionId"`
	QueuePosition int    `json:"queuePosition"`
	ETASeconds    int    `json:"etaSeconds"`
	NextPoll      string `json:"nextPoll"`
}

type SubmissionStatusResponse struct {
	Mode          string `json:"mode"`
	SubmissionID  string `json:"submissionId"`
	Status        string `json:"status"`
	Result        string `json:"result"`
	Detail        string `json:"detail"`
	Stdout        string `json:"stdout"`
	CompileOutput string `json:"compileOutput"`
	ElapsedMS     int64  `json:"elapsedMs"`
	FinishedAt    string `json:"finishedAt,omitempty"`
}

func New(cfg config.Config, dataStore *store.Store) *Server {
	return &Server{
		cfg:         cfg,
		store:       dataStore,
		submissions: make(map[string]store.SubmissionRecord),
	}
}

func (s *Server) Router() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(s.withCORS)

	r.Get("/healthz", s.handleHealth)

	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", s.handleRegister)
			r.Post("/login", s.handleLogin)
			r.Post("/logout", s.handleLogout)
			r.Get("/me", s.handleCurrentUser)
		})
		r.Route("/admin", func(r chi.Router) {
			r.Get("/overview", s.handleAdminOverview)
			r.Get("/users", s.handleAdminUsers)
			r.Get("/activity", s.handleAdminActivity)
			r.Patch("/users/{userID}", s.handleAdminUpdateUserStatus)
			r.Get("/content", s.handleAdminContentCatalog)
			r.Post("/content/problems", s.handleAdminCreateProblem)
			r.Post("/content/paths", s.handleAdminCreatePath)
			r.Delete("/content/problems/{slug}", s.handleAdminDeleteProblem)
			r.Delete("/content/paths/{slug}", s.handleAdminDeletePath)
		})
		r.Get("/home", s.handleHome)
		r.Get("/paths", s.handlePaths)
		r.Get("/paths/{slug}", s.handlePath)
		r.Get("/lessons/featured", s.handleFeaturedLessons)
		r.Get("/problems", s.handleProblems)
		r.Get("/problems/{slug}", s.handleProblem)
		r.Get("/leaderboards/xp", s.handleLeaderboard)
		r.Get("/progress/overview", s.handleProgressOverview)
		r.Post("/run", s.handleRun)
		r.Post("/submit", s.handleSubmit)
		r.Get("/submissions", s.handleCurrentUserSubmissions)
		r.Get("/submissions/{submissionID}", s.handleSubmissionStatus)
		r.Get("/submissions/{submissionID}/stream", s.handleSubmissionStream)
	})

	return r
}

func (s *Server) withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", s.cfg.CORSOrigin)
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status": "ok",
		"time":   time.Now().Format(time.RFC3339),
		"services": map[string]any{
			"api":      "up",
			"content":  map[string]any{"dataSource": contentDataSource(s.store.UsingPostgres())},
			"postgres": map[string]any{"configured": s.cfg.PostgresDSN != "", "connected": s.store.UsingPostgres()},
			"leaderboard": map[string]any{
				"dataSource": leaderboardDataSource(s.store.UsingRedis(), s.store.UsingPostgres()),
			},
			"submissions": map[string]any{
				"dataSource": submissionsDataSource(s.store.UsingPostgres(), s.store.UsingRedis()),
			},
			"redis": map[string]any{
				"configured": s.cfg.RedisAddr != "",
				"connected":  s.store.UsingRedis(),
				"queueDepth": s.store.QueueDepth(),
			},
			"judge0": map[string]any{
				"configured": s.cfg.Judge0URL != "",
				"mockMode":   s.cfg.EnableMockJudge,
			},
		},
	})
}

func (s *Server) handleHome(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.store.GetHome())
}

func (s *Server) handlePaths(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.store.GetPaths())
}

func (s *Server) handlePath(w http.ResponseWriter, r *http.Request) {
	path, ok := s.store.FindPath(chi.URLParam(r, "slug"))
	if !ok {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "path not found"})
		return
	}
	writeJSON(w, http.StatusOK, path)
}

func (s *Server) handleFeaturedLessons(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.store.GetFeaturedLessons())
}

func (s *Server) handleProblems(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.store.GetProblems())
}

func (s *Server) handleProblem(w http.ResponseWriter, r *http.Request) {
	problem, ok := s.store.FindProblem(chi.URLParam(r, "slug"))
	if !ok {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "problem not found"})
		return
	}
	writeJSON(w, http.StatusOK, problem)
}

func (s *Server) handleLeaderboard(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.store.GetLeaderboard())
}

func (s *Server) handleProgressOverview(w http.ResponseWriter, r *http.Request) {
	user, ok := s.currentUser(r)
	if !ok {
		writeJSON(w, http.StatusOK, s.store.GetProgressOverviewForUser(""))
		return
	}
	writeJSON(w, http.StatusOK, s.store.GetProgressOverviewForUser(user.ID))
}

func (s *Server) handleRun(w http.ResponseWriter, r *http.Request) {
	var req RunRequest
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	if strings.TrimSpace(req.SourceCode) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "sourceCode is required"})
		return
	}

	stdout, compileOutput, status := simulateRun(req)

	writeJSON(w, http.StatusOK, RunResponse{
		Mode:          currentRunMode(s.cfg.EnableMockJudge),
		Status:        status,
		Stdout:        stdout,
		CompileOutput: compileOutput,
		ExecutionMS:   37,
		MemoryKB:      1248,
	})
}

func (s *Server) handleSubmit(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r)
	if !ok {
		return
	}

	var req RunRequest
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	if strings.TrimSpace(req.SourceCode) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "sourceCode is required"})
		return
	}

	submissionID := fmt.Sprintf("sub_%d", time.Now().UnixNano())
	now := time.Now()
	record := store.SubmissionRecord{
		ID:          submissionID,
		ProblemSlug: req.ProblemSlug,
		UserID:      user.ID,
		SubmitType:  "submit",
		Language:    req.Language,
		SourceCode:  req.SourceCode,
		Input:       req.Input,
		Status:      "QUEUED",
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	s.saveSubmission(record)

	queuePosition := 1
	if s.store.UsingRedis() {
		if depth := s.store.QueueDepth(); depth > 0 {
			queuePosition = int(depth)
		}
	}

	writeJSON(w, http.StatusAccepted, SubmitResponse{
		Mode:          currentJudgeMode(s.cfg.EnableMockJudge),
		Status:        "QUEUED",
		SubmissionID:  submissionID,
		QueuePosition: queuePosition,
		ETASeconds:    5,
		NextPoll:      fmt.Sprintf("/api/v1/submissions/%s", submissionID),
	})
}

func (s *Server) handleSubmissionStatus(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r)
	if !ok {
		return
	}

	submissionID := chi.URLParam(r, "submissionID")
	record, ok := s.loadCurrentSubmission(submissionID)
	if !ok {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "submission not found"})
		return
	}
	if record.UserID != user.ID {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "submission not found"})
		return
	}

	response := SubmissionStatusResponse{
		Mode:          currentJudgeMode(s.cfg.EnableMockJudge),
		SubmissionID:  submissionID,
		Status:        record.Status,
		Result:        record.Result,
		Detail:        submissionStatusDetail(record.Status),
		Stdout:        record.Stdout,
		CompileOutput: record.CompileOutput,
		ElapsedMS:     time.Since(record.CreatedAt).Milliseconds(),
	}

	if record.FinishedAt != nil {
		response.FinishedAt = record.FinishedAt.Format(time.RFC3339)
	}

	writeJSON(w, http.StatusOK, response)
}

func (s *Server) handleSubmissionStream(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r)
	if !ok {
		return
	}

	submissionID := chi.URLParam(r, "submissionID")
	record, ok := s.loadCurrentSubmission(submissionID)
	if !ok {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "submission not found"})
		return
	}
	if record.UserID != user.ID {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "submission not found"})
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "streaming unsupported"})
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	sendStatus := func(current store.SubmissionRecord) error {
		payload := SubmissionStatusResponse{
			Mode:          currentJudgeMode(s.cfg.EnableMockJudge),
			SubmissionID:  submissionID,
			Status:        current.Status,
			Result:        current.Result,
			Detail:        submissionStatusDetail(current.Status),
			Stdout:        current.Stdout,
			CompileOutput: current.CompileOutput,
			ElapsedMS:     time.Since(current.CreatedAt).Milliseconds(),
		}
		if current.FinishedAt != nil {
			payload.FinishedAt = current.FinishedAt.Format(time.RFC3339)
		}

		encoded, err := json.Marshal(payload)
		if err != nil {
			return err
		}

		if _, err := fmt.Fprintf(w, "event: status\ndata: %s\n\n", encoded); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}

	if err := sendStatus(record); err != nil {
		return
	}
	if record.Status == "FINISHED" {
		return
	}

	ticker := time.NewTicker(1200 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-ticker.C:
			record, ok = s.loadCurrentSubmission(submissionID)
			if !ok {
				return
			}
			if err := sendStatus(record); err != nil {
				return
			}
			if record.Status == "FINISHED" {
				return
			}
		}
	}
}

func decodeJSON(r *http.Request, target any) error {
	defer r.Body.Close()

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func currentRunMode(mock bool) string {
	if mock {
		return "mock runtime"
	}
	return "judge0 runtime"
}

func currentJudgeMode(mock bool) string {
	if mock {
		return "mock queue"
	}
	return "judge0 queue"
}

func contentDataSource(usingPostgres bool) string {
	if usingPostgres {
		return "postgres-jsonb"
	}
	return "memory"
}

func leaderboardDataSource(usingRedis, usingPostgres bool) string {
	if usingRedis {
		return "redis"
	}
	if usingPostgres {
		return "postgres-jsonb"
	}
	return "memory"
}

func submissionsDataSource(usingPostgres, usingRedis bool) string {
	if usingPostgres && usingRedis {
		return "postgres+redis"
	}
	if usingPostgres {
		return "postgres"
	}
	if usingRedis {
		return "redis"
	}
	return "memory"
}

func (s *Server) saveSubmission(record store.SubmissionRecord) {
	if s.store.SaveSubmission(record) {
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	s.submissions[record.ID] = record
}

func (s *Server) getSubmission(id string) (store.SubmissionRecord, bool) {
	if record, ok := s.store.FindSubmission(id); ok {
		return record, true
	}

	s.mu.RLock()
	defer s.mu.RUnlock()
	record, ok := s.submissions[id]
	return record, ok
}

func (s *Server) loadCurrentSubmission(id string) (store.SubmissionRecord, bool) {
	record, ok := s.getSubmission(id)
	if !ok {
		return record, false
	}

	if !s.store.UsingRedis() {
		advancedRecord, changed := advanceLocalSubmission(record)
		if changed {
			record = advancedRecord
			s.saveSubmission(record)
		}
	}

	return record, true
}

func advanceLocalSubmission(record store.SubmissionRecord) (store.SubmissionRecord, bool) {
	now := time.Now()

	switch record.Status {
	case "QUEUED":
		if now.Sub(record.CreatedAt) < 2*time.Second {
			return record, false
		}
		record.Status = "RUNNING"
		record.UpdatedAt = now
		return record, true
	case "RUNNING":
		if now.Sub(record.UpdatedAt) < 2*time.Second {
			return record, false
		}
		stdout, compileOutput, result := simulateRun(RunRequest{
			ProblemSlug: record.ProblemSlug,
			Language:    record.Language,
			SourceCode:  record.SourceCode,
			Input:       record.Input,
		})
		record.Status = "FINISHED"
		record.Result = result
		record.Stdout = stdout
		record.CompileOutput = compileOutput
		record.UpdatedAt = now
		record.FinishedAt = &now
		return record, true
	default:
		return record, false
	}
}

func submissionStatusDetail(status string) string {
	switch status {
	case "QUEUED":
		return "Queued and waiting for worker processing."
	case "RUNNING":
		return "Worker is processing the submission."
	case "FINISHED":
		return "Submission finished and result has been written back."
	default:
		return "Submission status recorded."
	}
}

func simulateRun(req RunRequest) (stdout string, compileOutput string, status string) {
	source := strings.TrimSpace(req.SourceCode)
	normalized := strings.ToLower(source)

	switch {
	case strings.Contains(normalized, "todo") && !strings.Contains(normalized, "cout"):
		return "", "Incomplete code detected. Please finish the logic.", "NEEDS_WORK"
	case strings.Contains(normalized, "syntax_error"):
		return "", "Mock compile failed: check semicolons or brackets.", "COMPILE_ERROR"
	case strings.Contains(normalized, "g++ hello.cpp -o hello") && strings.Contains(normalized, "./hello"):
		return "Compile command order is correct. Linux path can continue.", "", "ACCEPTED"
	case strings.Contains(normalized, "hello c++"):
		return "Hello C++", "", "ACCEPTED"
	case strings.Contains(normalized, "2+3*4") || strings.Contains(normalized, "2 + 3 * 4") || strings.Contains(normalized, "priorityscore"):
		return "14", "", "ACCEPTED"
	case strings.Contains(normalized, "calculatexp") || strings.Contains(normalized, "prototype"):
		return "42", "", "ACCEPTED"
	case strings.Contains(normalized, "sizeof") && strings.Contains(normalized, "double"):
		return "8", "", "ACCEPTED"
	case strings.Contains(normalized, "%") || strings.Contains(normalized, "remainder"):
		return "1", "", "ACCEPTED"
	case strings.Contains(normalized, "++") && strings.Contains(normalized, "count"):
		return "COUNT", "", "ACCEPTED"
	case strings.Contains(normalized, "continue") && strings.Contains(normalized, "skip"):
		return "SKIP", "", "ACCEPTED"
	case strings.Contains(normalized, "default") && strings.Contains(normalized, "rest"):
		return "REST", "", "ACCEPTED"
	case strings.Contains(normalized, "copyvalue") || strings.Contains(normalized, "unchanged"):
		return "UNCHANGED", "", "ACCEPTED"
	case strings.Contains(normalized, "doublexp") && strings.Contains(normalized, "return"):
		return "64", "", "ACCEPTED"
	case strings.Contains(normalized, "const int days") || strings.Contains(normalized, "#define months"):
		return "7", "", "ACCEPTED"
	case strings.Contains(normalized, "safe") || strings.Contains(normalized, "alert"):
		return "SAFE", "", "ACCEPTED"
	case strings.Contains(normalized, "char") && strings.Contains(normalized, "'a'"):
		return "A", "", "ACCEPTED"
	case strings.Contains(normalized, "g++ -g hello.cpp -o hello") && strings.Contains(normalized, "gdb ./hello"):
		return "GDB", "", "ACCEPTED"
	case strings.Contains(normalized, "break main") && strings.Contains(normalized, "print score"):
		return "BREAK", "", "ACCEPTED"
	case strings.Contains(normalized, "break main") && strings.Contains(normalized, "next"):
		return "NEXT", "", "ACCEPTED"
	case strings.Contains(normalized, "open") || strings.Contains(normalized, "wait"):
		return "OPEN", "", "ACCEPTED"
	case strings.Contains(normalized, "mon") || strings.Contains(normalized, "tue") || strings.Contains(normalized, "wed"):
		return "MON", "", "ACCEPTED"
	case strings.Contains(normalized, "sum") || strings.Contains(normalized, "total"):
		return "8", "", "ACCEPTED"
	case strings.Contains(normalized, "pass") || strings.Contains(normalized, "retry"):
		return "PASS", "", "ACCEPTED"
	case strings.Contains(normalized, "swapvalue") || strings.Contains(normalized, "delete"):
		return "Mock execution finished: logic structure recognized.", "", "ACCEPTED"
	default:
		return "Mock runner accepted the code and returned instant feedback.", "", "RUN_FINISHED"
	}
}
