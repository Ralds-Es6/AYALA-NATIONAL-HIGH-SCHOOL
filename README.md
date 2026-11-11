# Teaching Loads System - Laravel + React Boilerplate

A scalable boilerplate web application combining **PHP (Laravel 11)** on the backend with **React 18** on the frontend, using **Composer** and **npm** for dependency management.

Built for managing university teaching load assignments, course curriculums, and faculty workload capacity limits.

---

## Architecture Overview

```
TEACHING-LOADS-SYSTEM/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php
│   │   │   ├── SpaController.php                 # Serves root React entry view
│   │   │   └── Api/
│   │   │       ├── DashboardStatsController.php  # Aggregated metrics for UI
│   │   │       ├── TeachingLoadController.php    # REST API for loads
│   │   │       ├── InstructorController.php      # REST API for faculty
│   │   │       └── CourseController.php          # REST API for courses
│   │   ├── Middleware/
│   │   │   └── ForceJsonResponse.php             # JSON header normalization
│   │   └── Requests/
│   │       ├── StoreTeachingLoadRequest.php      # Validation rules
│   │       ├── StoreInstructorRequest.php
│   │       └── StoreCourseRequest.php
│   ├── Models/
│   │   ├── User.php                              # User authentication
│   │   ├── Instructor.php                        # Faculty profile & limits
│   │   ├── Course.php                            # Curriculum & units
│   │   └── TeachingLoad.php                      # Section assignments
│   └── Services/
│       └── TeachingLoadService.php               # Business logic & capacity calculations
├── bootstrap/
│   └── app.php                                   # Route & middleware configuration
├── database/
│   ├── factories/                                # Model factories
│   ├── migrations/                               # Database migrations
│   └── seeders/                                  # Seeders for realistic data
├── resources/
│   ├── css/
│   │   └── app.css                               # Custom Vanilla CSS design system
│   ├── js/
│   │   ├── app.jsx                               # React root entry point
│   │   ├── api/
│   │   │   ├── axios.js                          # Configured Axios client
│   │   │   └── endpoints.js                      # REST API client methods
│   │   ├── components/                           # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Alert.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   └── pages/                                # Single Page App views
│   │       ├── DashboardPage.jsx
│   │       ├── TeachingLoadsPage.jsx
│   │       ├── InstructorsPage.jsx
│   │       └── CoursesPage.jsx
│   └── views/
│       └── app.blade.php                         # Blade wrapper for React SPA
├── routes/
│   ├── api.php                                   # Versioned REST API endpoints (/api/v1/...)
│   └── web.php                                   # Fallback to SpaController
├── composer.json                                 # PHP/Laravel dependencies
├── package.json                                  # React & JavaScript dependencies
└── vite.config.js                                # Vite bundler configuration
```

---

## Technology Stack

- **Backend**: PHP 8.2+ with Laravel 11 (MVC architecture, Service Layer, Form Requests, Eloquent ORM)
- **Frontend**: React 18 with Vite and Vanilla CSS design tokens
- **Icons**: Lucide React
- **HTTP Client**: Axios with CSRF token interceptor
- **Database**: SQLite (default zero-configuration) or MySQL/PostgreSQL

---

## API Endpoints (`/api/v1`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/stats` | Dashboard KPIs, total units, capacity utilization, recent loads |
| `GET` | `/api/v1/instructors` | Faculty list with calculated workloads and overload flags |
| `POST` | `/api/v1/instructors` | Create a new instructor |
| `GET` | `/api/v1/courses` | Course catalog with units and lecture/lab hours |
| `POST` | `/api/v1/courses` | Create a new course |
| `GET` | `/api/v1/teaching-loads` | List assigned teaching loads (supports query filters) |
| `POST` | `/api/v1/teaching-loads` | Assign load (with automatic overload verification) |
| `DELETE` | `/api/v1/teaching-loads/{id}` | Remove a teaching load assignment |

---

## Quick Start Guide

### 1. Install Dependencies
```bash
# Install PHP dependencies
composer install

# Install Frontend dependencies
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
```

### 3. Run Migrations & Seeders
```bash
php artisan migrate --seed
```

### 4. Run Development Servers
```bash
# Terminal 1: Laravel Backend Server
php artisan serve

# Terminal 2: Vite Frontend Dev Server (Hot Module Replacement)
npm run dev

# Or build for production:
npm run build
```

Open `http://127.0.0.1:8000` in your web browser.
