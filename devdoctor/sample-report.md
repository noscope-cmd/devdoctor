# DevDoctor Report

> Generated 2026-06-30T09:15:19.458Z · DevDoctor v1.0.0

**Platform:** Linux (x64)

## Health Score: 55% — Fair

`███████████░░░░░░░░░` 55%

- ✅ 5 passed
- ⚠️ 1 warnings
- ❌ 4 critical issues
- ➖ 18 skipped

## Version Control

| Status | Tool | Result | Version |
| :----: | ---- | ------ | ------- |
| ⚠️ | Git | Installed (identity not configured) | 2.47.3 |

## Languages & Runtimes

| Status | Tool | Result | Version |
| :----: | ---- | ------ | ------- |
| ❌ | Go | Not installed |  |
| ✅ | Java (JDK) | v18.9 | 18.9 |
| ✅ | Node.js | v20.20.2 | 20.20.2 |
| ✅ | Python | v3.13.13 | 3.13.13 |
| ❌ | Rust (rustc) | Not installed |  |

## Package Managers

| Status | Tool | Result | Version |
| :----: | ---- | ------ | ------- |
| ➖ | Bun | Not installed (optional) |  |
| ❌ | Cargo | Not installed |  |
| ➖ | Gradle | Not installed (optional) |  |
| ➖ | Maven | Not installed (optional) |  |
| ✅ | npm | v10.8.2 | 10.8.2 |
| ✅ | pip | v26.0.1 | 26.0.1 |
| ➖ | pnpm | Not installed (optional) |  |
| ➖ | Poetry | Not installed (optional) |  |
| ➖ | uv | Not installed (optional) |  |
| ➖ | Yarn | Not installed (optional) |  |

## Containers

| Status | Tool | Result | Version |
| :----: | ---- | ------ | ------- |
| ❌ | Docker | Not installed |  |
| ➖ | Docker Compose | Not installed (optional) |  |

## Cloud & Infrastructure

| Status | Tool | Result | Version |
| :----: | ---- | ------ | ------- |
| ➖ | AWS CLI | Not installed (optional) |  |
| ➖ | Azure CLI | Not installed (optional) |  |
| ➖ | Google Cloud CLI | Not installed (optional) |  |
| ➖ | Kubernetes (kubectl) | Not installed (optional) |  |
| ➖ | Terraform | Not installed (optional) |  |

## Databases

| Status | Tool | Result | Version |
| :----: | ---- | ------ | ------- |
| ➖ | MongoDB (mongosh) | Not installed (optional) |  |
| ➖ | MySQL | Not installed (optional) |  |
| ➖ | PostgreSQL (psql) | Not installed (optional) |  |
| ➖ | Redis (redis-cli) | Not installed (optional) |  |
| ➖ | SQLite | Not installed (optional) |  |

## Suggested Fixes

### ⚠️ Git
Git is installed but user.name/user.email are not fully set.
- Set your global Git author name
  ```sh
  git config --global user.name "Your Name"
  ```
- Set your global Git email
  ```sh
  git config --global user.email "you@example.com"
  ```

### ❌ Go
`go` was not found on your PATH.
- Install Go
  ```sh
  brew install go
  ```
  - Docs: https://go.dev/dl/

### ❌ Rust (rustc)
`rustc` was not found on your PATH.
- Install Rust via rustup
  ```sh
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```
  - Docs: https://rustup.rs/

### ➖ Bun
`bun` was not found on your PATH.
- Install Bun
  ```sh
  curl -fsSL https://bun.sh/install | bash
  ```
  - Docs: https://bun.sh/

### ❌ Cargo
`cargo` was not found on your PATH.
- Cargo ships with rustup
  ```sh
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```
  - Docs: https://rustup.rs/

### ➖ Gradle
`gradle` was not found on your PATH.
- Install Gradle
  ```sh
  brew install gradle
  ```
  - Docs: https://gradle.org/install/

### ➖ Maven
`mvn` was not found on your PATH.
- Install Maven
  ```sh
  brew install maven
  ```
  - Docs: https://maven.apache.org/

### ➖ pnpm
`pnpm` was not found on your PATH.
- Install pnpm
  ```sh
  corepack enable pnpm  # or: npm i -g pnpm
  ```
  - Docs: https://pnpm.io/installation

### ➖ Poetry
`poetry` was not found on your PATH.
- Install Poetry
  ```sh
  curl -sSL https://install.python-poetry.org | python3 -
  ```
  - Docs: https://python-poetry.org/

### ➖ uv
`uv` was not found on your PATH.
- Install uv
  ```sh
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
  - Docs: https://docs.astral.sh/uv/

### ➖ Yarn
`yarn` was not found on your PATH.
- Install Yarn
  ```sh
  corepack enable  # or: npm i -g yarn
  ```
  - Docs: https://yarnpkg.com/getting-started/install

### ❌ Docker
`docker` was not found on your PATH.
- Install Docker
  ```sh
  brew install --cask docker
  ```
  - Docs: https://docs.docker.com/get-docker/

### ➖ Docker Compose
`docker` was not found on your PATH.
- Docker Compose ships with modern Docker Desktop / engine
  - Docs: https://docs.docker.com/compose/install/

### ➖ AWS CLI
`aws` was not found on your PATH.
- Install the AWS CLI
  ```sh
  brew install awscli
  ```
  - Docs: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

### ➖ Azure CLI
`az` was not found on your PATH.
- Install the Azure CLI
  ```sh
  brew install azure-cli
  ```
  - Docs: https://learn.microsoft.com/cli/azure/install-azure-cli

### ➖ Google Cloud CLI
`gcloud` was not found on your PATH.
- Install the Google Cloud CLI
  ```sh
  brew install --cask google-cloud-sdk
  ```
  - Docs: https://cloud.google.com/sdk/docs/install

### ➖ Kubernetes (kubectl)
`kubectl` was not found on your PATH.
- Install kubectl
  ```sh
  brew install kubectl
  ```
  - Docs: https://kubernetes.io/docs/tasks/tools/

### ➖ Terraform
`terraform` was not found on your PATH.
- Install Terraform
  ```sh
  brew install terraform
  ```
  - Docs: https://developer.hashicorp.com/terraform/install

### ➖ MongoDB (mongosh)
`mongosh` was not found on your PATH.
- Install the MongoDB Shell
  ```sh
  brew install mongosh
  ```
  - Docs: https://www.mongodb.com/try/download/shell

### ➖ MySQL
`mysql` was not found on your PATH.
- Install MySQL client
  ```sh
  brew install mysql-client
  ```
  - Docs: https://dev.mysql.com/downloads/

### ➖ PostgreSQL (psql)
`psql` was not found on your PATH.
- Install PostgreSQL client
  ```sh
  brew install libpq  # or postgresql
  ```
  - Docs: https://www.postgresql.org/download/

### ➖ Redis (redis-cli)
`redis-cli` was not found on your PATH.
- Install Redis
  ```sh
  brew install redis
  ```
  - Docs: https://redis.io/download/

### ➖ SQLite
`sqlite3` was not found on your PATH.
- Install SQLite
  ```sh
  brew install sqlite
  ```
  - Docs: https://www.sqlite.org/download.html
