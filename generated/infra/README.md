# 

> Professional Go Fiber backend generated with Go Fiber Generator

## 🚀 Quick Start

```bash
# Install dependencies
go mod tidy

# Run the server
go run cmd/server/main.go

# Or use Make
make run
```

## 📁 Project Structure

```
/

├── cmd/
│   └── server/
│       └── main.go                    # Application entry point

│

├── internal/                          # Private application code
│   ├── config/                        # Configuration
│   ├── models/                        # GORM models
│   ├── repository/                    # Data access layer
│   ├── controller/                    # HTTP handlers
│   ├── middleware/                    # Middleware
│   ├── routes/                        # Route registration
│   ├── response/                      # Response helpers
│   ├── database/                      # Database connection
│   └── pkg/                           # Internal packages


















│

├── pkg/                               # Public packages
│   ├── contexthelpers/                # Fiber context helpers
│   └── utils/                         # Utilities

│
├── config.yaml                        # Runtime configuration
├── .env.example                       # Environment template
├── go.mod                             # Go module
├── go.sum                             # Dependency checksums
├── Makefile                           # Build automation
└── README.md                          # This file
```

## 🎯 Features


- ✅ **JWT Authentication** - Secure token-based authentication


- ✅ **Email/Password Auth** - Traditional authentication


- ✅ **Social Authentication** - Google, Facebook, Apple login


- ✅ **Redis Caching** - High-performance caching


- ✅ **Push Notifications** - Firebase Cloud Messaging


- ✅ **WebSockets** - Real-time communication



- ✅ **Internationalization** - Multi-language support


## 🔧 Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update environment variables in `.env`

3. Update `config.yaml` with your settings

## 📊 Database

### Migrations

Auto-migration is enabled.


Models will be automatically migrated on startup.


### Models


- **User** - users

- **Post** - posts

- **Category** - categories

- **Tag** - tags

- **Comment** - comments

- **Media** - media

- **Product** - products


## 🛣️ API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login


- `POST /api/auth/google` - Google OAuth


- `POST /api/auth/facebook` - Facebook OAuth


### Resources


## 🧪 Testing

```bash
# Run tests
make test

# Run with coverage
make test-coverage
```

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t  .

# Run container
docker run -p 3000:3000 
```

### Docker Compose

```bash
docker-compose up -d
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |

| `JWT_SECRET` | JWT signing secret | Yes |


| `REDIS_HOST` | Redis host | Yes |


| `FCM_CREDENTIALS` | Path to Firebase credentials | Yes |


## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License

---

**Generated with ❤️ by [Go Fiber Generator](https://github.com/username/go-fiber-generator)**
