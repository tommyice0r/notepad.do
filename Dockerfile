# ==============================================================================
# Notepad.do — Unified Full-Stack Dockerfile for Dokploy & Container Hosts
# Builds Public React Frontend + Standalone React Admin Panel + Go Chi Backend
# into a single lean container served on port 8080.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Public React Frontend (/frontend)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_ADSENSE_CLIENT_ID=""
ENV VITE_ADSENSE_CLIENT_ID=$VITE_ADSENSE_CLIENT_ID

RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build Standalone React Admin Panel (/admin)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS admin-builder
WORKDIR /app/admin

COPY admin/package*.json ./
RUN npm ci

COPY admin/ ./

ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Build Go Backend (/backend)
# ------------------------------------------------------------------------------
FROM golang:1.24-alpine AS backend-builder
WORKDIR /app/backend

RUN apk add --no-cache git ca-certificates tzdata

ENV GOTOOLCHAIN=auto
COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o notepad-server .

# ------------------------------------------------------------------------------
# Stage 4: Lean Production Runtime Image
# ------------------------------------------------------------------------------
FROM alpine:3.20
WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata curl

# Copy Go binary
COPY --from=backend-builder /app/backend/notepad-server /app/notepad-server

# Copy compiled public frontend dist and standalone admin dist into container
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist
COPY --from=admin-builder /app/admin/dist /app/admin/dist

# Expose default application port
EXPOSE 8080

# Environment defaults
ENV PORT=8080 \
    STATIC_DIR=/app/frontend/dist \
    ADMIN_DIST=/app/admin/dist

CMD ["/app/notepad-server"]
