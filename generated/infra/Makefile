.PHONY: help build run test clean docker

# Variables
APP_NAME=

MAIN_PATH=./cmd/server

BINARY_NAME=
DOCKER_IMAGE=:latest

# Default target
help:
	@echo "Available targets:"
	@echo "  build         - Build the application"
	@echo "  run           - Run the application"
	@echo "  test          - Run tests"
	@echo "  test-coverage - Run tests with coverage"
	@echo "  clean         - Clean build artifacts"
	@echo "  docker-build  - Build Docker image"
	@echo "  docker-run    - Run Docker container"
	@echo "  tidy          - Run go mod tidy"
	@echo "  fmt           - Format code"
	@echo "  lint          - Run linter"

# Build the application
build:
	@echo "Building $(APP_NAME)..."
	go build -o $(BINARY_NAME) $(MAIN_PATH)

# Run the application
run:
	@echo "Running $(APP_NAME)..."
	go run $(MAIN_PATH)/main.go

# Run tests
test:
	@echo "Running tests..."
	go test -v ./...

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Clean build artifacts
clean:
	@echo "Cleaning..."
	rm -f $(BINARY_NAME)
	rm -f coverage.out coverage.html

# Build Docker image
docker-build:
	@echo "Building Docker image..."
	docker build -t $(DOCKER_IMAGE) .

# Run Docker container
docker-run:
	@echo "Running Docker container..."
	docker run -p 3000:3000 --env-file .env $(DOCKER_IMAGE)

# Run go mod tidy
tidy:
	@echo "Running go mod tidy..."
	go mod tidy

# Format code
fmt:
	@echo "Formatting code..."
	go fmt ./...

# Run linter
lint:
	@echo "Running linter..."
	golangci-lint run

# Development mode with hot reload (requires air)
dev:
	@echo "Starting development mode..."
	air

# Database migrations

migrate:
	@echo "Running migrations..."
	go run $(MAIN_PATH)/main.go migrate

