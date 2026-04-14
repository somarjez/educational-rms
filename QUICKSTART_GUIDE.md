# QUICKSTART GUIDE

## Prerequisites

- Git
- Python 3.10+ (3.11 recommended)
- Node.js 18+ and npm

## Clone the Repository

```bash
git clone <YOUR_REPO_URL>
cd educational-rms
```

## Backend Setup (Local)

```bash
cd backend

# Create backend-local virtual environment (one time)
python -m venv .venv

# Activate (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Install dependencies
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# Apply migrations
.\.venv\Scripts\python.exe manage.py migrate

# Create admin user (first time only)
.\.venv\Scripts\python.exe manage.py createsuperuser

# Run server
.\.venv\Scripts\python.exe manage.py runserver
```

### Use Neon Database Locally (Optional)

By default, local backend uses SQLite if `DATABASE_URL` is not set.

1. Create environment file from template:

  ```bash
  cd backend
  copy .env.example .env
  ```

2. Edit `backend/.env` and set your Neon connection string:

  ```env
  DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
  DEBUG=True
  ALLOWED_HOSTS=localhost,127.0.0.1
  CORS_ALLOWED_ORIGINS=http://localhost:5173
  ```

  If your deployed app uses Render Postgres, use the **External Database URL** from the Render dashboard for local development. The internal Render database URL works only inside Render services.

3. Restart backend from the same folder:

  ```bash
  .\.venv\Scripts\python.exe manage.py migrate
  .\.venv\Scripts\python.exe manage.py runserver
  ```

4. Verify active database:

  ```bash
  .\.venv\Scripts\python.exe manage.py shell -c "from django.conf import settings; print(settings.DATABASES['default']['ENGINE']); print(settings.DATABASES['default']['NAME'])"
  ```

  - Neon/Postgres should show: `django.db.backends.postgresql`
  - SQLite fallback shows: `django.db.backends.sqlite3`

### Environment Rule (Important)

Use only `backend/.venv` for Django commands in this repo.

- Good: `backend/.venv/Scripts/python.exe manage.py runserver`
- Avoid: running `python manage.py ...` from a different activated venv

If you accidentally activate another venv, run with the explicit backend interpreter path instead.

**Backend URL**: http://localhost:8000
**Admin panel**: http://localhost:8000/admin

## Frontend Setup (Local)

```bash
cd frontend

# Install packages (first time only)
npm install

# Run dev server
npm run dev
```

**Frontend URL**: http://localhost:5173

## Run on Another Device (LAN)

Use this when the frontend runs on a different device than the backend.

1. Start the backend on all interfaces:

   ```bash
   cd backend
  .\.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
   ```

2. Update backend settings (in `.env` if used):

   ```
   ALLOWED_HOSTS=localhost,127.0.0.1,<YOUR_PC_IP>
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://<YOUR_PC_IP>:5173
   ```

3. Point the frontend to the backend IP:
   - Create `frontend/.env.local` with:
     ```
     VITE_API_URL=http://<YOUR_PC_IP>:8000/api/v1
     ```

4. Start the frontend on all interfaces:

   ```bash
   cd frontend
   npm run dev -- --host 0.0.0.0
   ```

5. Access from another device:
   - Frontend: http://<YOUR_PC_IP>:5173
   - Backend: http://<YOUR_PC_IP>:8000

## Test the Login System

1. Go to http://localhost:5173
2. Click "Register here"
3. Fill in form with:
   - Username: testuser
   - Email: test@example.com
   - Password: Password123 (8+ chars)
   - Role: Select any role
4. Click Register
5. You should be redirected to dashboard

## Useful Commands

### Backend

```bash
# Create migrations
.\.venv\Scripts\python.exe manage.py makemigrations

# Apply migrations
.\.venv\Scripts\python.exe manage.py migrate

# Create superuser
.\.venv\Scripts\python.exe manage.py createsuperuser

# Run Django shell
.\.venv\Scripts\python.exe manage.py shell

# Collect static files
.\.venv\Scripts\python.exe manage.py collectstatic

# Run tests
.\.venv\Scripts\python.exe manage.py test

# Reset database (SQLite only)
del db.sqlite3
.\.venv\Scripts\python.exe manage.py migrate
```

### Frontend

```bash
# Install packages
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## API Testing with cURL

### Register User

```bash
curl -X POST http://localhost:8000/api/v1/auth/users/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123",
    "password_confirm": "SecurePass123",
    "first_name": "Test",
    "last_name": "User",
    "role": "student"
  }'
```

### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

### Get Current User

```bash
curl -X GET http://localhost:8000/api/v1/auth/users/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## File Structure to Remember

```
Backend Models: backend/apps/{app_name}/models.py
Backend Views: backend/apps/{app_name}/views.py
Backend Serializers: backend/apps/{app_name}/serializers.py

Frontend Components: frontend/src/features/{feature_name}/components/
Frontend Hooks: frontend/src/hooks/
Frontend Services: frontend/src/services/
Frontend Stores: frontend/src/stores/
```

## Authentication Flow

1. **Register**: User provides email, password, role
2. **Backend**: Creates user, returns JWT tokens
3. **Frontend**: Stores tokens in localStorage
4. **API Calls**: Tokens sent in Authorization header
5. **Token Refresh**: Auto-refresh when token expires

---

**Questions?** Check SETUP_GUIDE.md for detailed instructions.
