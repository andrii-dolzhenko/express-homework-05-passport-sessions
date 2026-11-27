# Express.js · Homework 05 · Passport + Sessions

Express Studio is an Express 5 application demonstrating Passport Local authentication, server-side sessions, protected routes, and session-based preferences. The interactive dashboard makes the authentication flow and session state visible in the browser.

## Features

- **Passport Local authentication:** registration and login use email and password credentials.
- **Server-side sessions:** `express-session` stores authentication state on the server; the browser receives only the session cookie.
- **Password security:** passwords are hashed with `bcryptjs`; API responses expose only the public user fields (`id` and `email`).
- **Protected routes:** `requireAuth` protects the current-user endpoint, while `/protected` demonstrates authenticated access.
- **Session lifecycle:** registration signs the user in, login restores the authenticated session, and logout removes authentication and destroys the session.
- **Session counter:** `/session` increments a visit counter; deleting the counter does not log the user out.
- **Theme preference:** the light/dark theme is stored in a separate cookie and applied to the server-rendered pages.
- **Interactive demo:** the `/demo` page provides registration, login, logout, protected-route, session-counter, and theme controls.
- **Server-rendered pages:** Pug and EJS templates demonstrate Users and Articles pages with shared responsive navigation.
- **Automated tests:** Vitest and Supertest cover authentication, sessions, routes, templates, navigation, and static assets.

## Technology

Node.js 20+ · Express 5 · Passport · passport-local · express-session · bcryptjs · Pug · EJS · Vitest · Supertest · Yarn

## Installation and local development

**Prerequisites:** Node.js 20+ and Yarn 1.22+.

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd express-homework-05-passport-sessions
yarn install
```

Create a session secret and start the development server:

```bash
export SESSION_SECRET="$(openssl rand -hex 32)"
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

The application generates a temporary secret when `SESSION_SECRET` is not provided. Use a stable secret during local testing if sessions need to remain valid across server restarts.

## Interactive demo

Open `http://localhost:3000/demo`. The dashboard demonstrates the Passport session flow:

1. Register with an email address and password.
2. Observe the authenticated user returned by the application.
3. Sign in with an existing account.
4. Request `/protected` and inspect the authenticated response.
5. Log out and verify that protected access is rejected.
6. Increment and reset the session visit counter.
7. Switch between light and dark themes.

The session counter and theme preference are independent of Passport authentication. Resetting the counter does not terminate the authenticated session.

## Routes

### Pages and static files

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Home page |
| `GET` | `/demo` | Interactive Passport and sessions dashboard |
| `GET` | `/demo/icon` | Favicon preview |
| `GET` | `/users` | Users page (HTML) or users collection (JSON) |
| `GET` | `/users/:userId` | User details page or JSON resource |
| `GET` | `/articles` | Articles page (HTML) or articles collection (JSON) |
| `GET` | `/articles/:articleId` | Article details page or JSON resource |
| `GET` | `/favicon.ico` | ICO favicon |
| `GET` | `/favicon.svg` | SVG favicon |
| `GET` | `/assets/...` | Static CSS, JavaScript, and image assets |

### Authentication and protected access

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Register using `email` and `password`; signs in after successful registration |
| `POST` | `/auth/login` | Authenticate with Passport Local |
| `GET` | `/auth/me` | Return the current authenticated user; otherwise `401` |
| `POST` | `/auth/logout` | Log out, destroy the session, and clear the session cookie |
| `GET` | `/protected` | Example protected endpoint; otherwise `401` |

### Sessions and theme

| Method | Path | Description |
|---|---|---|
| `GET` | `/session` | Increment and return the session visit counter |
| `DELETE` | `/session` | Reset the visit counter without logging out |
| `GET` | `/theme` | Read the current theme preference |
| `POST` | `/theme` | Update the theme preference |

### Users and articles API

| Method | Path | Description |
|---|---|---|
| `GET` | `/users` | List users |
| `POST` | `/users` | Create a user |
| `GET` | `/users/:userId` | Read a user |
| `PUT` | `/users/:userId` | Update a user |
| `DELETE` | `/users/:userId` | Delete a user |
| `POST` | `/users/strict` | Create a user through the strict-access demo route |
| `GET` | `/articles` | List articles |
| `POST` | `/articles` | Create an article |
| `GET` | `/articles/:articleId` | Read an article |
| `PUT` | `/articles/:articleId` | Update an article |
| `DELETE` | `/articles/:articleId` | Delete an article |
| `POST` | `/articles/strict` | Create an article through the strict-access demo route |

Unknown routes return `404 Not Found`.

## Example: authenticate using a session cookie

Register and save the session cookie:

```bash
curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"SafePass123!"}' \
  http://localhost:3000/auth/register
```

Read the current user and access the protected route:

```bash
curl -i -b cookies.txt http://localhost:3000/auth/me
curl -i -b cookies.txt http://localhost:3000/protected
```

Log out:

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/auth/logout
```

After logout, requests to `/auth/me` and `/protected` without a new authenticated session return `401`.

## Testing and CI

Run the complete automated test suite:

```bash
yarn test
```

Run Vitest in watch mode or generate coverage:

```bash
yarn test:watch
yarn test:coverage
```

Check the patch for whitespace errors:

```bash
git diff --check
```

The test suite uses Vitest and Supertest to exercise API responses, Passport authentication, session behavior, server-rendered pages, navigation, and static assets.

## Project structure

```text
src/
├── config/
│   └── passport.mjs
├── controllers/
│   ├── auth.mjs
│   └── theme.mjs
├── data/
│   └── accounts.mjs
├── middlewares/
│   ├── requireAuth.mjs
│   └── session.mjs
├── public/
│   ├── css/
│   ├── js/
│   ├── favicon.ico
│   └── favicon.svg
├── routes/
│   ├── auth.mjs
│   ├── index.mjs
│   ├── protected.mjs
│   ├── session.mjs
│   └── theme.mjs
├── views/
│   ├── articles/
│   ├── users/
│   ├── demo-icon.pug
│   └── demo.pug
├── __test__/
└── server.mjs
```

## Security and limitations

- This is an educational application, not a production authentication service.
- User accounts are stored in an in-memory `Map` and are lost when the server restarts.
- The default Express `MemoryStore` is used for sessions; it is not suitable for production.
- Passwords are hashed with bcrypt; plaintext passwords are not stored.
- The session cookie is named `hw05.sid`, uses `httpOnly` and `sameSite: 'lax'`, and expires after 10 minutes. The `secure` option is enabled in production.
- Production deployment requires HTTPS, a persistent session store, a stable secret, and appropriate proxy and CSRF protections.
- OAuth providers, password recovery, and a database-backed account/session store are outside this homework's scope.

---

Copyright © 2026 Andrii Dolzhenko. All Rights Reserved.
