.DEFAULT_GOAL := help

# Compose files
COMPOSE_BASE = docker-compose.yml
COMPOSE_DEV = docker-compose.dev.yml
COMPOSE_PROD = docker-compose.prod.yml
COMPOSE_FILES_DEV = -f $(COMPOSE_BASE) -f $(COMPOSE_DEV)
COMPOSE_FILES_PROD = -f $(COMPOSE_BASE) -f $(COMPOSE_PROD)

# Commands
DOCKER_COMPOSE_DEV = COMPOSE_BAKE=true docker compose $(COMPOSE_FILES_DEV)
DOCKER_COMPOSE_PROD = COMPOSE_BAKE=true docker compose $(COMPOSE_FILES_PROD)

help: ## Display this help screen
		@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Generate self-signed certs
		@if [ ! -f nginx/ssl/nginx-selfsigned.key ] || [ ! -f nginx/ssl/nginx-selfsigned.crt ]; then \
				echo "Generating self-signed certificate for development..."; \
				mkdir -p nginx/ssl; \
				openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
						-keyout nginx/ssl/nginx-selfsigned.key \
						-out nginx/ssl/nginx-selfsigned.crt \
						-subj "/C=XX/ST=State/L=City/O=Development/CN=localhost"; \
		else \
				echo "Self-signed certificate already exists."; \
		fi
		@echo "Setup complete."

up: setup ## Start development environment (build if needed)
		$(DOCKER_COMPOSE_DEV) up --build --remove-orphans

stop: ## Stop development environment
		$(DOCKER_COMPOSE_DEV) stop

down: ## Stop and remove development containers, networks
		$(DOCKER_COMPOSE_DEV) down --remove-orphans

logs: ## View logs for development environment
		$(DOCKER_COMPOSE_DEV) logs -f


# --- Production Commands ---

prod-build: ## Build production images
		$(DOCKER_COMPOSE_PROD) build

prod-up: prod-build ## Start production environment in detached mode
		@echo "Starting Production Environment..."
		@echo "Ensure your .env file and nginx/ssl certificates are configured for production!"
		$(DOCKER_COMPOSE_PROD) up -d --remove-orphans

prod-stop: ## Stop production environment
		$(DOCKER_COMPOSE_PROD) stop

prod-down: ## Stop and remove production containers, networks, volumes
		$(DOCKER_COMPOSE_PROD) down -v --remove-orphans

prod-logs: ## View logs for production environment
		$(DOCKER_COMPOSE_PROD) logs -f


# --- Utility Commands ---

clean: ## Stop and remove ALL containers, networks, volumes, and prune system
		@echo "WARNING: This will remove all containers, networks, volumes!"
		@read -p "Are you sure? (y/N) " -r; \
		if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
				$(DOCKER_COMPOSE_DEV) down -v --remove-orphans; \
				$(DOCKER_COMPOSE_PROD) down -v --remove-orphans; \
				docker system prune -af --volumes; \
		else \
				echo "Clean cancelled."; \
		fi

sh-backend: ## Open a shell in the running backend container (dev)
		$(DOCKER_COMPOSE_DEV) exec backend sh

sh-frontend: ## Open a shell in the running frontend container (dev)
		$(DOCKER_COMPOSE_DEV) exec frontend sh

sh-nginx: ## Open a shell in the running nginx container (dev)
		$(DOCKER_COMPOSE_DEV) exec nginx sh

.PHONY: help setup up start stop down logs logs-nginx logs-backend logs-frontend prod-build prod-up prod-stop prod-down prod-logs build rebuild clean sh-backend sh-frontend sh-nginx
