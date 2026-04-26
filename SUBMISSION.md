# Mini Admin Dashboard Submission


# Login credentials
## Demo Login

Use the following account to review the admin dashboard:

Email: admin22@gmail.com
Password: Admin@123

This is a temporary evaluation account created for project review.

## Architecture

- Frontend: Vite + React JavaScript app in `src/`
- Auth and database: Supabase Auth plus Supabase Postgres
- Supabase setup: SQL schema and RLS policies in `supabase/schema.sql`
- State management: local React state with Supabase as the source of truth

## Decisions Taken

- Used Supabase Auth for admin login and guarded the dashboard based on session state.
- Kept the app as a frontend-only project because Supabase already covers auth, database, and access control.
- Added the `type` column to `jobs` because the CRUD requirements include job type even though the sample schema omitted it.
- Implemented the bonus items in the UI:
  - Search across title, location, and type
  - Filter by type and location
  - Pagination
  - Inline validation
  - Toast notifications
- Built the "Save Job" feature with a `saved_jobs` join table using `user_id` and `job_id`.

## Improvements

- Restrict job create, update, and delete actions to true admin users only with a Supabase role claim.
- Add server-side pagination for larger job datasets.
- Add automated tests for auth, CRUD, and save-job flows.
- Add optimistic updates and better loading skeletons for production polish.
