package handler

import (
	"github.com/uthred09/tasker/internal/server"
	"github.com/uthred09/tasker/internal/service"
)

type Handlers struct {
	Health   *HealthHandler
	OpenAPI  *OpenAPIHandler
	Todo     *TodoHandler
	Comment  *CommentHandler
	Category *CategoryHandler
	Webhook  *WebhookHandler
}

func NewHandlers(s *server.Server, services *service.Services) *Handlers {
	return &Handlers{
		Health:   NewHealthHandler(s),
		OpenAPI:  NewOpenAPIHandler(s),
		Todo:     NewTodoHandler(s, services.Todo),
		Category: NewCategoryHandler(s, services.Category),
		Comment:  NewCommentHandler(s, services.Comment),
		Webhook:  NewWebhookHandler(s),
	}
}
