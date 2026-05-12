# Smart Calendar & Task Manager

A beginner-friendly full-stack app for demonstrating CI/CD, Docker, and Prometheus monitoring.

## Tech Stack
- **Frontend:** Next.js (React)
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Monitoring:** Prometheus, Grafana
- **CI/CD:** GitHub Actions
- **Containerization:** Docker, Docker Compose

## Features
- User login/signup (JWT authentication)
- Add, edit, delete events
- Task management dashboard
- Monthly calendar UI
- Dark, modern design
- REST APIs with MongoDB integration
- /metrics endpoint with Prometheus metrics

## Monitoring (Prometheus)
Tracks:
- Total API requests
- Failed requests
- Response time
- Memory usage
- Event creation count

## Grafana
- Dashboards for API traffic and server monitoring

## Docker
- Dockerfiles for frontend & backend
- docker-compose for all services (frontend, backend, MongoDB, Prometheus, Grafana)

## CI/CD (GitHub Actions)
- Runs on push
- Installs dependencies
- Builds app
- Runs tests
- Deploys automatically

## Setup Steps

### 1. Clone the repository
```sh
git clone <repo-url>
cd Devops-Demo
```

### 2. Environment Variables
- Copy `.env.example` to `.env` in both `backend/` and `frontend/` folders and fill in required values.

### 3. Run Locally with Docker Compose
```sh
docker-compose up --build
```
- App: http://localhost:3000
- API: http://localhost:5000
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

### 4. CI/CD
- GitHub Actions workflow runs on every push.

### 5. Monitoring
- Prometheus scrapes `/metrics` from backend.
- Grafana dashboards visualize API/server metrics.

---

## Folder Structure
```
backend/      # Express API, MongoDB models, Prometheus metrics
frontend/     # Next.js app (React), calendar & dashboard UI
monitoring/   # Prometheus & Grafana configs
```

---

## Comments
- Key files are commented for easy understanding.
- Designed for classroom demos and easy explanation.

---

## License
MIT
