# Running the Application with Docker

This application consists of a React frontend, Node.js backend, and PostgreSQL database, all containerized with Docker for easy setup and deployment.

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) installed on your computer
- For Windows: Docker Desktop with WSL 2 backend

## Setup Instructions

1. Clone or extract this repository to your local machine
2. Open a terminal or command prompt in the root directory of the project

## Running the Application

### Start all services

```bash
docker compose up -d
```

This command builds and starts all the services defined in the docker-compose.yml file in detached mode.

### View logs

To see the logs from all containers:

```bash
docker compose logs -f
```

To see logs from a specific service:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### Stop the application

```bash
docker compose down
```

To stop and remove all containers, networks, and volumes:

```bash
docker compose down -v
```

## Accessing the Application

- Frontend: http://localhost
- Backend API: http://localhost:5000
  - Example endpoint: http://localhost:5000/api/notifications

## Troubleshooting

### Container not starting

Check the logs for errors:

```bash
docker compose logs <service-name>
```

### Database initialization issues

If the database doesn't initialize properly:

```bash
docker compose down -v
docker compose up -d
```

### Rebuilding containers after code changes

```bash
docker compose build
docker compose up -d
```

## Container Management

### List running containers

```bash
docker ps
```

### Enter a container shell

```bash
docker exec -it iaib-backend sh
docker exec -it iaib-frontend sh
docker exec -it iaib-postgres bash
```

## Data Persistence

The PostgreSQL data is stored in a named volume `postgres-data` which persists across container restarts. To completely reset the database, you need to remove this volume:

```bash
docker compose down -v
``` 