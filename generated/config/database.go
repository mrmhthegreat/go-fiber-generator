package config

import (
    "context"
    "log"
    "os"
    "time"


    firebase "firebase.google.com/go/v4"
    firebaseApp "firebase.google.com/go/v4/app"
    "google.golang.org/api/option"

    "github.com/spf13/viper"
    "go.uber.org/zap"

    "gorm.io/driver/postgres"
    "gorm.io/gorm"

    "github.com/username/my_api/internal/models"
)

// ---------------------------------------------------------------------------
// Storage Configuration Structs
// ---------------------------------------------------------------------------



type SupabaseConfig struct {
    URL    string
    Token  string
    Bucket string
}


type StorageConfig struct {
    Provider string
    
    Supabase SupabaseConfig
    
}

// StorageRuntime holds the resolved storage config values at runtime.
var StorageRuntime StorageConfig



// InitializeFirebaseApp initializes Firebase application
func InitializeFirebaseApp() (*firebaseApp.App, error) {
    ctx := context.Background()

    opt := option.WithCredentialsFile(viper.GetString("FCM_CREDENTIALS_PATH"))
    c := &firebase.Config{
        ProjectID: viper.GetString("FCM_PROJECT_ID"),
    }

    app, err := firebase.NewApp(ctx, c, opt)
    if err != nil {
        return nil, err
    }

    return app, nil
}


// Global configuration variables
var (

)

// Global service instances
var (

    FCM             *firebaseApp.App

    LOGGER          *zap.Logger

    DB              *gorm.DB
)

// Init initializes all configuration and services
func Init() {
    var err error

    // Initialize logger
    LOGGER, err = zap.NewProduction()
    if err != nil {
        log.Fatal("Failed to initialize logger")
    }
    defer LOGGER.Sync()


    // Initialize Firebase
    FCM, err = InitializeFirebaseApp()
    if err != nil {
        LOGGER.Fatal("Failed to initialize Firebase")
    }


    // Set default configuration values
    setDefaults()

    // Load configuration from file
    viper.SetConfigName("config")
    viper.AddConfigPath(".")
    if err := viper.ReadInConfig(); err != nil {
        LOGGER.Warn("No config file found, using defaults", zap.Error(err))
    }

    // Also read from environment variables (override file)
    viper.AutomaticEnv()

    // Load required environment variables
    loadRequiredConfig()

    // Initialize database
    InitDB()
}

// setDefaults sets default configuration values
func setDefaults() {
    viper.SetDefault("DATABASE_URL", "DATABASE_URL")

    viper.SetDefault("REDIS_ADDR", "localhost:6379")


    viper.SetDefault("SMTP_EMAIL", "SMTP_EMAIL")
    viper.SetDefault("SMTP_EMAIL_PASSWORD", "SMTP_PASSWORD")
    viper.SetDefault("SMTP_HOST", "SMTP_HOST")
    viper.SetDefault("SMTP_PORT", 587)


    viper.SetDefault("CHANGE_THIS_SESSION_SECRET", "SESSION_SECRET_KEY")
    viper.SetDefault("CHANGE_THIS_COOKIES_SECRET", "COKIES_SECRET_KEY")


    viper.SetDefault("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_ID")
    viper.SetDefault("GOOGLE_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET")
    viper.SetDefault("GOOGLE_REDIRECT_URL", "GOOGLE_REDIRECT_URL")


    viper.SetDefault("", "FACEBOOK_APP_ID")
    viper.SetDefault("", "FACEBOOK_APP_SECRET")
    viper.SetDefault("FACEBOOK_REDIRECT_URL", "FACEBOOK_REDIRECT_URL")






    // Storage defaults — override via env vars or config.yaml
    viper.SetDefault("STORAGE_PROVIDER", "local")

    // Local
    
    viper.SetDefault("STORAGE_SUPABASE_URL", "")
    viper.SetDefault("STORAGE_SUPABASE_TOKEN", "")
    viper.SetDefault("STORAGE_SUPABASE_BUCKET_NAME", "storage")
    

    viper.SetDefault("RUN_MIGRATIONS", true)
}

// loadRequiredConfig loads and validates required configuration
func loadRequiredConfig() {


    JwtSecret = viper.GetString("JWT_SECRET")
    if JwtSecret == "" || JwtSecret == "default-secret" {
        log.Fatal("JWT_SECRET not set or using default value")
    }

    AppSecret = viper.GetString("APP_SECRET")
    if AppSecret == "" {
        log.Fatal("APP_SECRET not set")
    }

    AppID = viper.GetString("APP_ID")
    if AppID == "" {
        log.Fatal("APP_ID not set")
    }

    SignSecret = viper.GetString("SIGN_SECRET")
    if SignSecret == "" {
        log.Fatal("SIGN_SECRET not set")
    }





    // Build the global StorageRuntime from viper values.
    StorageRuntime = StorageConfig{
        Provider: viper.GetString("STORAGE_PROVIDER"),
        
        Supabase: SupabaseConfig{   
            URL:    viper.GetString("STORAGE_SUPABASE_URL"),
            Token:  viper.GetString("STORAGE_SUPABASE_TOKEN"),
            Bucket: viper.GetString("STORAGE_SUPABASE_BUCKET_NAME"),
        },
        
    }

}

// InitDB initializes the database connection
func InitDB() {
    var err error

    dsn := viper.GetString("DATABASE_URL")
    if dsn == "" {
        log.Fatal("DATABASE_URL not set")
    }

    // Open database connection
    database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        LOGGER.Fatal("Failed to connect to database")
        os.Exit(2)
    }

    // Configure connection pool
    sqlDB, err := database.DB()
    if err != nil {
        panic("failed to get sql.DB: " + err.Error())
    }

    sqlDB.SetMaxOpenConns(25)
    sqlDB.SetMaxIdleConns(5)
    sqlDB.SetConnMaxLifetime(5 * time.Minute)

    // Run migrations if enabled
    if viper.GetBool("RUN_MIGRATIONS") {
        err = database.AutoMigrate(

            &models.User{},

            &models.Post{},

            &models.Category{},

            &models.Tag{},

            &models.Comment{},

            &models.Media{},

            &models.Product{},


            &models.Conversation{},
            &models.Message{},


            &models.Notification{},


            &models.Role{},
            &models.Permission{},

        )
        if err != nil {
            LOGGER.Warn("Failed to migrate the database")
            panic(err)
        }
    }

    DB = database
    // Storage is initialized separately via storage.Init() in main.go
}