# MoneyKeeper 💰

A full-stack personal finance and expense tracking application designed to help users manage their wallets, budgets, categories, and transactions effortlessly.

## 🏗️ Architecture Stack

- **Frontend:** React 19, Vite, Material UI (MUI), `@dnd-kit`
- **Backend:** NestJS, Prisma ORM
- **Database:** PostgreSQL
- **Authentication:** Firebase Auth (Client + Admin SDK)
- **Deployment:** Docker & Docker Compose (with Nginx proxy)

## 📂 Project Structure

This is a monorepo containing both the client and the server logic:
- `/moneykeeper-client`: The Vite-based React frontend.
- `/moneykeeper-server`: The NestJS API backend.

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Yarn](https://yarnpkg.com/)
- PostgreSQL (or run via Docker)
- A Firebase Project (for Auth credentials)

### 2. Environment Variables
Create a `.env` file at the **root** of the project based on the `.env.example` template:
```bash
cp .env.example .env
```
Make sure to fill out the Firebase credentials and your Local PostgreSQL `DATABASE_URL`.

### 3. Setup Backend
```bash
cd moneykeeper-server
yarn install
npx prisma generate
npx prisma db push  # Push schema to your local DB
yarn start:dev
```
The API will run on `http://localhost:3000`.

### 4. Setup Frontend
Ensure the server is running first.
```bash
cd moneykeeper-client
yarn install
yarn dev
```
The client will run on `http://localhost:5173`. Any requests starting with `/api` are automatically proxied to the NestJS server.

---

## 🐳 Docker Deployment (Production)

To run both the server, frontend, and an Nginx reverse proxy via Docker:

1. Copy `.env.example` to `.env` and fill in your production values. 
   *(Note: Set `VITE_API_URL=""` for seamless relative path proxying via Nginx)*.
2. Build and start the containers:
   ```bash
   docker compose up -d --build
   ```

### Architecture in Docker
- **Server Container:** Runs the compiled NestJS API on port 3000 (internal). Ensures the latest Prisma Schema is pushed to the database on boot.
- **Nginx Container:** Multi-stage build that compiles the React client inside the container, serves the static files to the public, and securely proxies `/api/*` to the Node.js backend container.

---

## ✨ Key Features
- **Wallets:** Create, edit, delete, and drag-and-drop sort custom wallets.
- **Categories:** Organize spending. Automatically seeds 10 default expense/income categories for new users.
- **Transactions:** Log expenses, income, transfers. Real-time balance updates.
- **Budgets:** Set limits, track expenses against budget caps, and dynamically reorder.
- **Secure:** Firebase Bearer token verification handled automatically in the NestJS Guard.

## 📄 License
This project is open-source.
