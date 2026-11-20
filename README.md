# Artist WB

A multilingual artist portfolio and artwork catalogue with an admin panel and purchase-enquiry form.

## Requirements

- Node.js 20+
- npm
- A configured SMTP account for contact and purchase enquiries

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` in the repository root and fill in the required values. Generate a unique `JWT_SECRET` (at least 32 characters) and a unique administrator password (at least 12 characters).

3. Initialize the administrator and default content:

   ```bash
   npm run seed
   ```

4. Start the server:

   ```bash
   npm start
   ```

5. Open http://localhost:4000

The SQLite database is created at the configured `DB_PATH`. Uploaded files are stored in `UPLOAD_DIR`. Back up both locations outside the repository.

## Purchase enquiries

The artwork page links to the contact form with the artwork slug. The server resolves that slug to the canonical artwork title before sending the enquiry email. Configure SMTP variables and `CONTACT_TO` to receive messages.

## Production checklist

- Set a unique strong `JWT_SECRET` and administrator credentials.
- Configure `CORS_ORIGIN` to the actual website origin.
- Configure SMTP and test the enquiry flow end to end.
- Persist and back up the SQLite database and uploads directory outside the deploy artifact.
- Serve the site over HTTPS.
- Do not commit `.env`, database files, or uploaded customer content.
- If a database or credentials were ever committed to a public repository, treat exposed credentials as compromised and rotate them. Removing a file in a later commit does not erase its Git history.

## Notes

The frontend currently uses React and Tailwind CDN scripts with in-browser JSX compilation. A production Vite build and server-rendered/per-artwork SEO are separate follow-up work; they are not implied by the current setup scripts.
