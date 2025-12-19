# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy go mod and sum files from the backend directory
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy the entire backend source
COPY backend/ ./

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main cmd/api/main.go

# Run stage
FROM alpine:latest

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/main .
# Copy .env if needed (though usually passed via docker-compose)
COPY backend/.env.example .env

EXPOSE 8080

CMD ["./main"]
