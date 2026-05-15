package handler

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/labstack/echo/v4"
	svix "github.com/svix/svix-webhooks/go"
	"github.com/uthred09/tasker/internal/lib/job"
	
	"github.com/uthred09/tasker/internal/server"
)

type WebhookHandler struct {
	Handler
}

func NewWebhookHandler(s *server.Server) *WebhookHandler {
	return &WebhookHandler{
		Handler: NewHandler(s),
	}
}

// ClerkWebhookEvent is the top-level wrapper for all Clerk webhook events
type ClerkWebhookEvent struct {
	Data      ClerkUserData `json:"data"`
	Object    string        `json:"object"`
	Type      string        `json:"type"`
	Timestamp int64         `json:"timestamp"`
	InstanceID string       `json:"instance_id"`
}

// ClerkUserData represents the Clerk User object sent in user.* events
type ClerkUserData struct {
	ID                    string              `json:"id"`
	FirstName             string              `json:"first_name"`
	LastName              string              `json:"last_name"`
	EmailAddresses        []ClerkEmailAddress `json:"email_addresses"`
	PrimaryEmailAddressID string              `json:"primary_email_address_id"`
	ImageURL              string              `json:"image_url"`
	CreatedAt             int64               `json:"created_at"`
	UpdatedAt             int64               `json:"updated_at"`
}

// ClerkEmailAddress represents a single email address on a Clerk user
type ClerkEmailAddress struct {
	ID           string                 `json:"id"`
	EmailAddress string                 `json:"email_address"`
	Object       string                 `json:"object"`
	Verification ClerkEmailVerification `json:"verification"`
}

// ClerkEmailVerification holds verification status for an email address
type ClerkEmailVerification struct {
	Status   string `json:"status"`
	Strategy string `json:"strategy"`
}

// PrimaryEmail returns the primary email address for the user
func (u ClerkUserData) PrimaryEmail() string {
	for _, email := range u.EmailAddresses {
		if email.ID == u.PrimaryEmailAddressID {
			return email.EmailAddress
		}
	}
	if len(u.EmailAddresses) > 0 {
		return u.EmailAddresses[0].EmailAddress
	}
	return ""
}

func (h *WebhookHandler) HandleClerkWebhook(c echo.Context) error {
	// Step 1 — Read raw body before anything else
	// Svix needs raw bytes for signature verification
	body, err := io.ReadAll(c.Request().Body)
	if err != nil {
		h.server.Logger.Error().Err(err).Msg("failed to read webhook body")
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "failed to read body"})
	}

	// Step 2 — Verify Svix signature
	// Prevents bad actors from sending fake webhook events
	wh, err := svix.NewWebhook(h.server.Config.Auth.ClerkWebhookSecret)
	if err != nil {
		h.server.Logger.Error().Err(err).Msg("failed to initialize svix webhook verifier")
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "internal error"})
	}

	if err := wh.Verify(body, c.Request().Header); err != nil {
		h.server.Logger.Warn().Err(err).Msg("invalid webhook signature")
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid signature"})
	}

	// Step 3 — Parse the verified payload
	var event ClerkWebhookEvent
	if err := json.Unmarshal(body, &event); err != nil {
		h.server.Logger.Error().Err(err).Msg("failed to parse webhook payload")
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid payload"})
	}

	// Step 4 — Only handle user.created events
	if event.Type != "user.created" {
		return c.NoContent(http.StatusOK)
	}

	// Step 5 — Get primary email
	email := event.Data.PrimaryEmail()
	if email == "" {
		h.server.Logger.Warn().
			Str("user_id", event.Data.ID).
			Msg("no email address found for new user")
		return c.NoContent(http.StatusOK)
	}

	// Step 6 — Enqueue welcome email job into Redis
	task, err := job.NewWelcomeEmailTask(email, event.Data.FirstName)
	if err != nil {
		h.server.Logger.Error().Err(err).Msg("failed to create welcome email task")
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to create task"})
	}

	if _, err := h.server.Job.Client.Enqueue(task); err != nil {
		h.server.Logger.Error().Err(err).Msg("failed to enqueue welcome email task")
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to enqueue task"})
	}

	h.server.Logger.Info().
		Str("user_id", event.Data.ID).
		Str("email", email).
		Msg("welcome email task enqueued successfully")

	// Step 7 — Return 200 so Clerk marks delivery as successful
	return c.NoContent(http.StatusOK)
}