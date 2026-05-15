package job

import (
	"context"


	"github.com/hibiken/asynq"
	"github.com/rs/zerolog"
	"github.com/uthred09/tasker/internal/config"
	"github.com/uthred09/tasker/internal/lib/email"
 	"github.com/uthred09/tasker/internal/lib/utils"
)

type JobService struct {
	Client *asynq.Client
	server *asynq.Server
	logger *zerolog.Logger
	authService AuthServiceInterface
	emailClient *email.Client
}

type AuthServiceInterface interface {
	GetUserEmail(ctx context.Context, userID string) (string, error)
}

func NewJobService(logger *zerolog.Logger, cfg *config.Config) *JobService {

	// Asynq needs its own opt type — but we read from the same shared options
	opts := utils.BuildOptions(cfg)

	redisOpt := asynq.RedisClientOpt{
		Addr:      opts.Addr,
		Password:  opts.Password,
		DB:        opts.DB,
		TLSConfig: opts.TLSConfig,  // nil if TLS=false, set if TLS=true
	}
	

	client := asynq.NewClient(redisOpt)
	server := asynq.NewServer(
		redisOpt,
		asynq.Config{
			Concurrency: 3,
			Queues: map[string]int{
				"critical": 6, // Higher priority queue for important emails
				"default":  3, // Default priority for most emails
				"low":      1, // Lower priority for non-urgent emails
			},
		},
	)

	return &JobService{
		Client: client,
		server: server,
		logger: logger,
	}
}

func (j *JobService) SetAuthService(authService AuthServiceInterface) {
	j.authService = authService
}

func (j *JobService) Start() error {
	// Register task handlers
	mux := asynq.NewServeMux()
	mux.HandleFunc(TaskWelcome, j.handleWelcomeEmailTask) //calls the handler
	mux.HandleFunc(TaskReminderEmail, j.handleReminderEmailTask)
	mux.HandleFunc(TaskWeeklyReportEmail, j.handleWeeklyReportEmailTask)

	j.logger.Info().Msg("Starting background job server")
	if err := j.server.Start(mux); err != nil {
		return err
	}

	return nil
}

func (j *JobService) Stop() {
	j.logger.Info().Msg("Stopping background job server")
	j.server.Shutdown()
	j.Client.Close()
}
