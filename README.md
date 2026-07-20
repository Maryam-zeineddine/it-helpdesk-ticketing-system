# IT Help Desk & Ticketing Management System

Full stack web app for employees to submit IT support tickets, and agents/admins to manage, assign, and resolve them.

## Tech Stack
- Frontend: React (Vite)
- Backend: PHP Laravel
- Database: MySQL
- Auth: JWT (tymon/jwt-auth)


## Week 1 Deliverables
- Workflow diagrams: see `docs/workflow-diagrams/`
- UI wireframes: see `docs/wireframes/` (Figma file: [(https://www.figma.com/design/Ft7vXAN4m46XYrmIBziocx/IT-Help-Desk-%E2%80%93-Wireframes?node-id=6-179&t=v54j7OHQENUEFIsO-1)])
- Database schema & ERD: see `docs/erd/` (`it_helpdesk_erd_v2` reflects the current snake_case schema, updated in Week 2 after aligning with Laravel naming conventions)

## Week 2 Deliverables
- Backend project setup (Laravel + MySQL connection)
- JWT authentication: register, login, logout, `/me` endpoint
- Role-based authorization via `CheckRole` middleware (`role:<id>` route middleware)
- Roles seeded: Admin (1), IT Support Agent (2), Employee (3), Manager (4)
- Frontend project setup (React + Vite)
- Login, Register, and Dashboard (index) pages, connected to the auth API
- Renamed all database tables/columns to snake_case and foreign keys to `singular_id` format, per Laravel naming conventions

## Known limitations / Next steps
- New users register with `roleId: null` (no role assigned by default).
  There is currently no admin interface to view users and assign roles; 
  this needs to be built in a later week (likely alongside user/ticket management features).
- Forgot/reset password and profile management are not yet implemented.