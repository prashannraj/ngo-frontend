# NGO Office Automation System

A comprehensive MIS + HRIS + PMS solution for Non-Governmental Organizations. Built with Laravel 12 (Backend) and Next.js (Frontend).

## 🚀 Application Features

### 1. Core Modules
- **HRIS (Human Resource Information System)**: Complete employee lifecycle management.
- **PMS (Project Management System)**: Project tracking, task assignment, and timelines.
- **Asset & Fleet Management**: Track organization assets and vehicle requests.
- **Attendance & Leave**: Automated attendance tracking and leave approval workflows.

### 2. Employee Management
- **Detailed Profiles**: Manage personal info, contact details, and emergency contacts.
- **Photo Upload**: Support for employee profile pictures (JPEG/PNG).
- **Activity Logs**: Track every action (login, create, update, delete) performed by users.
- **ID Card Generation**: Professional, printable ID cards with NGO logo and employee details.

### 3. NGO Configuration
- **NGO Settings**: Manage organization name, address, logo, and registration details.
- **Multi-language Support**: Seamless switching between English and Nepali.
- **RBAC (Role-Based Access Control)**: Secure access for Admin, HR, Project Managers, and Employees.

---

## 🛠 Prompts & Development Journey

This application was developed through a series of iterative prompts:
1. **Initialization**: Setting up Laravel 12 backend and Next.js frontend with Shadcn UI.
2. **Core Backend**: Implementing Sanctum Auth, Spatie RBAC, and standardized API responses.
3. **Module Development**: Creating migrations and controllers for HRIS, PMS, and Assets.
4. **Frontend Core**: Building the dashboard layout, sidebar navigation, and authentication flow.
5. **Feature Enhancement**: Adding employee search, status badges, and management modals.
6. **Workflow Implementation**: Building leave request and approval systems.
7. **Refinement**: Fixing hydration errors, linter diagnostics, and input `null` value warnings.
8. **Professional Tools**: Adding NGO Settings, Profile Picture uploads, and "Print ID Card" functionality.
9. **Data Integrity**: Implementing Master Data Seeders for Departments and Designations.

---

## ⚙️ How to Operate

### Prerequisites
- PHP 8.2+ & Composer
- Node.js 18+ & npm
- SQLite (default) or MySQL

### Backend Setup
1. Navigate to the backend folder: `cd backend`
2. Install dependencies: `composer install`
3. Set up environment: `cp .env.example .env`
4. Generate key: `php artisan key:generate`
5. Run migrations & seeders: `php artisan migrate:fresh --seed`
6. Link storage: `php artisan storage:link`
7. Start server: `php artisan serve` (Runs on http://localhost:8000)

### Frontend Setup
1. Navigate to the frontend folder: `cd frontend`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev` (Runs on http://localhost:3000)

### Default Login
- **Email**: `admin@ngo.com`
- **Password**: `password`

---

## 📂 Project Links
- **Backend Code**: [https://github.com/prashannraj/ngo-backend.git](https://github.com/prashannraj/ngo-backend.git)
- **Frontend Code**: [https://github.com/prashannraj/ngo-frontend.git](https://github.com/prashannraj/ngo-frontend.git)
