package httpapi

import (
	"net/http"
	"strings"
	"time"

	"cpp-fun-learning-site/api/internal/store"
	"github.com/go-chi/chi/v5"
)

type credentialsRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authResponse struct {
	User store.UserAccount `json:"user"`
}

type updateUserStatusRequest struct {
	IsActive bool `json:"isActive"`
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	var req credentialsRequest
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	user, err := s.store.RegisterUser(req.Name, req.Email, req.Password)
	if err != nil {
		status := http.StatusBadRequest
		if err == store.ErrUserExists {
			status = http.StatusConflict
		}
		writeJSON(w, status, map[string]string{"error": err.Error()})
		return
	}

	if !s.issueSession(w, user.ID) {
		return
	}
	writeJSON(w, http.StatusCreated, authResponse{User: user})
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req credentialsRequest
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	user, err := s.store.AuthenticateUser(req.Email, req.Password)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "email or password is incorrect"})
		return
	}

	if !s.issueSession(w, user.ID) {
		return
	}
	writeJSON(w, http.StatusOK, authResponse{User: user})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(s.cfg.SessionCookie); err == nil {
		_ = s.store.DeleteSession(cookie.Value)
	}
	s.clearSessionCookie(w)
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":       true,
		"activity": s.store.ListAdminActivity(20),
	})
}

func (s *Server) handleCurrentUser(w http.ResponseWriter, r *http.Request) {
	user, ok := s.currentUser(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	writeJSON(w, http.StatusOK, authResponse{User: user})
}

func (s *Server) handleCurrentUserSubmissions(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r)
	if !ok {
		return
	}
	writeJSON(w, http.StatusOK, s.store.ListUserSubmissions(user.ID, 12))
}

func (s *Server) handleAdminOverview(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	writeJSON(w, http.StatusOK, s.store.GetAdminOverview())
}

func (s *Server) handleAdminUsers(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	writeJSON(w, http.StatusOK, s.store.ListUsersForAdmin())
}

func (s *Server) handleAdminActivity(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	writeJSON(w, http.StatusOK, s.store.ListAdminActivity(20))
}

func (s *Server) handleAdminUpdateUserStatus(w http.ResponseWriter, r *http.Request) {
	admin, ok := s.requireAdmin(w, r)
	if !ok {
		return
	}

	userID := chi.URLParam(r, "userID")
	if strings.TrimSpace(userID) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "userID is required"})
		return
	}
	if admin.ID == userID {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "admin cannot disable current account"})
		return
	}

	var req updateUserStatusRequest
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if err := s.store.SetUserActive(userID, req.IsActive); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to update user"})
		return
	}
	action := "disable_user"
	detail := "Disabled learner account"
	if req.IsActive {
		action = "enable_user"
		detail = "Enabled learner account"
	}
	_ = s.store.RecordAdminActivity(admin, action, "user", userID, detail)
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (s *Server) currentUser(r *http.Request) (store.UserAccount, bool) {
	cookie, err := r.Cookie(s.cfg.SessionCookie)
	if err != nil || strings.TrimSpace(cookie.Value) == "" {
		return store.UserAccount{}, false
	}
	return s.store.FindUserBySession(cookie.Value)
}

func (s *Server) requireUser(w http.ResponseWriter, r *http.Request) (store.UserAccount, bool) {
	user, ok := s.currentUser(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "please login first"})
		return store.UserAccount{}, false
	}
	return user, true
}

func (s *Server) requireAdmin(w http.ResponseWriter, r *http.Request) (store.UserAccount, bool) {
	user, ok := s.requireUser(w, r)
	if !ok {
		return store.UserAccount{}, false
	}
	if user.Role != "admin" {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "admin access required"})
		return store.UserAccount{}, false
	}
	return user, true
}

func (s *Server) issueSession(w http.ResponseWriter, userID string) bool {
	session, err := s.store.CreateSession(userID, time.Duration(s.cfg.SessionTTLHours)*time.Hour)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create session"})
		return false
	}

	http.SetCookie(w, &http.Cookie{
		Name:     s.cfg.SessionCookie,
		Value:    session.Token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
		Expires:  session.ExpiresAt,
		MaxAge:   int(time.Until(session.ExpiresAt).Seconds()),
	})
	return true
}

func (s *Server) clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     s.cfg.SessionCookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
	})
}
