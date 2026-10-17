# ==============================================================================
# Notepad.do — Unified Full-Stack Dockerfile for Dokploy & Container Hosts
# Builds React frontend and compiles Go Chi backend into a single lean container.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build React Frontend
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

# Allow build-time API URL override if desired (default is relative /api)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build Go Backend
# ------------------------------------------------------------------------------
FROM golang:1.24-alpine AS backend-builder
WORKDIR /app/backend

RUN apk add --no-cache git ca-certificates tzdata

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o notepad-server .

# ------------------------------------------------------------------------------
# Stage 3: Lean Production Runtime Image
# ------------------------------------------------------------------------------
FROM alpine:3.20
WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata curl

# Copy Go binary
COPY --from=backend-builder /app/backend/notepad-server /app/notepad-server

# Copy compiled frontend dist into container
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose default application port
EXPOSE 8080

# Environment defaults
ENV PORT=8080 \
    STATIC_DIR=/app/frontend/dist

CMD ["/app/notepad-server"]
