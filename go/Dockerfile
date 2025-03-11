FROM golang:1.23-alpine as builder
WORKDIR /app
COPY go.mod .
COPY go.sum .
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o api .
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/api .
EXPOSE 8080
ENTRYPOINT ["./api"]