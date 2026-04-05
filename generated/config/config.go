package config

import (
	"log"
	"os"
	"gopkg.in/yaml.v3"
)

// Config holds the application configuration
type Config struct {
	Server   ServerConfig   `yaml:"server"`
	
	Session  SessionConfig  `yaml:"session"`
	
	
	Redis    RedisConfig    `yaml:"redis"`
	
	
	FCM      FCMConfig      `yaml:"fcm"`
	
	
	Storage  StorageConfig  `yaml:"storage"`
	
	
	GoogleOAuth GoogleOAuthConfig `yaml:"google_oauth"`
	
	
	FacebookOAuth FacebookOAuthConfig `yaml:"facebook_oauth"`
	
	
}

// ServerConfig holds server configuration
type ServerConfig struct {
	
	MaintenanceMode bool   `yaml:"maintenance_mode"`
	MaintenanceEndTime string `yaml:"maintenance_end_time,omitempty"`
	
}






// SessionConfig holds session configuration
type SessionConfig struct {
	SecretKey      string `yaml:"CHANGE_THIS_SESSION_SECRET"`
	CookiesSecret  string `yaml:"COOKIES_SECRET"`
}



// RedisConfig holds Redis configuration
type RedisConfig struct {
	Host     string `yaml:"REDIS_ADDR"`
	Password string `yaml:"REDIS_PASSWORD"`
	DB       int    `yaml:"REDIS_DB"`
	SessionAddr string `yaml:"REDIS_ADDR"`
}




// SMTPConfig holds SMTP configuration
type SMTPConfig struct {
	Host      string `yaml:"SMTP_HOST"`
	Port      int    `yaml:"SMTP_PORT"`
	User      string `yaml:"SMTP_EMAIL"`
	Password  string `yaml:"SMTP_EMAIL_PASSWORD"`
}


// IMAPConfig holds IMAP configuration for fetching emails
type IMAPConfig struct {
	Host              string `yaml:"IMAP_HOST"`
	Port              int    `yaml:"IMAP_PORT"`
	User              string `yaml:"IMAP_EMAIL"`
	Password          string `yaml:"IMAP_PASSWORD"`
}




// FCMConfig holds Firebase Cloud Messaging configuration
type FCMConfig struct {
	FilePath          string `yaml:"FCM_CREDENTIALS_PATH"`
	ProjectID         string `yaml:"FCM_PROJECT_ID"`
	AdminTopic        string `yaml:"admin_default_stogne"`        // optional topic for admins
}



// StorageConfig holds storage configuration
type StorageConfig struct {
    Provider string             `yaml:"provider"` // local, s3, supabase
    
    Supabase SupabaseConfig     `yaml:"supabase"`
    
}

// LocalStorageConfig holds local storage configuration


// S3StorageConfig holds S3 storage configuration


// SupabaseConfig holds Supabase storage configuration

type SupabaseConfig struct {
    URL    string `yaml:"STORAGE_SUPABASE_URL"`
    Token  string `yaml:"STORAGE_SUPABASE_TOKEN"`
    Bucket string `yaml:""`
}




// GoogleOAuthConfig holds Google OAuth configuration
type GoogleOAuthConfig struct {
	ClientID     string `yaml:"GOOGLE_CLIENT_ID"`
	ClientSecret string `yaml:"GOOGLE_CLIENT_SECRET"`
	RedirectURL  string `yaml:"GOOGLE_REDIRECT_URL"`
}



// FacebookOAuthConfig holds Facebook OAuth configuration
type FacebookOAuthConfig struct {
	AppID       string `yaml:""`
	AppSecret   string `yaml:""`
	RedirectURL string `yaml:"FACEBOOK_REDIRECT_URL"`
}





var AppConfig *Config

// LoadConfig loads configuration from YAML file
func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, err
	}

	AppConfig = &config
	log.Println("✅ Configuration loaded successfully from", path)
	return &config, nil
}

// MustLoadConfig loads configuration or panics
func MustLoadConfig(path string) *Config {
	config, err := LoadConfig(path)
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}
	return config
}
