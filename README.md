# UPI Pay Manager

A full-stack Next.js application for generating Google Pay / UPI custom amount QRs, managing payment links, and verifying transactions.

## Tech Stack
- Frontend & Backend: Next.js 14 (App Router)
- Database: Prisma ORM with SQLite (easy to switch to PostgreSQL)
- Authentication: NextAuth.js
- Styling: Tailwind CSS
- QR & PDF: `qrcode.react`, `jspdf`

## Local Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and fill in the variables.
   ```bash
   cp .env.example .env
   ```

3. **Database Setup**
   Run Prisma migrations to create the database:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Seed Database**
   Creates the default admin user and business profile:
   ```bash
   node prisma/seed.js
   ```

5. **Run Application**
   ```bash
   npm run dev
   ```

6. **Login Credentials**
   - URL: `http://localhost:3000/login`
   - Email: `admin@example.com`
   - Password: `admin123`
    - Finance Email: `finance@axientabusinessconsulting.com`
    - Finance Password: `Axienta@123`

## Deploying to Vercel
1. Push your code to a GitHub repository.
2. In Vercel, import the project.
3. If deploying with a real database (recommended), change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`.
4. Run `npx prisma generate` and `npx prisma migrate deploy` in your build command or Vercel settings.
5. Add `DATABASE_URL` and `NEXTAUTH_SECRET` in Vercel Environment Variables.

## Running with Docker (local)

1. Build and run with Docker Compose (development):
```bash
docker compose up --build
```

2. The app will be available at `http://localhost:3000`. The SQLite database file `dev.db` is mounted into the container root for persistence.

3. For a production-style container, build the image and run it (this uses the built Next.js production artifact):
```bash
docker build -t upi-pay-manager .
docker run -e NEXTAUTH_SECRET=change-me -e DATABASE_URL=file:./dev.db -p 3000:3000 upi-pay-manager
```
