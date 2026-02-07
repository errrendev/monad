# Backend Setup Guide

## Prerequisites

You need to install the following services on your Mac:

### 1. MySQL Database
### 2. Redis Server

---

## Step 1: Install MySQL

### Option A: Using Homebrew (Recommended)
```bash
# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Secure your MySQL installation
mysql_secure_installation
```

### Option B: Download MySQL
Download from: https://dev.mysql.com/downloads/mysql/

---

## Step 2: Install Redis

### Using Homebrew (Recommended)
```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

---

## Step 3: Create MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE monopoly_db;

# Exit MySQL
exit;
```

---

## Step 4: Configure Environment Variables

1. Copy the example file:
```bash
cd /Users/manjeetsharma/Desktop/mantle/backend
cp .env.example .env
```

2. Edit `.env` file with your actual values:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=monopoly_db
DB_USER=root
DB_PASSWORD=your_actual_mysql_password

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_TLS=false

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_change_this
```

---

## Step 5: Run Database Migrations

```bash
# Run migrations to create tables
npm run migrate

# (Optional) Seed the database with initial data
npm run seed
```

---

## Step 6: Start the Backend Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

---

## Verification

### Check if services are running:

**MySQL:**
```bash
mysql -u root -p -e "SHOW DATABASES;"
```

**Redis:**
```bash
redis-cli ping
```

**Backend Server:**
Visit: http://localhost:3000/health

Should return:
```json
{
  "status": "OK",
  "timestamp": "2026-02-07T...",
  "environment": "development"
}
```

---

## Troubleshooting

### Redis Connection Error
If you see `ECONNREFUSED` errors:
```bash
# Check if Redis is running
brew services list

# Start Redis if not running
brew services start redis
```

### MySQL Connection Error
```bash
# Check if MySQL is running
brew services list

# Start MySQL if not running
brew services start mysql
```

### Port Already in Use
If port 3000 is already in use, change `PORT` in your `.env` file.

---

## Quick Start Commands

```bash
# 1. Install dependencies (already done)
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env with your values

# 3. Start MySQL and Redis
brew services start mysql
brew services start redis

# 4. Create database
mysql -u root -p -e "CREATE DATABASE monopoly_db;"

# 5. Run migrations
npm run migrate

# 6. Start server
npm start
```
