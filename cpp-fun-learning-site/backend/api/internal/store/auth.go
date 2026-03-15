package store

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserExists          = errors.New("user already exists")
	ErrInvalidCredentials  = errors.New("invalid email or password")
	ErrInvalidRegistration = errors.New("name, email and password are required")
)

type UserAccount struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	IsActive  bool      `json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
}

type SessionRecord struct {
	Token     string
	UserID    string
	CreatedAt time.Time
	ExpiresAt time.Time
}

type UserSubmissionSummary struct {
	SubmissionID string    `json:"submissionId"`
	ProblemSlug  string    `json:"problemSlug"`
	ProblemTitle string    `json:"problemTitle"`
	Status       string    `json:"status"`
	Result       string    `json:"result"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type AdminUserDetail struct {
	UserAccount
	SubmissionCount int       `json:"submissionCount"`
	AcceptedCount   int       `json:"acceptedCount"`
	LastActiveAt    time.Time `json:"lastActiveAt,omitempty"`
}

type AdminOverview struct {
	TotalUsers          int `json:"totalUsers"`
	ActiveUsers         int `json:"activeUsers"`
	AdminUsers          int `json:"adminUsers"`
	TotalSubmissions    int `json:"totalSubmissions"`
	AcceptedSubmissions int `json:"acceptedSubmissions"`
	TotalPaths          int `json:"totalPaths"`
	TotalLessons        int `json:"totalLessons"`
	TotalProblems       int `json:"totalProblems"`
}

type memoryUser struct {
	UserAccount
	PasswordHash []byte
}

func (s *Store) RegisterUser(name, email, password string) (UserAccount, error) {
	normalizedName := strings.TrimSpace(name)
	normalizedEmail := normalizeEmail(email)
	normalizedPassword := strings.TrimSpace(password)
	if normalizedName == "" || normalizedEmail == "" || normalizedPassword == "" {
		return UserAccount{}, ErrInvalidRegistration
	}
	if len(normalizedPassword) < 6 {
		return UserAccount{}, errors.New("password must be at least 6 characters")
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(normalizedPassword), bcrypt.DefaultCost)
	if err != nil {
		return UserAccount{}, err
	}

	if s.db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		user := UserAccount{}
		err = s.db.QueryRow(
			ctx,
			`insert into users (id, name, email, password_hash, role, is_active)
			 values ($1, $2, $3, $4, 'learner', true)
			 returning id, name, email, role, is_active, created_at`,
			newID("usr"),
			normalizedName,
			normalizedEmail,
			string(passwordHash),
		).Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.IsActive, &user.CreatedAt)
		if err == nil {
			return user, nil
		}
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "users_email_key") {
			return UserAccount{}, ErrUserExists
		}
		return UserAccount{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.usersByMail[normalizedEmail]; exists {
		return UserAccount{}, ErrUserExists
	}

	user := UserAccount{
		ID:        newID("usr"),
		Name:      normalizedName,
		Email:     normalizedEmail,
		Role:      "learner",
		IsActive:  true,
		CreatedAt: time.Now(),
	}
	s.usersByID[user.ID] = user
	s.usersByMail[normalizedEmail] = memoryUser{
		UserAccount:  user,
		PasswordHash: passwordHash,
	}

	return user, nil
}

func (s *Store) AuthenticateUser(email, password string) (UserAccount, error) {
	normalizedEmail := normalizeEmail(email)
	if normalizedEmail == "" || strings.TrimSpace(password) == "" {
		return UserAccount{}, ErrInvalidCredentials
	}

	if s.db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		var user UserAccount
		var passwordHash string
		err := s.db.QueryRow(
			ctx,
			`select id, name, email, role, is_active, password_hash, created_at
			 from users
			 where email = $1`,
			normalizedEmail,
		).Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.IsActive, &passwordHash, &user.CreatedAt)
		if err != nil {
			if err == pgx.ErrNoRows {
				return UserAccount{}, ErrInvalidCredentials
			}
			return UserAccount{}, err
		}

		if compareErr := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); compareErr != nil {
			return UserAccount{}, ErrInvalidCredentials
		}
		if !user.IsActive {
			return UserAccount{}, errors.New("account has been disabled")
		}

		return user, nil
	}

	s.mu.RLock()
	storedUser, ok := s.usersByMail[normalizedEmail]
	s.mu.RUnlock()
	if !ok {
		return UserAccount{}, ErrInvalidCredentials
	}
	if compareErr := bcrypt.CompareHashAndPassword(storedUser.PasswordHash, []byte(password)); compareErr != nil {
		return UserAccount{}, ErrInvalidCredentials
	}
	if !storedUser.IsActive {
		return UserAccount{}, errors.New("account has been disabled")
	}
	return storedUser.UserAccount, nil
}

func (s *Store) CreateSession(userID string, ttl time.Duration) (SessionRecord, error) {
	session := SessionRecord{
		Token:     newID("sess"),
		UserID:    userID,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(ttl),
	}

	if s.db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		_, err := s.db.Exec(
			ctx,
			`insert into user_sessions (token, user_id, expires_at)
			 values ($1, $2, $3)`,
			session.Token,
			session.UserID,
			session.ExpiresAt,
		)
		if err != nil {
			return SessionRecord{}, err
		}
		return session, nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	s.sessions[session.Token] = session
	return session, nil
}

func (s *Store) FindUserBySession(token string) (UserAccount, bool) {
	if strings.TrimSpace(token) == "" {
		return UserAccount{}, false
	}

	if s.db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		var user UserAccount
		var expiresAt time.Time
		err := s.db.QueryRow(
			ctx,
			`select u.id, u.name, u.email, u.role, u.is_active, u.created_at, us.expires_at
			 from user_sessions us
			 join users u on u.id = us.user_id
			 where us.token = $1`,
			token,
		).Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.IsActive, &user.CreatedAt, &expiresAt)
		if err != nil {
			return UserAccount{}, false
		}
		if expiresAt.Before(time.Now()) {
			_ = s.DeleteSession(token)
			return UserAccount{}, false
		}
		if !user.IsActive {
			_ = s.DeleteSession(token)
			return UserAccount{}, false
		}
		return user, true
	}

	s.mu.RLock()
	session, ok := s.sessions[token]
	s.mu.RUnlock()
	if !ok || session.ExpiresAt.Before(time.Now()) {
		if ok {
			_ = s.DeleteSession(token)
		}
		return UserAccount{}, false
	}

	s.mu.RLock()
	user, ok := s.usersByID[session.UserID]
	s.mu.RUnlock()
	return user, ok && user.IsActive
}

func (s *Store) DeleteSession(token string) error {
	if strings.TrimSpace(token) == "" {
		return nil
	}

	if s.db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_, err := s.db.Exec(ctx, `delete from user_sessions where token = $1`, token)
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, token)
	return nil
}

func (s *Store) ListUserSubmissions(userID string, limit int) []UserSubmissionSummary {
	if strings.TrimSpace(userID) == "" {
		return []UserSubmissionSummary{}
	}
	if limit <= 0 {
		limit = 12
	}

	if s.db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		rows, err := s.db.Query(
			ctx,
			`select s.id,
			        s.problem_slug,
			        coalesce(p.title, s.problem_slug),
			        s.status,
			        coalesce(s.result, ''),
			        s.created_at,
			        s.updated_at
			 from submissions s
			 left join problems p on p.slug = s.problem_slug
			 where s.user_id = $1
			 order by s.created_at desc
			 limit $2`,
			userID,
			limit,
		)
		if err != nil {
			return nil
		}
		defer rows.Close()

		items := make([]UserSubmissionSummary, 0, limit)
		for rows.Next() {
			var item UserSubmissionSummary
			if scanErr := rows.Scan(
				&item.SubmissionID,
				&item.ProblemSlug,
				&item.ProblemTitle,
				&item.Status,
				&item.Result,
				&item.CreatedAt,
				&item.UpdatedAt,
			); scanErr == nil {
				items = append(items, item)
			}
		}
		return items
	}

	records := s.listMemoryUserSubmissions(userID)
	if len(records) > limit {
		records = records[:limit]
	}

	problemTitles := make(map[string]string, len(s.currentProblems()))
	for _, problem := range s.currentProblems() {
		problemTitles[problem.Slug] = problem.Title
	}

	items := make([]UserSubmissionSummary, 0, len(records))
	for _, record := range records {
		items = append(items, UserSubmissionSummary{
			SubmissionID: record.ID,
			ProblemSlug:  record.ProblemSlug,
			ProblemTitle: defaultString(problemTitles[record.ProblemSlug], record.ProblemSlug),
			Status:       record.Status,
			Result:       record.Result,
			CreatedAt:    record.CreatedAt,
			UpdatedAt:    record.UpdatedAt,
		})
	}

	return items
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func newID(prefix string) string {
	buffer := make([]byte, 12)
	if _, err := rand.Read(buffer); err != nil {
		return fmt.Sprintf("%s_%d", prefix, time.Now().UnixNano())
	}
	return fmt.Sprintf("%s_%s", prefix, hex.EncodeToString(buffer))
}

func (s *Store) EnsureAdminUser(name, email, password string) error {
	normalizedEmail := normalizeEmail(email)
	normalizedName := strings.TrimSpace(name)
	normalizedPassword := strings.TrimSpace(password)
	if normalizedEmail == "" || normalizedName == "" || normalizedPassword == "" {
		return nil
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(normalizedPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	if s.db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		_, err = s.db.Exec(
			ctx,
			`insert into users (id, name, email, password_hash, role, is_active)
			 values ($1, $2, $3, $4, 'admin', true)
			 on conflict (email) do update
			 set name = excluded.name,
			     password_hash = excluded.password_hash,
			     role = 'admin',
			     is_active = true`,
			newID("usr"),
			normalizedName,
			normalizedEmail,
			string(passwordHash),
		)
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	user, exists := s.usersByMail[normalizedEmail]
	if exists {
		user.Name = normalizedName
		user.Role = "admin"
		user.IsActive = true
		user.PasswordHash = passwordHash
		s.usersByMail[normalizedEmail] = user
		s.usersByID[user.ID] = user.UserAccount
		return nil
	}

	account := UserAccount{
		ID:        newID("usr"),
		Name:      normalizedName,
		Email:     normalizedEmail,
		Role:      "admin",
		IsActive:  true,
		CreatedAt: time.Now(),
	}
	s.usersByMail[normalizedEmail] = memoryUser{
		UserAccount:  account,
		PasswordHash: passwordHash,
	}
	s.usersByID[account.ID] = account
	return nil
}

func (s *Store) ListUsersForAdmin() []AdminUserDetail {
	if s.db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		rows, err := s.db.Query(
			ctx,
			`select u.id,
			        u.name,
			        u.email,
			        u.role,
			        u.is_active,
			        u.created_at,
			        count(s.id),
			        count(*) filter (where s.result = 'ACCEPTED'),
			        coalesce(max(s.updated_at), u.created_at)
			 from users u
			 left join submissions s on s.user_id = u.id
			 group by u.id, u.name, u.email, u.role, u.is_active, u.created_at
			 order by u.created_at desc`,
		)
		if err != nil {
			return nil
		}
		defer rows.Close()

		items := make([]AdminUserDetail, 0)
		for rows.Next() {
			var item AdminUserDetail
			if scanErr := rows.Scan(
				&item.ID,
				&item.Name,
				&item.Email,
				&item.Role,
				&item.IsActive,
				&item.CreatedAt,
				&item.SubmissionCount,
				&item.AcceptedCount,
				&item.LastActiveAt,
			); scanErr == nil {
				items = append(items, item)
			}
		}
		return items
	}

	s.mu.RLock()
	defer s.mu.RUnlock()
	items := make([]AdminUserDetail, 0, len(s.usersByID))
	submissionCountByUser := make(map[string]int)
	acceptedCountByUser := make(map[string]int)
	lastActiveAtByUser := make(map[string]time.Time)

	for _, submission := range s.submissions {
		if submission.UserID == "" {
			continue
		}

		submissionCountByUser[submission.UserID]++
		if submission.Result == "ACCEPTED" {
			acceptedCountByUser[submission.UserID]++
		}
		if submission.UpdatedAt.After(lastActiveAtByUser[submission.UserID]) {
			lastActiveAtByUser[submission.UserID] = submission.UpdatedAt
		}
	}

	for _, user := range s.usersByID {
		item := AdminUserDetail{
			UserAccount:     user,
			SubmissionCount: submissionCountByUser[user.ID],
			AcceptedCount:   acceptedCountByUser[user.ID],
			LastActiveAt:    user.CreatedAt,
		}
		if lastActiveAt, ok := lastActiveAtByUser[user.ID]; ok {
			item.LastActiveAt = lastActiveAt
		}
		items = append(items, item)
	}

	sort.Slice(items, func(left, right int) bool {
		return items[left].CreatedAt.After(items[right].CreatedAt)
	})

	return items
}

func (s *Store) SetUserActive(userID string, isActive bool) error {
	if s.db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_, err := s.db.Exec(ctx, `update users set is_active = $2 where id = $1`, userID, isActive)
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	user, ok := s.usersByID[userID]
	if !ok {
		return nil
	}
	user.IsActive = isActive
	s.usersByID[userID] = user
	mem := s.usersByMail[user.Email]
	mem.IsActive = isActive
	s.usersByMail[user.Email] = mem
	return nil
}

func (s *Store) GetAdminOverview() AdminOverview {
	paths := s.currentPaths()
	problems := s.currentProblems()
	overview := AdminOverview{
		TotalPaths:    len(paths),
		TotalLessons:  len(flattenLessonsStable(paths)),
		TotalProblems: len(problems),
	}

	if s.db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = s.db.QueryRow(
			ctx,
			`select
				count(*)::int,
				count(*) filter (where is_active)::int,
				count(*) filter (where role = 'admin')::int
			 from users`,
		).Scan(&overview.TotalUsers, &overview.ActiveUsers, &overview.AdminUsers)
		_ = s.db.QueryRow(
			ctx,
			`select
				count(*)::int,
				count(*) filter (where result = 'ACCEPTED')::int
			 from submissions`,
		).Scan(&overview.TotalSubmissions, &overview.AcceptedSubmissions)
		return overview
	}

	users := s.ListUsersForAdmin()
	overview.TotalUsers = len(users)
	for _, user := range users {
		if user.IsActive {
			overview.ActiveUsers++
		}
		if user.Role == "admin" {
			overview.AdminUsers++
		}
		overview.TotalSubmissions += user.SubmissionCount
		overview.AcceptedSubmissions += user.AcceptedCount
	}
	return overview
}
