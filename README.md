# Artist portfolio

## Requirements

- Node.js 20 or newer
- npm
- SMTP credentials for the contact form

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`
3. Generate a strong JWT secret, for example with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`
4. Set `JWT_SECRET`, SMTP settings and `CONTACT_TO` in `.env`
5. Start the application: `npm start`

The application serves the website and API on port 4000 by default. The SQLite schema is initialized automatically. The admin account must already exist in the database; use the password reset utility when needed.

## Important deployment notes

- Persist the SQLite database and the uploads directory between deployments.
- Back up the SQLite database before migrations or deployments.
- Do not commit `.env`, user uploads, or production database files.
- The repository currently contains a tracked SQLite database. `.gitignore` does not remove files already committed; review that database for personal data and credentials, then remove it from version control if it is not intended as a public demo fixture.
- Configure HTTPS and restrict `CORS_ORIGIN` to the real site origin.
- Configure SMTP: the contact / purchase inquiry form depends on it.
