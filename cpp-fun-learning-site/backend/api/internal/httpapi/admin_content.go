package httpapi

import (
	"errors"
	"net/http"

	"cpp-fun-learning-site/api/internal/store"
)

func (s *Server) handleAdminContentCatalog(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	writeJSON(w, http.StatusOK, s.store.GetAdminContentCatalog())
}

func (s *Server) handleAdminCreateProblem(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}

	var req store.AdminCreateProblemInput
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if err := s.store.CreateAdminProblem(req); err != nil {
		writeJSON(w, adminContentStatus(err), map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"ok":       true,
		"overview": s.store.GetAdminOverview(),
		"content":  s.store.GetAdminContentCatalog(),
	})
}

func (s *Server) handleAdminCreatePath(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}

	var req store.AdminCreatePathInput
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if err := s.store.CreateAdminPath(req); err != nil {
		writeJSON(w, adminContentStatus(err), map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"ok":       true,
		"overview": s.store.GetAdminOverview(),
		"content":  s.store.GetAdminContentCatalog(),
	})
}

func adminContentStatus(err error) int {
	switch {
	case errors.Is(err, store.ErrContentExists):
		return http.StatusConflict
	case errors.Is(err, store.ErrContentInvalid):
		return http.StatusBadRequest
	default:
		return http.StatusInternalServerError
	}
}
