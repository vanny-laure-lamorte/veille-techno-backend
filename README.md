# Backend Technology Watch — Kanban Board API

Kanban board management API built with NestJS as part of the Master 1 Development program at La Plateforme.

## Table of Contents

- [Technologies](#technologies)
- [Versions and Maintenance](#versions-maintenance)
- [Prerequisites](#prerequisites)
- [Installation and Configuration](#installation-and-configuration)
- [Run Locally](#run-locally)
- [Run with Docker](#run-with-docker)
- [API and Authentication](#api-and-authentication)
- [Available Routes](#available-routes)
- [Swagger Documentation](#swagger-documentation)
- [Tests and Code Quality](#tests-and-code-quality)
- [Developer CLI](#developer-cli)
- [Project Structure](#project-structure)

## Technologies

- **NestJS** for the API
- **PostgreSQL** and **TypeORM** for data persistence
- **Passport JWT** and **bcrypt** for authentication
- **class-validator** and **class-transformer** for DTO validation and transformation
- **Swagger** for API exploration
- **Jest** and **Supertest** for testing
- **Docker Compose** to run the API and PostgreSQL

## Versions and Maintenance

Versions below are the versions currently installed in the project workspace, resolved from `package-lock.json`, plus the runtime versions used by the local environment and deployment configuration.

| Component | Project version | Where it comes from | Maintenance note |
| --- | --- | --- | --- |
| Node.js (local workspace) | `25.3.0` | Local development environment | Odd-numbered Current release; now EOL. Use Node.js 24 LTS for development. |
| Node.js (Docker and CI) | `24` | Dockerfile and GitHub Actions | Supported LTS line; keep local, CI, and Docker on the same major. |
| npm (local workspace) | `11.15.0` | Bundled with local Node.js | Use `npm ci` in CI to install exactly the lockfile versions. |
| NestJS | `12.0.4` (`@nestjs/core`, `common`, `platform-express`) | Runtime dependencies | Keep NestJS packages on matching majors and update compatible patches together. |
| NestJS CLI | `12.0.3` | Development dependency | Keep the CLI major aligned with the NestJS application. |
| Express | `5.2.1` | Transitive dependency of `@nestjs/platform-express` | Update through the Nest platform adapter; avoid introducing a second Express version. |
| TypeScript | `6.0.3` | Development dependency | Check NestJS, SWC, and type-definition compatibility before major upgrades. |
| TypeORM | `1.1.1` | Runtime dependency | Review migrations and schema behavior when upgrading. |
| PostgreSQL | `16` (`16-alpine`) | Docker Compose and CI service | Back up data and test migrations before a database major upgrade. |
| Jest | `30.5.2` | Development dependency | Run unit and end-to-end suites after upgrades. |
| Oxlint | `1.85.0` | Development dependency | CI runs `npm run lint`. |
| Prettier | `3.9.8` | Development dependency | Verify formatting after upgrades. |
| Docker Compose | Host-provided Compose plugin | Local/CI container orchestration | Keep Docker Engine and the Compose plugin updated. |

Other installed top-level packages:

| Group | Installed versions |
| --- | --- |
| NestJS adapters and helpers | `@nestjs/config` `12.0.0`, `@nestjs/jwt` `12.0.2`, `@nestjs/mapped-types` `12.0.0`, `@nestjs/passport` `12.0.0`, `@nestjs/swagger` `12.0.1`, `@nestjs/typeorm` `12.0.1`, `@nestjs/schematics` `12.0.0`, `@nestjs/testing` `12.0.4`, `@nestjs/mau` `0.2.8` |
| Runtime libraries | `pg` `8.23.0`, `bcrypt` `6.0.0`, `passport` `0.7.0`, `passport-jwt` `4.0.1`, `class-validator` `0.15.1`, `class-transformer` `0.5.1`, `joi` `18.2.9`, `reflect-metadata` `0.2.2`, `rxjs` `7.8.2`, `source-map-support` `0.5.21` |
| Build, test, and type tooling | `@swc/core` `1.16.12`, `@swc/jest` `0.2.39`, `supertest` `7.2.2`, `ts-loader` `9.6.2`, `ts-node` `10.9.2`, `tsconfig-paths` `4.2.0`, `@types/bcrypt` `6.0.0`, `@types/express` `5.0.6`, `@types/jest` `30.0.0`, `@types/node` `24.13.6`, `@types/passport-jwt` `4.0.1`, `@types/supertest` `7.2.1` |

Check dependency updates with `npm outdated`, then review and test them before committing the lockfile. Check the [Node.js release schedule](https://nodejs.org/en/about/previous-releases) before changing the runtime major. As of September 2026, Node.js 20 and 22 are EOL, Node.js 25 is EOL, and Node.js 24 is the supported LTS choice for this project; Node.js 26 is still Current.

## Prerequisites

- Node.js 24+
- PostgreSQL when running the application without Docker, or Docker with Docker Compose

Check the installed versions:

```bash
node --version
npm --version
```

## Installation and Configuration

Install dependencies:

```bash
npm install
```

Create a local `.env` file from the example:

```powershell
Copy-Item .env.example .env
```

Configure the following variables. The application uses `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `PASSWORD_PEPPER`. The `DB_*` variables are also used to provide PostgreSQL credentials to Docker Compose.

| Variable | Purpose | Local example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL; required at startup | `postgresql://postgres:password@localhost:5432/veille_techno` |
| `JWT_SECRET` | Secret used to sign JWTs | Generate a long random value |
| `JWT_EXPIRES_IN` | JWT lifetime, in a format supported by `ms` | `1h` |
| `PASSWORD_PEPPER` | Secret appended to passwords during registration and login | A randomly generated secret |
| `DB_HOST` | PostgreSQL host used by Docker Compose | `postgres` on the Docker network |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | A secret value |
| `DB_DATABASE` | Database name | `veille_techno` |
| `ADMIN_EMAIL` | Email for the initial administrator account; optional | `admin@example.com` |
| `ADMIN_PASSWORD` | Password for the initial administrator account; optional | Set locally |

Generate a random JWT secret or password pepper with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

The application explicitly validates that `DATABASE_URL` is set at startup. The JWT module also requires `JWT_SECRET` and `JWT_EXPIRES_IN`; registration and login require `PASSWORD_PEPPER`. If both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set, an administrator account is created or updated at startup. Never commit files containing secrets.

## Run Locally

Start the API in development mode:

```bash
npm run start:dev
```

The application listens on port `3000` by default. Override it with `PORT`.

Build and start the compiled application:

```bash
npm run build
npm run start:prod
```

## Run with Docker

Docker Compose starts the API and PostgreSQL. At the repository root, `.env` supplies `DB_USERNAME`, `DB_PASSWORD`, and `DB_DATABASE` to configure the PostgreSQL container. The API container loads its variables from `.env.docker`; create this local file with at least `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `PASSWORD_PEPPER`. The database host in `DATABASE_URL` must be `postgres`, for example:

```dotenv
DATABASE_URL=postgresql://postgres:password@postgres:5432/veille_techno
```

Start the services:

```bash
docker compose up --build -d
```

View the logs or stop the containers:

```bash
docker compose logs -f app
docker compose down
```

## API and Authentication

API routes are served at the root (`/auth`, `/users`, `/lists`, `/cards`). `/api` hosts the Swagger UI.

- Registration requires an email address, a name, and a password of at least 8 characters.
- Login returns an `accessToken` JWT. Send it in the `Authorization: Bearer <token>` header when calling protected routes.
- Lists and cards require a JWT and are restricted to the owner of the list.
- Updating a user requires a JWT. A user can update their own profile; an administrator can update other profiles. Only administrators can change a user's role.
- DTOs are validated globally: unknown properties are rejected and supported types may be transformed.
- User IDs must be UUIDs. Business errors use NestJS HTTP status codes, including `401` (unauthenticated), `403` (forbidden), `404` (not found), and `409` (email conflict).

## Available Routes

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register an account (`email`, `name`, `password`) |
| `POST` | `/auth/login` | Public | Log in and receive a JWT |
| `POST` | `/users` | Public | Create a user |
| `GET` | `/users` | Public | List users |
| `GET` | `/users/{id}` | Public | Retrieve a user |
| `PATCH` | `/users/{id}` | JWT | Update your profile or, as an admin, another profile |
| `DELETE` | `/users/{id}` | Public | Delete a user |
| `GET` | `/lists` | JWT | List your lists |
| `POST` | `/lists` | JWT | Create a list (`title`, optional `position`) |
| `PATCH` | `/lists/{id}` | List owner JWT | Update a list |
| `DELETE` | `/lists/{id}` | List owner JWT | Delete a list |
| `GET` | `/lists/{listId}/cards` | List owner JWT | List cards in a list |
| `POST` | `/lists/{listId}/cards` | List owner JWT | Create a card (`title`, optional `description` and `position`) |
| `GET` | `/cards/{id}` | List owner JWT | Retrieve a card |
| `PATCH` | `/cards/{id}` | List owner JWT | Update a card, including moving it with `listId` |
| `DELETE` | `/cards/{id}` | List owner JWT | Delete a card (`204 No Content`) |

## Swagger Documentation

Start the application and open:

```text
http://localhost:3000/api
```

In Swagger, call `POST /auth/register`, then `POST /auth/login`. Copy the `accessToken`, select **Authorize**, and enter the token to try protected routes.

## Tests and Code Quality

Available npm commands:

```bash
npm run test       # Unit tests
npm run test:e2e   # End-to-end tests
npm run test:cov   # Tests with coverage
npm run lint       # Static analysis with oxlint
npm run build      # NestJS build
```

## Developer CLI

A PowerShell shortcut script is available at `scripts/vtb.ps1`. Run it from the repository root:

```powershell
.\scripts\vtb.ps1 dev
```

Supported commands: `node version`, `npm version`, `docker version`, `docker up`, `docker down`, `docker ps`, `docker logs`, `dev`, `start:dev`, `build`, `test`, and `test coverage`. For example:

```powershell
.\scripts\vtb.ps1 test coverage
```

### Available Commands

| Category    | Command              | Description                                         |
| ----------- | -------------------- | --------------------------------------------------- |
| **Node.js** | `vtb node version`   | Display the installed Node.js version               |
| **npm**     | `vtb npm version`    | Display the installed npm version                   |
| **Docker**  | `vtb docker version` | Display the installed Docker version                |
| **Docker**  | `vtb docker up`      | Start Docker services in detached mode              |
| **Docker**  | `vtb docker down`    | Stop and remove Docker containers                   |
| **Docker**  | `vtb docker ps`      | Display the status of Docker containers             |
| **Docker**  | `vtb docker logs`    | Display Docker service logs in real time            |
| **NestJS**  | `vtb dev`            | Start the NestJS development server with hot reload |
| **NestJS**  | `vtb start:dev`      | Alias for `vtb dev`                                 |
| **NestJS**  | `vtb build`          | Build the NestJS application                        |
| **Tests**   | `vtb test`           | Run the project test suite                          |

## Project Structure


```text
src/
├── auth/       # Registration, login, JWT, and authentication guard
├── cards/      # Card routes, service, DTOs, and entity
├── common/     # Shared types, including the authenticated request
├── lists/      # List routes, service, DTOs, and entity
├── user/       # User accounts, roles, DTOs, and entity
├── app.module.ts
└── main.ts     # Bootstrap, global validation, and Swagger configuration
scripts/
└── vtb.ps1     # PowerShell developer CLI
test/           # End-to-end tests

```