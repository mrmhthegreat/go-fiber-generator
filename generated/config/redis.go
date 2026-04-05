package config

import (
    "context"
    "time"

    "github.com/redis/go-redis/v9"
    "github.com/spf13/viper"
    "go.uber.org/zap"
)

// Context for Redis operations
var Ctx = context.Background()

// RedisCache is the Redis client
var RedisCache *redis.Client

// InitRedisCache initializes the Redis connection
func InitRedisCache() {
    redisHost := viper.GetString("REDIS_ADDR")
    if redisHost == "" {
        redisHost = viper.GetString("REDIS_ADDR")
    }
    if redisHost == "" {
        redisHost = "localhost:6379"
    }
    
    redisPassword := viper.GetString("REDIS_PASSWORD")
    if redisPassword == "" {
        redisPassword = viper.GetString("REDIS_PASSWORD")
    }
    redisDB := viper.GetInt("REDIS_DB")
    if redisDB == 0 {
        redisDB = viper.GetInt("REDIS_DB")
    }
    
    RedisCache = redis.NewClient(&redis.Options{
        Addr:     redisHost,
        Password: redisPassword,
        DB:       redisDB,

        MaxRetries: 3,


        PoolSize: 20,


        MinIdleConns: 5,

    })
    
    // Retry mechanism
    maxRetries := 3
    for i := 0; i < maxRetries; i++ {
        _, err := RedisCache.Ping(Ctx).Result()
        if err == nil {
            LOGGER.Info("Redis Cache", zap.String("status", "✅ Redis Cache Connected!"))
            return
        }
        
        LOGGER.Warn("Redis Cache", 
            zap.String("status", "⏳ Redis connection failed"),
            zap.Int("attempt", i+1),
            zap.Int("max_attempts", maxRetries),
        )
        
        time.Sleep(2 * time.Second)
    }
    
    LOGGER.Fatal("Redis Cache", zap.String("error", "❌ Failed to connect to Redis after retries"))
}

// CloseRedisCache closes the Redis connection gracefully
func CloseRedisCache() {
    if RedisCache != nil {
        err := RedisCache.Close()
        if err != nil {
            LOGGER.Error("Redis Cache", zap.String("error", "⚠️ Error closing Redis"), zap.Error(err))
        } else {
            LOGGER.Info("Redis Cache", zap.String("status", "Redis Cache Disconnected"))
        }
    }
}


