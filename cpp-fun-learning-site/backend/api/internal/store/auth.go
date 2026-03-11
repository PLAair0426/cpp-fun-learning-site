package store

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
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
			`insert into users (id, name, email, password_hash)
			 values ($1, $2, $3, $4)
			 returning id, name, email, created_at`,
			newID("usr"),
			normalizedName,
			normalizedEmail,
			string(passwordHash),
		).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)
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
			`select id, name, email, password_hash, created_at
			 from users
			 where email = $1`,
			normalizedEmail,
		).Scan(&user.ID, &user.Name, &user.Email, &passwordHash, &user.CreatedAt)
		if err != nil {
			if err == pgx.ErrNoRows {
				return UserAccount{}, ErrInvalidCredentials
			}
			return UserAccount{}, err
		}

		if compareErr := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); compareErr != nil {
			return UserAccount{}, ErrInvalidCredentials
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
			`select u.id, u.name, u.email, u.created_at, us.expires_at
			 from user_sessions us
			 join users u on u.id = us.user_id
			 where us.token = $1`,
			token,
		).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt, &expiresAt)
		if err != nil {
			return UserAccount{}, false
		}
		if expiresAt.Before(time.Now()) {
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
	return user, ok
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
		return nil
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

	return nil
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
