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
- Database schema & ERD: see `docs/erd/` (`it_helpdesk_erd_v4` reflects the current schema; see `it-helpdesk-schema.sql` for the full SQL definition)

## Week 2 Deliverables
- Backend project setup (Laravel + MySQL connection)
- JWT authentication: register, login, logout, `/me` endpoint
- Role-based authorization via `CheckRole` middleware (`role:<id>` route middleware)
- Roles seeded: Admin (1), IT Support Agent (2), Employee (3), Manager (4)
- Frontend project setup (React + Vite)
- Login, Register, and Dashboard (index) pages, connected to the auth API
- Renamed all database tables/columns to snake_case and foreign keys to `singular_id` format, per Laravel naming conventions

## Week 3 Deliverables
- `categories`, `priorities`, `statuses` tables — seeded with fixed values (Hardware/Software/Network/Email/Access Request/Other; Low/Medium/High/Critical; Open/In Progress/Pending/Resolved/Closed)
- `tickets` table with auto-generated `reference_no` (format: `TCK-{year}-{4-digit sequence}`, e.g. `TCK-2026-0001`)
- Full ticket CRUD via `TicketController`, with role-based permissions:
  - **Employee**: create tickets; view/edit/delete only their own, and only while status is "Open"
  - **Agent**: view all tickets; change status freely; self-assign a ticket
  - **Manager**: view all tickets
  - **Admin**: full access — create, view, edit, delete, assign, any ticket
- Search & filtering on `GET /tickets` (`category_id`, `priority_id`, `status_id`, `search`)
- Lookup endpoints (`/categories`, `/priorities`, `/statuses`, `/agents`) for frontend dropdowns
- Frontend: Ticket List (with filters), Create Ticket form, and a single role-aware Ticket Details page that shows different controls depending on the logged-in user's role

## Week 4 Deliverables
- `ticket_comments`, `activity_logs`, `ticket_status_history` tables — support comments, audit trail, and structured status history
- `POST /tickets/{id}/assign` — dedicated assignment endpoint; writes to `activity_logs`
  - **Agent**: self-assign only
  - **Admin**: assign to any Agent
  - **Manager**: forbidden — view/monitor only
- Status changes via `PUT /tickets/{id}` now write to `ticket_status_history` (old/new status, who changed it)
- `TicketCommentController` — comments/replies on tickets, with an `is_internal` flag (Agent-only) for team-only notes hidden from Employees
- `GET /tickets/{id}/activity` — merged, chronological timeline combining `activity_logs` and `ticket_status_history` into a single feed
- Workflow lock: a **Closed** ticket cannot be edited or reassigned by Agent; only **Admin** can reopen it by changing its status. Once Closed, assignment is locked for everyone (including Admin) until reopened.
- `active_only` filter on `GET /tickets` — excludes Resolved/Closed tickets
- Frontend: Comments section, reworked Assign/Status controls (per-role, using the new `/assign` endpoint), and an expandable "View History" row on the Ticket List page

## Known limitations / Next steps
- New users register with `role_id: null` (no role assigned by default).
  There is currently no admin interface to view *users* and assign them a role
  (ticket *assignment* to existing Agents is implemented, but assigning a role to a new user is still manual, via direct DB update).
- Forgot/reset password and profile management are not yet implemented.
- UI styling has been deliberately deferred — functionality is prioritized while requirements are still evolving week to week; a dedicated styling pass is planned once the feature set is more complete.