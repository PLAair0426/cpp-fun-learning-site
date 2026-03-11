package runtime

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type judge0SubmissionRequest struct {
	SourceCode string `json:"source_code"`
	LanguageID int    `json:"language_id"`
	Stdin      string `json:"stdin,omitempty"`
}

type judge0SubmitResponse struct {
	Token string `json:"token"`
}

type judge0Status struct {
	ID          int    `json:"id"`
	Description string `json:"description"`
}

type judge0SubmissionResponse struct {
	Token         string       `json:"token"`
	Stdout        *string      `json:"stdout"`
	Stderr        *string      `json:"stderr"`
	CompileOutput *string      `json:"compile_output"`
	Message       *string      `json:"message"`
	Status        judge0Status `json:"status"`
}

func (s *Service) useRealJudge0() bool {
	return !s.cfg.EnableMockJudge && strings.TrimSpace(s.cfg.Judge0URL) != ""
}

func (s *Service) submitToJudge0(ctx context.Context, record SubmissionRecord) (string, error) {
	requestBody := judge0SubmissionRequest{
		SourceCode: record.SourceCode,
		LanguageID: s.languageIDFor(record.Language),
		Stdin:      record.Input,
	}

	body, err := json.Marshal(requestBody)
	if err != nil {
		return "", err
	}

	endpoint, err := url.JoinPath(strings.TrimRight(s.cfg.Judge0URL, "/"), "submissions")
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	s.applyJudge0Auth(req)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		payload, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return "", fmt.Errorf("judge0 submit failed: status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(payload)))
	}

	var result judge0SubmitResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	if result.Token == "" {
		return "", fmt.Errorf("judge0 submit returned empty token")
	}

	return result.Token, nil
}

func (s *Service) fetchJudge0Submission(ctx context.Context, token string) (judge0SubmissionResponse, error) {
	fields := "token,stdout,stderr,compile_output,message,status"
	endpoint, err := url.JoinPath(strings.TrimRight(s.cfg.Judge0URL, "/"), "submissions", token)
	if err != nil {
		return judge0SubmissionResponse{}, err
	}

	requestURL := endpoint + "?base64_encoded=false&fields=" + url.QueryEscape(fields)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return judge0SubmissionResponse{}, err
	}
	s.applyJudge0Auth(req)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return judge0SubmissionResponse{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		payload, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return judge0SubmissionResponse{}, fmt.Errorf("judge0 poll failed: status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(payload)))
	}

	var result judge0SubmissionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return judge0SubmissionResponse{}, err
	}

	return result, nil
}

func (s *Service) applyJudge0Auth(req *http.Request) {
	if strings.TrimSpace(s.cfg.Judge0AuthToken) == "" {
		return
	}
	req.Header.Set(s.cfg.Judge0AuthHeader, s.cfg.Judge0AuthToken)
}

func (s *Service) languageIDFor(language string) int {
	switch strings.ToLower(strings.TrimSpace(language)) {
	case "c", "gcc":
		return s.cfg.CLanguageID
	case "cpp", "c++", "g++":
		return s.cfg.CppLanguageID
	default:
		return s.cfg.CppLanguageID
	}
}

func mapJudge0Response(record SubmissionRecord, response judge0SubmissionResponse, now time.Time) SubmissionRecord {
	record.Judge0Token = response.Token
	record.UpdatedAt = now

	switch response.Status.ID {
	case 1:
		record.Status = "QUEUED"
	case 2:
		record.Status = "RUNNING"
	default:
		record.Status = "FINISHED"
		record.Result = normalizeJudge0Result(response.Status)
		record.Stdout = firstNonEmpty(response.Stdout, response.Stderr)
		record.CompileOutput = firstNonEmpty(response.CompileOutput, response.Message)
		record.FinishedAt = &now
	}

	return record
}

func normalizeJudge0Result(status judge0Status) string {
	normalized := strings.ToUpper(strings.ReplaceAll(status.Description, " ", "_"))
	switch status.ID {
	case 3:
		return "ACCEPTED"
	case 4:
		return "WRONG_ANSWER"
	case 5:
		return "TIME_LIMIT_EXCEEDED"
	case 6:
		return "COMPILATION_ERROR"
	case 7:
		return "RUNTIME_ERROR_SIGSEGV"
	case 8:
		return "RUNTIME_ERROR_SIGXFSZ"
	case 9:
		return "RUNTIME_ERROR_SIGFPE"
	case 10:
		return "RUNTIME_ERROR_SIGABRT"
	case 11:
		return "RUNTIME_ERROR_NZEC"
	case 12:
		return "RUNTIME_ERROR_OTHER"
	case 13:
		return "INTERNAL_ERROR"
	case 14:
		return "EXEC_FORMAT_ERROR"
	default:
		if normalized == "" {
			return "UNKNOWN"
		}
		return normalized
	}
}

func firstNonEmpty(values ...*string) string {
	for _, value := range values {
		if value != nil && strings.TrimSpace(*value) != "" {
			return *value
		}
	}
	return ""
}

func judge0Context(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 15*time.Second)
}
