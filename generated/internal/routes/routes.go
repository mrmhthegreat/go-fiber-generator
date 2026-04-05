package routes

import (
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/session"
    
    "github.com/gofiber/contrib/websocket"
    

    "github.com/username/my_api/internal/api/handlers"
    "github.com/username/my_api/pkg/middleware"
    
    "github.com/username/my_api/internal/web"
    
    "github.com/username/my_api/config"
    
    fcmhandler "github.com/username/my_api/internal/api/handlers"
    
    
    emailhandler "github.com/username/my_api/internal/api/handlers"
    
    
    "github.com/username/my_api/internal/rbac"
    
)

// SetupRoutes initialises all application routes
func SetupRoutes(
    app *fiber.App,
    store *session.Store,
    cfg *config.Config,
    
    rbacSvc *rbac.Service,
    
) {
    // ── Global Middleware ─────────────────────────────────────────────────────
    middleware.SetupGlobalMiddleware(app, cfg)

    // ── API Routes ────────────────────────────────────────────────────────────
    setupAPIRoutes(app, cfg, rbacSvc)

    // ── Web Routes ────────────────────────────────────────────────────────────
    
    setupWebRoutes(app, store, cfg, rbacSvc)
    

    // ── WebSocket Routes ──────────────────────────────────────────────────────
    
    setupWebSocketRoutes(app, cfg)
    
}

// ─────────────────────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────────────────────

func setupAPIRoutes(app *fiber.App, cfg *config.Config, rbacSvc *rbac.Service) {
    api := app.Group("/api")

    
    api.Use(middleware.NewRateLimiter(middleware.APIBaseLimiter))
    

    setupPublicAPIRoutes(api, cfg)
    setupProtectedAPIRoutes(api, cfg, rbacSvc)
}

// ── Public API Routes (no auth required) ─────────────────────────────────────
    
func setupPublicAPIRoutes(api fiber.Router, cfg *config.Config) {
    
    authGroup := api.Group("/auth", middleware.NewRateLimiter(middleware.AuthLimiter))
    

    
    authGroup.Post("/signup", handlers.RegisterUser)
    authGroup.Post("/login",    handlers.LoginUser)

    
    
    authGroup.Post("/forgot-password", handlers.ForgotPassword)
    authGroup.Post("/reset-password",  handlers.ResetPassword)
    
    

    
    
    authGroup.Post("/refresh", handlers.RefreshToken)
    

    // ── Social Login ──────────────────────────────────────────────────────────
    
    
    authGroup.Post("/google", handlers.GoogleLogin)
    
    
    
    authGroup.Post("/facebook", handlers.FacebookLogin)
    
    

    
    
    
    
    
}

// ── Protected API Routes (JWT required by default) ────────────────────────────
func setupProtectedAPIRoutes(api fiber.Router, cfg *config.Config, rbacSvc *rbac.Service) {
    userGroup := api.Group("/user")

    // ── User profile ──────────────────────────────────────────────────────────
    userGroup.Get("/profile", handlers.GetUserProfile)
    userGroup.Put("/profile", handlers.UpdateUserProfile)

    
    // ── Email verification ────────────────────────────────────────────────────
    userGroup.Post("/verify-email",          handlers.VerifyEmail)
    userGroup.Post("/resend-verification",   handlers.ResendVerification)
    

    // ── Password ──────────────────────────────────────────────────────────────
    userGroup.Post("/change-password", handlers.ChangePassword)

    // ── Models (CRUD, dynamically generated from config.models) ──────────────
    
    
    
    
    
    
    // User endpoints
    userGroup := api.Group("/users")
    
    
    userGroup.Use(middleware.Auth())
    
    

    
    
    
    userGroup.Get("/:id", middleware.RequirePerm(rbacSvc, "user.view"), handlers.GetUser)
    
    
    userGroup.Post("/", middleware.RequirePerm(rbacSvc, "user.create"), handlers.CreateUser)
    
    
    userGroup.Put("/:id", middleware.RequirePerm(rbacSvc, "user.update"), handlers.UpdateUser)
    
    
    userGroup.Delete("/:id", middleware.RequirePerm(rbacSvc, "user.delete"), handlers.DeleteUser)
    
    
    
    
    
    
    
    
    userGroup.Get("/authors", middleware.RequirePerm(rbacSvc, "user.view"), handlers.GetActiveAuthors)
    
    
    
    
    
    
    
    
    
    // Post endpoints
    postGroup := api.Group("/posts")
    
    
    postGroup.Use(middleware.Auth())
    
    

    
    
    
    postGroup.Get("/:id", middleware.RequirePerm(rbacSvc, "post.view"), handlers.GetPost)
    
    
    postGroup.Post("/", middleware.RequirePerm(rbacSvc, "post.create"), handlers.CreatePost)
    
    
    postGroup.Put("/:id", middleware.RequirePerm(rbacSvc, "post.update"), handlers.UpdatePost)
    
    
    postGroup.Delete("/:id", middleware.RequirePerm(rbacSvc, "post.delete"), handlers.DeletePost)
    
    
    
    
    postGroup.Get("/:slug", middleware.RequirePerm(rbacSvc, "post.view"), handlers.GetBySlug)
    
    
    
    
    
    
    
    
    postGroup.Get("/published", middleware.RequirePerm(rbacSvc, "post.view"), handlers.GetPublishedPosts)
    
    
    
    
    postGroup.Get("/users/:author_id", middleware.RequirePerm(rbacSvc, "post.view"), handlers.GetPostsByAuthor)
    
    
    
    
    postGroup.Get("/users/:user_id", middleware.RequirePerm(rbacSvc, "post.view"), handlers.GetUserPosts)
    
    
    
    
    
    
    
    
    
    
    
    // Category endpoints
    categoryGroup := api.Group("/categorys")
    

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    // Tag endpoints
    tagGroup := api.Group("/tags")
    

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    // Comment endpoints
    commentGroup := api.Group("/comments")
    

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    // Media endpoints
    mediaGroup := api.Group("/medias")
    

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    // Product endpoints
    productGroup := api.Group("/products")
    

    
    
    
    
    
    
    
    
    

    // ── Chat API routes ───────────────────────────────────────────────────────
    
    
    chatGroup := api.Group("/v1/chat")
    
    
    
    chatGroup.Get("/conversations", handlers.ListConversations)
    
    
    chatGroup.Get("/conversations/:id/messages", handlers.ListMessages)
    
    
    chatGroup.Post("/conversations/:id/messages", handlers.SendMessage)
    
    
    chatGroup.Post("/conversations/:id/read", handlers.MarkConversationAsRead)
    
    

    // ── Notifications API routes ──────────────────────────────────────────────
    
    
    notifGroup := api.Group("/v1/notifications")
    
    notifGroup.Use(middleware.Auth())
    
    
    
    notifGroup.Get("/list", handlers.ListNotifications)
    
    
    notifGroup.Post("/:id/read", handlers.MarkNotificationAsRead)
    
    
    
    notifGroup.Post("/bulk-read", handlers.BulkMarkNotificationsAsRead)
    
    
    notifGroup.Get("/unread-count", handlers.GetUnreadNotificationCount)
    
    
    notifGroup.Delete("/:id", handlers.DeleteNotification)
    
    
    // ── FCM API routes ────────────────────────────────────────────────────────
    
    
    fcmGroup := api.Group("")
    
    
    fcmGroup.Post("/send-fcm", fcmhandler.SendFCMNotification)
    
    
    fcmGroup.Post("/subscribe-to-topic", fcmhandler.SubscribeToFCMTopic)
    
    fcmGroup.Get("/users", fcmhandler.GetUsersWithFCMTokens)
    

    // ── IMAP / Email API routes ───────────────────────────────────────────────
    
    
    emailGroup := api.Group("")
    
    
    emailGroup.Get("/get-emails-list", emailhandler.GetEmailsList)
    
    
    emailGroup.Get("/get-email-detail/:id", emailhandler.GetEmailDetail)
    
    
    emailGroup.Post("/send-email", emailhandler.ComposeEmail)
    
    
    emailGroup.Patch("/mark-email-read/:id", emailhandler.MarkEmailRead)
    
    
    emailGroup.Post("/refresh-emails", emailhandler.RefreshEmails)
    
    

    // ── RBAC API routes ───────────────────────────────────────────────────────
    
    
    rbacAPIGroup := api.Group("/rbac")
    
    
    rbacAPIGroup.Get("/roles", handlers.ListRBACRoles)
    
    
    rbacAPIGroup.Get("/roles/:id", handlers.GetRBACRole)
    
    
    rbacAPIGroup.Post("/roles", handlers.CreateRBACRole)
    
    
    rbacAPIGroup.Put("/roles/:id", handlers.UpdateRBACRole)
    
    
    rbacAPIGroup.Delete("/roles/:id", handlers.DeleteRBACRole)
    
    
    rbacAPIGroup.Get("/permissions", handlers.ListRBACPermissions)
    
    
    rbacAPIGroup.Post("/permissions/sync", handlers.SyncRBACPermissions)
    
    
    rbacAPIGroup.Get("/users/:userId/overrides", handlers.GetUserPermissionOverrides)
    
    
    rbacAPIGroup.Post("/users/:userId/overrides", handlers.SetUserPermissionOverride)
    rbacAPIGroup.Put("/users/:userId/overrides", handlers.UpdateUserPermissionOverride)
    
    
    rbacAPIGroup.Delete("/users/:userId/overrides/:permId", handlers.DeleteUserPermissionOverride)
    
    
    rbacAPIGroup.Put("/roles/:id/permissions/bulk", handlers.BulkUpdateRolePermissions)
    
    
    rbacAPIGroup.Get("/users/:userId/permissions/debug", handlers.GetUserRolePermissions)
    
    
    rbacAPIGroup.Post("/cache/invalidate/:userId", handlers.InvalidateRBACCache)
    
    
    rbacAPIGroup.Post("/check", handlers.CheckRBACPermission)
    
    rbacAPIGroup.Get("/me/permissions", handlers.GetMyRBACPermissions)
    rbacAPIGroup.Get("/users/search",   handlers.SearchUsersForRBAC)
    
}

// ─────────────────────────────────────────────────────────────────────────────
// Web Routes (template-rendered HTML)
// ─────────────────────────────────────────────────────────────────────────────

func setupWebRoutes(app *fiber.App, store *session.Store, cfg *config.Config, rbacSvc *rbac.Service) {
    webRouter := app.Group("/")
    middleware.SetupWebMiddleware(webRouter, store, cfg)

    
    webRouter.Get("/",      web.HomeHandler)
    webRouter.Get("/auth/login", web.LoginHandler)

    // ── Role-based Dashboards ─────────────────────────────────────────────────
    
    
    // Admin Dashboard
    adminGroup := webRouter.Group("/admin")
    adminGroup.Use(middleware.RequirePerm(rbacSvc, "admin.dashboard.view"))
    adminGroup.Get("/", web.AdminDashboardHomeHandler)

    // ── FCM Web routes ────────────────────────────────────────────────────────
    

    // ── IMAP Web routes ───────────────────────────────────────────────────────
    
    
    adminEmailGroup := adminGroup.Group("/api")
    
    
    adminEmailGroup.Get("/get-inbox-page", middleware.RequirePerm(rbacSvc, "post.view.user"), web.InboxPage)
    
    
    adminEmailGroup.Get("/get-sent-emails", middleware.RequirePerm(rbacSvc, "post.view.user"), web.SentPage)
    
    
    adminEmailGroup.Get("/get-email-detail/:id", middleware.RequirePerm(rbacSvc, "post.view.user"), web.EmailDetailPage)
    
    
    adminEmailGroup.Post("/send-email", middleware.RequirePerm(rbacSvc, "post.view.user"), web.ComposeEmailWeb)
    
    
    adminEmailGroup.Patch("/mark-email-read/:id", middleware.RequirePerm(rbacSvc, "post.view.user"), web.MarkEmailReadWeb)
    
    
    adminEmailGroup.Post("/refresh-emails", middleware.RequirePerm(rbacSvc, "post.view.user"), web.RefreshEmailsWeb)
    
    

    // ── RBAC Web routes ───────────────────────────────────────────────────────
    
    
    adminRbacGroup := adminGroup.Group("/rbac")
    
    
    adminRbacGroup.Get("/roles", middleware.RequirePerm(rbacSvc, "rbac.roles.manage"), web.RBACRolesPage)
    
    
    adminRbacGroup.Get("/overrides", middleware.RequirePerm(rbacSvc, "rbac.overrides.manage"), web.RBACOverridesPage)
    
    

    
    // User Dashboard
    userGroup := webRouter.Group("/dashboard")
    userGroup.Use(middleware.RequirePerm(rbacSvc, "user.dashboard.view"))
    userGroup.Get("/", web.UserDashboardHomeHandler)

    // ── FCM Web routes ────────────────────────────────────────────────────────
    

    // ── IMAP Web routes ───────────────────────────────────────────────────────
    
    
    userEmailGroup := userGroup.Group("/api")
    
    
    userEmailGroup.Get("/get-inbox-page", middleware.RequirePerm(rbacSvc, "post.view.user"), web.InboxPage)
    
    
    userEmailGroup.Get("/get-sent-emails", middleware.RequirePerm(rbacSvc, "post.view.user"), web.SentPage)
    
    
    userEmailGroup.Get("/get-email-detail/:id", middleware.RequirePerm(rbacSvc, "post.view.user"), web.EmailDetailPage)
    
    
    userEmailGroup.Post("/send-email", middleware.RequirePerm(rbacSvc, "post.view.user"), web.ComposeEmailWeb)
    
    
    userEmailGroup.Patch("/mark-email-read/:id", middleware.RequirePerm(rbacSvc, "post.view.user"), web.MarkEmailReadWeb)
    
    
    userEmailGroup.Post("/refresh-emails", middleware.RequirePerm(rbacSvc, "post.view.user"), web.RefreshEmailsWeb)
    
    

    // ── RBAC Web routes ───────────────────────────────────────────────────────
    
    
    userRbacGroup := userGroup.Group("/rbac")
    
    
    userRbacGroup.Get("/roles", middleware.RequirePerm(rbacSvc, "rbac.roles.manage"), web.RBACRolesPage)
    
    
    userRbacGroup.Get("/overrides", middleware.RequirePerm(rbacSvc, "rbac.overrides.manage"), web.RBACOverridesPage)
    
    

    
    // Super_Admin Dashboard
    super_adminGroup := webRouter.Group("/super-admin")
    super_adminGroup.Use(middleware.RequirePerm(rbacSvc, "super_admin.dashboard.view"))
    super_adminGroup.Get("/", web.SuperAdminDashboardHomeHandler)

    // ── FCM Web routes ────────────────────────────────────────────────────────
    

    // ── IMAP Web routes ───────────────────────────────────────────────────────
    
    
    super_adminEmailGroup := super_adminGroup.Group("/api")
    
    
    super_adminEmailGroup.Get("/get-inbox-page", middleware.RequirePerm(rbacSvc, "post.view.user"), web.InboxPage)
    
    
    super_adminEmailGroup.Get("/get-sent-emails", middleware.RequirePerm(rbacSvc, "post.view.user"), web.SentPage)
    
    
    super_adminEmailGroup.Get("/get-email-detail/:id", middleware.RequirePerm(rbacSvc, "post.view.user"), web.EmailDetailPage)
    
    
    super_adminEmailGroup.Post("/send-email", middleware.RequirePerm(rbacSvc, "post.view.user"), web.ComposeEmailWeb)
    
    
    super_adminEmailGroup.Patch("/mark-email-read/:id", middleware.RequirePerm(rbacSvc, "post.view.user"), web.MarkEmailReadWeb)
    
    
    super_adminEmailGroup.Post("/refresh-emails", middleware.RequirePerm(rbacSvc, "post.view.user"), web.RefreshEmailsWeb)
    
    

    // ── RBAC Web routes ───────────────────────────────────────────────────────
    
    
    super_adminRbacGroup := super_adminGroup.Group("/rbac")
    
    
    super_adminRbacGroup.Get("/roles", middleware.RequirePerm(rbacSvc, "rbac.roles.manage"), web.RBACRolesPage)
    
    
    super_adminRbacGroup.Get("/overrides", middleware.RequirePerm(rbacSvc, "rbac.overrides.manage"), web.RBACOverridesPage)
    
    

    
    
}


// ─────────────────────────────────────────────────────────────────────────────
// WebSocket Routes
// ─────────────────────────────────────────────────────────────────────────────

func setupWebSocketRoutes(app *fiber.App, cfg *config.Config) {
    ws := app.Group("/ws")
    ws.Use(func(c *fiber.Ctx) error {
        if websocket.IsWebSocketUpgrade(c) {
            return c.Next()
        }
        return fiber.ErrUpgradeRequired
    })

    
    
    // Dedicated WebSocket handlers per domain
    
    ws.Get("/chat", websocket.New(handlers.ChatWebSocketHub))
    
    
    
    ws.Get("/events", websocket.New(handlers.EventsWebSocketHub))
    
    ws.Get("/user", websocket.New(handlers.UserWebSocketHub))
    
}

