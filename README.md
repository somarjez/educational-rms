# Educational RMS

Educational RMS is a Django + React system for room scheduling, equipment management, and capacity/simulation analysis in academic environments.

## Documentation

- [QUICKSTART_GUIDE.md](QUICKSTART_GUIDE.md)
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- [WORKFLOW.md](WORKFLOW.md)

## Quick Start (Local)

### Backend

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Access the UI at http://localhost:5173

## Current Functionality

- Authentication and profiles: registration, login, JWT refresh, change password, roles, profile updates
- Dashboard stats: user summary, booking stats, recent bookings, simulation snapshot
- Scheduling: rooms, equipment, time slots, availability checks, search and filters
- Bookings: create/update/cancel, approvals and rejections, conflict override, recurring support, calendar view, drag-to-reschedule
- Waitlist: create entries, prioritize, fulfill, auto-fill on cancellations
- Equipment configuration: link/unlink, bulk updates, room/equipment matrix, distribution and auto-distribute
- Simulation: scenario CRUD, run/estimate queue metrics, results history, system snapshot for setup
- Capacity analysis: utilization, demand scenarios, peak hours, trends, saved scenarios, custom allocations, CSV export

## API Endpoints (Selected)

Base path: `/api/v1`

### Auth and profiles

```
POST   /auth/users/register/
POST   /auth/users/login/
POST   /auth/users/logout/
POST   /auth/users/refresh_token/
POST   /auth/users/change_password/
GET    /auth/users/me/
PUT    /auth/users/me/
PATCH  /auth/users/me/
GET    /auth/users/roles/
GET    /auth/profiles/me/
PUT    /auth/profiles/me/
PATCH  /auth/profiles/me/
GET    /auth/dashboard/stats/
```

### Scheduling

```
GET    /scheduling/rooms/
POST   /scheduling/rooms/
GET    /scheduling/rooms/{id}/
GET    /scheduling/rooms/{id}/availability/
POST   /scheduling/rooms/{id}/add_equipment/
POST   /scheduling/rooms/{id}/remove_equipment/

GET    /scheduling/equipment/
POST   /scheduling/equipment/

GET    /scheduling/timeslots/
POST   /scheduling/timeslots/

GET    /scheduling/bookings/
POST   /scheduling/bookings/
GET    /scheduling/bookings/{id}/
PUT    /scheduling/bookings/{id}/
PATCH  /scheduling/bookings/{id}/
DELETE /scheduling/bookings/{id}/
POST   /scheduling/bookings/{id}/approve/
POST   /scheduling/bookings/{id}/reject/
POST   /scheduling/bookings/{id}/cancel/
POST   /scheduling/bookings/{id}/override_conflict/
PATCH  /scheduling/bookings/{id}/drag_update/
GET    /scheduling/bookings/calendar/
POST   /scheduling/bookings/bulk_cancel/
POST   /scheduling/bookings/bulk_delete/

GET    /scheduling/waitlist/
POST   /scheduling/waitlist/
POST   /scheduling/waitlist/{id}/prioritize/
POST   /scheduling/waitlist/{id}/fulfill/
```

### Equipment configuration

```
POST   /equipment-config/configure_room_equipment/
POST   /equipment-config/add_equipment/
POST   /equipment-config/remove_equipment/
GET    /equipment-config/get_room_equipment/
GET    /equipment-config/get_unlinked_equipment/
POST   /equipment-config/bulk_update/
GET    /equipment-config/equipment_distribution/
GET    /equipment-config/room_equipment_matrix/
POST   /equipment-config/distribute-equipment/
POST   /equipment-config/remove-equipment-from-room/
POST   /equipment-config/auto-distribute/
```

### Simulation

```
GET    /simulation/
POST   /simulation/
POST   /simulation/{id}/run/
GET    /simulation/{id}/results/
GET    /simulation/system_snapshot/
```

### Capacity analysis

```
GET    /capacity/current_utilization/
POST   /capacity/scenario_analysis/
GET    /capacity/peak_hours/
GET    /capacity/trend_analysis/
POST   /capacity/save_scenario/
GET    /capacity/saved_scenarios/
GET    /capacity/scenario_detail/
POST   /capacity/custom_allocation/
GET    /capacity/export_csv/
```

## Configuration

### Backend ([backend/.env](backend/.env))

```
DATABASE_URL=postgresql://user:pass@host/db
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend ([frontend/.env.local](frontend/.env.local))

```
VITE_API_URL=http://localhost:8000/api/v1
```

## Testing

- [test_auth_flow.py](test_auth_flow.py)
- [test_frontend_api.py](test_frontend_api.py)
- [backend/test_api.py](backend/test_api.py)

## Tech Stack

### Backend

- Django 6.0.1
- Django REST Framework 3.16.1
- Simple JWT
- PostgreSQL or SQLite

### Frontend

- React 19.2.0
- Vite
- React Router 6.20.0
- Zustand
- Axios

## Deployment and Helpers

- [render.yaml](render.yaml) for backend deployment
- [vercel.json](vercel.json) for frontend deployment
- [start_backend.bat](start_backend.bat) for local Windows startup

Last Updated: February 6, 2026
