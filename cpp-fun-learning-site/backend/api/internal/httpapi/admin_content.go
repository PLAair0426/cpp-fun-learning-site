package httpapi

import (
	"errors"
	"net/http"

	"cpp-fun-learning-site/api/internal/store"
	"github.com/go-chi/chi/v5"
)

func (s *Server) handleAdminContentCatalog(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	writeJSON(w, http.StatusOK, s.store.GetAdminContentCatalog())
}

func (s *Server) handleAdminCreateProblem(w http.ResponseWriter, r *http.Request) {
	admin, ok := s.requireAdmin(w, r)
	if !ok {
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
	_ = s.store.RecordAdminActivity(admin, "create_problem", "problem", req.Slug, req.Title)

	writeJSON(w, http.StatusCreated, map[string]any{
		"ok":       true,
		"overview": s.store.GetAdminOverview(),
		"content":  s.store.GetAdminContentCatalog(),
		"activity": s.store.ListAdminActivity(20),
	})
}

func (s *Server) handleAdminCreatePath(w http.ResponseWriter, r *http.Request) {
	admin, ok := s.requireAdmin(w, r)
	if !ok {
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
	_ = s.store.RecordAdminActivity(admin, "create_path", "path", req.Slug, req.Title)

	writeJSON(w, http.StatusCreated, map[string]any{
		"ok":       true,
		"overview": s.store.GetAdminOverview(),
		"content":  s.store.GetAdminContentCatalog(),
		"activity": s.store.ListAdminActivity(20),
	})
}

func (s *Server) handleAdminDeleteProblem(w http.ResponseWriter, r *http.Request) {
	admin, ok := s.requireAdmin(w, r)
	if !ok {
		return
	}

	slug := chi.URLParam(r, "slug")
	if err := s.store.DeleteAdminProblem(slug); err != nil {
		writeJSON(w, adminContentStatus(err), map[string]string{"error": err.Error()})
		return
	}
	_ = s.store.RecordAdminActivity(admin, "delete_problem", "problem", slug, "Removed problem from managed content")

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":       true,
		"overview": s.store.GetAdminOverview(),
		"content":  s.store.GetAdminContentCatalog(),
		"activity": s.store.ListAdminActivity(20),
	})
}

func (s *Server) handleAdminDeletePath(w http.ResponseWriter, r *http.Request) {
	admin, ok := s.requireAdmin(w, r)
	if !ok {
		return
	}

	slug := chi.URLParam(r, "slug")
	if err := s.store.DeleteAdminPath(slug); err != nil {
		writeJSON(w, adminContentStatus(err), map[string]string{"error": err.Error()})
		return
	}
	_ = s.store.RecordAdminActivity(admin, "delete_path", "path", slug, "Removed path from managed content")

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":       true,
		"overview": s.store.GetAdminOverview(),
		"content":  s.store.GetAdminContentCatalog(),
		"activity": s.store.ListAdminActivity(20),
	})
}

func adminContentStatus(err error) int {
	switch {
	case errors.Is(err, store.ErrContentExists):
		return http.StatusConflict
	case errors.Is(err, store.ErrContentInvalid):
		return http.StatusBadRequest
	case errors.Is(err, store.ErrContentNotFound):
		return http.StatusNotFound
	default:
		return http.StatusInternalServerError
	}
}
