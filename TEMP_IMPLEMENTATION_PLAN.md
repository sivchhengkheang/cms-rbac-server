TEMP Implementation Plan

Purpose: Snapshot plan before implementing code updates for RBAC and auth.

Priority (next actions):

1. Move `DELETE /user/:id` from contentRoute to `userRoute` and implement `deleteUser` in `src/contollers/user.js` — COMPLETED (auth checks currently commented out).
2. Protect `POST /content` with `verifyToken` and `checkRole("Admin","Manager")` — COMPLETED.
3. Harden DB connection: make `dbConnection` async and fail-fast on startup — PENDING.
4. Implement a global error-handling middleware and register it in `src/server.js` — PENDING.
5. Add request validation for `register`, `login`, and `create` user endpoints (recommend `express-validator`) — PENDING.

Verification:

- Start dev server: npm run dev
- Test endpoints with curl or Postman: register, login, create user, delete user, update content.

Env vars required:

- PORT
- CONNECTION_STRING
- SECRET_KEY

Next: Completed items (1,2) are applied. Choose next task to implement:

- Re-enable auth checks on `DELETE /user/:id` in `src/routers/userRoute.js`.
- Harden `dbConnection` to fail-fast on connection error.
- Add a global error-handling middleware and register it in `src/server.js`.
- Add request validation for auth and user creation.

Tell me which one to implement first and I'll start.
