# Stage 1: Build Go binary
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install ca-certificates and tzdata
RUN apk add --no-cache git ca-certificates tzdata

# Cache Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy backend source code
COPY . .

# Build statically-linked optimized binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o notepad-server .

# Stage 2: Minimal Production Image
FROM alpine:3.20

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata curl

# Copy binary from builder
COPY --from=builder /app/notepad-server /app/notepad-server

# Expose default port
EXPOSE 8080

ENV PORT=8080

CMD ["/app/notepad-server"]
