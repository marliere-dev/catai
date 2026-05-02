# syntax=docker/dockerfile:1.7

# ---- Stage 1: build ----
FROM golang:1.26-alpine AS builder

WORKDIR /src

COPY go.mod ./
RUN go mod download

COPY . .

ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
RUN go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /out/collector \
    .

# ---- Stage 2: runtime ----
FROM gcr.io/distroless/static-debian12:nonroot AS runtime

WORKDIR /app

COPY --from=builder /out/collector /app/collector

EXPOSE 8081

ENTRYPOINT ["/app/collector"]
