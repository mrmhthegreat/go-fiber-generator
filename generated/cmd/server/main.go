package main

import (
    "fmt"
    "html/template"
    "log"
    "strings"
    "time"

    "github.com/bytedance/sonic"
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/compress"
    "github.com/gofiber/fiber/v2/middleware/cors"

    "github.com/gofiber/fiber/v2/middleware/encryptcookie"
    "github.com/gofiber/fiber/v2/middleware/session"
    "github.com/gofiber/storage/redis/v3"


    "github.com/gofiber/contrib/fiberi18n/v2"
    "golang.org/x/text/language"


    "github.com/gofiber/template/html/v2"


    "github.com/spf13/viper"

    "github.com/username/my_api/config"

    import_cron "github.com/username/my_api/cron"

    "github.com/username/my_api/db"
    _ "github.com/username/my_api/docs" // Swagger docs

    "github.com/username/my_api/helpers"

    "github.com/username/my_api/middleware"
    "github.com/username/my_api/routes"

    "github.com/username/my_api/storage"

)


// Template helper functions
func dict(values ...interface{}) map[string]interface{} {
    m := make(map[string]interface{})
    for i := 0; i < len(values); i += 2 {
        key := values[i].(string)
        m[key] = values[i+1]
    }
    return m
}

func marshal(v interface{}) template.JS {
    b, _ := sonic.Marshal(v)
    return template.JS(b)
}

func formatTime(t time.Time) string {
    return t.Format("02 Jan 15:04")
}


// isAPIRequest checks if the request is an API request
func isAPIRequest(ctx *fiber.Ctx) bool {
    return strings.HasPrefix(ctx.Path(), "/api/")
}

// ErrorHandler is the centralized error handler
func ErrorHandler(ctx *fiber.Ctx, err error) error {
    code := fiber.StatusInternalServerError
    errorKey := "internal_server_error"

    if e, ok := err.(*fiber.Error); ok {
        code = e.Code
        if _, exists := helpers.ErrorCodes[e.Message]; exists {
            errorKey = e.Message
        }
    }

    // API requests get JSON errors
    if isAPIRequest(ctx) {
        return helpers.SendError(ctx, code, errorKey)
    }


    // Web requests get rendered error pages
    translation := helpers.TranslateMap(ctx, config.ErrorTranslations)
    
    if ctx.Get("HX-Request") == "true" {
        ctx.Set("HX-Redirect", fmt.Sprintf("/%d", code))
        return ctx.SendStatus(code)
    }

    var templateName string
    switch code {
    case fiber.StatusNotFound:
        templateName = "errors/404"
    case fiber.StatusUnauthorized:
        templateName = "errors/401"
    case fiber.StatusForbidden:
        templateName = "errors/403"
    case fiber.StatusServiceUnavailable:
        templateName = "errors/maintenance"
    default:
        templateName = "errors/500"
    }

    message := "An error occurred"
    if errCode, exists := helpers.ErrorCodes[errorKey]; exists {
        message = errCode.Description
    }

    return ctx.Status(code).Render(templateName, fiber.Map{
        "trans":   translation,
        "code":    code,
        "message": message,
    })

}

// Swagger documentation
// @title My API
// @version 1.0.0
// @description Professional Go Fiber API
// @termsOfService http://example.com/terms/
// @contact.name API Support
// @contact.email support@example.com
// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html
// @host localhost:3000
// @BasePath /api



func main() {

    // Initialize template engine
    engine := html.New("./templates", ".html")
    engine.Reload(True)
    
    // Add template functions
    engine.AddFunc("dict", dict)
    engine.AddFunc("marshal", marshal)
    engine.AddFunc("formatTime", formatTime)
    engine.AddFunc("eq", func(a, b interface{}) bool {
        return fmt.Sprintf("%v", a) == fmt.Sprintf("%v", b)
    })


    // Create Fiber app
    app := fiber.New(fiber.Config{
        JSONEncoder:       sonic.Marshal,
        JSONDecoder:       sonic.Unmarshal,

        Views:             engine,

        BodyLimit:         50 * 1024 * 1024, // 50MB
        PassLocalsToViews: False,
        ErrorHandler:      ErrorHandler,

        ReadTimeout:       10 * time.Second,


        WriteTimeout:      10 * time.Second,

    })

    // Initialize configuration
    config.Init()

    config.InitRedisCache()


    storage.Init()


    // Initialize database
    gormDB := db.NewGormDatabase(config.DB)


    // Initialize session storage
    sessionRedisAddr := viper.GetString("REDIS_ADDR")
    if sessionRedisAddr == "" {
        sessionRedisAddr = "REDIS_ADDR"
    }
    
    storage := redis.New(redis.Config{
        Addrs: []string{sessionRedisAddr},
    })
    
    store := session.New(session.Config{
        Storage:        storage,
        CookieHTTPOnly: True,
        Expiration:     24 * time.Hour,
        CookieSecure:   False,
    })





    // Middleware and Routes are initialized via SetupRoutes
    routes.SetupRoutes(app, store, gormDB)



    // i18n middleware
    app.Use(fiberi18n.New(&fiberi18n.Config{
        RootPath:        "./locales",
        AcceptLanguages: []language.Tag{

            language.En,

            language.Fr,

            language.Ar,

        },
        LangHandler: func(ctx *fiber.Ctx, defaultLang string) string {
            return helpers.DetectLanguage(ctx)
        },
    }))


    
    app.Use(cors.New(cors.Config{
        AllowOrigins:     "*",
        AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
        AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        AllowCredentials: True,
    }))


    // Setup routes
    routes.SetupRoutes(app, store)


    // Start cron jobs
    import_cron.Start(gormDB.DB)



    // Static files
    app.Static("/static", "./static")


    // Start server
    port := viper.GetString("PORT")
    if port == "" {
        port = "3000"
    }
    
    log.Printf("🚀 Server starting on port %s", port)
    err := app.Listen(":" + port)
    if err != nil {
        log.Fatal(err)
    }
}
