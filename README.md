# Channel Management App

This is a full-stack application built with React, Vite, Express, and PostgreSQL (Drizzle ORM).

## Tech Stack
- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: Express, Node.js
- **Database**: PostgreSQL (managed via Supabase or Cloud SQL)
- **ORM**: Drizzle ORM

## Local Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Copy `.env.example` to `.env` and fill in your Supabase / PostgreSQL database credentials:
   ```env
   SQL_HOST=your-db-host
   SQL_USER=your-db-user
   SQL_PASSWORD=your-db-password
   SQL_DB_NAME=your-db-name
   SQL_ADMIN_USER=your-db-admin-user
   SQL_ADMIN_PASSWORD=your-db-admin-password
   ```

3. **Database Migration**
   To initialize or update your database schema using Drizzle:
   ```bash
   npx drizzle-kit push
   ```

4. **Run Development Server**
   Start the Express server and Vite frontend:
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   npm run start
   ```
