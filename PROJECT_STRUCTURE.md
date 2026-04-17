# Project Structure & Development Guide

## Top-Level Layout

```
educational-rms/
├── backend/                     # Django API and business logic
├── frontend/                    # React + Vite client
├── README.md                    # Main documentation index
├── QUICKSTART_GUIDE.md          # Fast setup for new devices
├── SETUP_GUIDE.md               # Detailed setup guide
├── ARCHITECTURE.md              # System diagrams and design notes
├── BUILD_SUMMARY.md             # Feature status and roadmap
├── WORKFLOW.md                  # Git workflow and commit conventions
├── render.yaml                  # Backend deploy config
├── vercel.json                  # Frontend deploy config
├── start_backend.bat            # Windows backend helper
└── test_*.py                    # Root-level integration tests
```

## Frontend (`frontend/`)
```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Admin/
│   │   ├── Bookings/
│   │   ├── Dashboard/
│   │   ├── Layout/
│   │   ├── Profile/
│   │   ├── Sidebar/
│   │   ├── Simulation/
│   │   └── Skeleton/
│   ├── features/
│   │   └── auth/
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useEquipmentConfig.js
│   ├── pages/
│   │   └── Features/
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   └── ProtectedRoute.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── authApi.js
│   │   ├── equipmentConfigService.js
│   │   ├── schedulingApi.js
│   │   └── simulationApi.js
│   ├── stores/
│   │   └── authStore.js
│   ├── styles/
│   │   ├── Login.css
│   │   └── Register.css
│   ├── App.jsx
│   ├── App.tsx
│   ├── main.jsx
│   └── main.tsx
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Backend (`backend/`)
```
backend/
├── api/
│   └── v1/
│       ├── routers.py           # API routers registration
│       └── urls.py              # API v1 URL configuration
├── apps/
│   ├── analytics/
│   ├── scheduling/
│   │   ├── equipment_config.py
│   │   ├── equipment_config_serializers.py
│   │   ├── equipment_config_views.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── migrations/
│   ├── simulation/
│   │   ├── capacity_analysis.py
│   │   ├── models.py
│   │   ├── scenario_models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   └── users/
│       ├── dashboard.py
│       ├── models.py
│       ├── serializers.py
│       ├── urls.py
│       └── views.py
├── config/
│   ├── settings/
│   │   ├── base.py              # Base Django settings
│   │   ├── development.py       # Development settings
│   │   └── production.py        # Production settings
│   ├── urls.py                  # Main URL configuration
│   └── wsgi.py                  # WSGI configuration
├── manage.py                    # Django management script
└── requirements.txt             # Python dependencies
```

## Running the Application

### 1. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser

# Start development server
python manage.py runserver 0.0.0.0:8000
```

**Backend URL:** http://localhost:8000

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend URL:** http://localhost:5173

## API Documentation

### Dashboard Endpoint
- **URL:** `/api/v1/auth/dashboard/stats/`
- **Method:** `GET`
- **Authentication:** Required (Bearer Token)
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "username": "jramo",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Ramo",
      "role": "student",
      "department": "Computer Science",
      "avatar_url": "https://ui-avatars.com/api/..."
    },
    "booking_stats": {
      "total_bookings": 5,
      "confirmed_bookings": 3,
      "pending_bookings": 1,
      "cancelled_bookings": 1
    },
    "recent_bookings": [
      {
        "id": 1,
        "room_name": "Lab A",
        "date": "2026-01-30",
        "time": "09:00:00 - 10:00:00",
        "status": "CONFIRMED",
        "purpose": "Project discussion"
      }
    ],
    "simulation_stats": {
      "total_simulations": 2,
      "latest_simulation": {
        "scenario_name": "Queue System",
        "avg_queue_length": 2.5,
        "avg_waiting_time": 15.0
      }
    }
  }
  ```

## Features Implemented

### Authentication (Phase 1 ✅)
- User registration with role selection
- Login with JWT tokens
- Token refresh mechanism
- Protected routes
- Role-based access control

### Dashboard (Phase 1 ✅)
- User profile summary with avatar
- Booking statistics (total, confirmed, pending, cancelled)
- Recent bookings list
- Simulation statistics
- Quick action buttons
- Role-based styling

### Room Booking (Scheduled for Phase 2)
- Room availability checking
- Calendar integration
- Booking conflict detection
- Booking approval workflow

### Simulation System (Scheduled for Phase 2)
- Scenario creation
- Simulation execution
- Results visualization
- Analytics dashboard

## Environment Variables

### Backend (`.env`)
```
DATABASE_URL=postgresql://user:pass@host/db
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend (`.env.local` - optional)
```
VITE_API_URL=http://localhost:8000/api/v1
```

## Testing the Dashboard

1. **Start Backend Server**
   - Run: `python manage.py runserver`
   - API available at: http://localhost:8000

2. **Start Frontend Dev Server**
   - Run: `npm run dev`
   - Frontend available at: http://localhost:5173

3. **Access Dashboard**
   - Navigate to: http://localhost:5173
   - Click "Register" to create an account
   - Complete login
   - You'll be redirected to the dashboard

4. **Test API Directly**
   - Get access token from login response
   - Call: `GET http://localhost:8000/api/v1/auth/dashboard/stats/`
   - Headers: `Authorization: Bearer <access_token>`

## Technology Stack

### Backend
- **Django 6.0.1** - Web framework
- **Django REST Framework 3.16.1** - REST API
- **Simple JWT** - JWT authentication
- **PostgreSQL (Neon)** - Database
- **psycopg2** - PostgreSQL adapter

### Frontend
- **React 19.2.0** - UI framework
- **Vite 5.x** - Build tool
- **React Router 6.20.0** - Routing
- **Zustand 4.4.0** - State management
- **Axios 1.6.x** - HTTP client

## Troubleshooting

### Database Connection Issues
- Verify Neon database URL in `.env`
- Check internet connection to Neon servers
- Ensure `psycopg2-binary` is installed

### CORS Errors
- Update `CORS_ALLOWED_ORIGINS` in backend settings
- Verify frontend URL matches allowed origins

### API Not Found (404)
- Ensure backend server is running on port 8000
- Check API endpoint paths match routing configuration
- Verify auth token is included in request headers

### Import Errors
- Run `pip install -r requirements.txt` in backend
- Run `npm install` in frontend
- Ensure `python-dotenv` is installed for .env loading

## Next Steps (Phase 2)

1. **Booking Management**
   - Calendar component integration
   - Room selection interface
   - Availability checking

2. **Simulation Dashboard**
   - Scenario creation form
   - Results visualization with charts
   - Performance metrics

3. **Admin Panel**
   - User management interface
   - Room management
   - System analytics

4. **Notifications**
   - Real-time booking updates
   - Email notifications
   - Push notifications

## Development Workflow

See WORKFLOW.md for branching, commit, and pull request standards.

## Security Notes

- Never commit `.env` files with real credentials
- Use environment variables for sensitive data
- Keep `SECRET_KEY` secure in production
- Update dependencies regularly
- Use HTTPS in production
- Implement rate limiting for production

---

For more information, see individual app READMEs and inline code documentation.
