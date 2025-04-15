# Transcendence

## Configuration (`.env`)

Create a `.env` file in the project root to define environment variables.

* **`JWT_SECRET`** (Required): Random secret key for signing JWTs.
  * *Example*: `JWT_SECRET=yourrandomsecrethere`

* **`NGINX_HTTP_PORT`** (Optional): Exposed HTTP port (Default: `80`).
  * *Example*: `NGINX_HTTP_PORT=8080`

* **`NGINX_HTTPS_PORT`** (Optional): Exposed HTTPS port (Default: `443`).
  * *Example*: `NGINX_HTTPS_PORT=4430`

### Minimal `.env` Example

```dotenv
JWT_SECRET=replace_with_a_real_random_secret

# Optional (uncomment if needed):
# NGINX_HTTP_PORT=8080
# NGINX_HTTPS_PORT=4430
```
