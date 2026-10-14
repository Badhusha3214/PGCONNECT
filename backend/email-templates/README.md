# Email templates (Supabase Auth)

Password-reset emails are sent by **Supabase Auth**, not by our backend. The
app pages are `/forgot-password` (requests the email) and `/reset-password`
(verifies the link and saves the new password).

## Setup checklist

Do these once per Supabase project (dev and production).

### 1. URL configuration
Supabase Dashboard → **Authentication → URL Configuration**

One Supabase project serves both dev and the live site, so **Site URL must be
the live site** — otherwise every email (signup confirmation, password reset)
links to localhost.

| Setting | Value |
|---|---|
| Site URL | `https://www.pgcon.in` |
| Redirect URLs (add all) | `https://www.pgcon.in/**`, `https://pgcon.in/**`, `https://pgconnect-zeta.vercel.app/**` and `http://localhost:3000/**` |

`{{ .SiteURL }}` in the templates comes from **Site URL**. The signup link's
final landing page (`/signin?confirmed=1`) comes from the backend's
`CLIENT_URL` and only works if that URL matches a Redirect URL above —
otherwise Supabase silently falls back to Site URL.

### 2. Templates
Supabase Dashboard → **Authentication → Emails → Templates**

| Template | Subject | Body |
|---|---|---|
| Confirm signup | `Confirm your email for PGCON` | [`confirm-signup.html`](confirm-signup.html) |
| Reset Password | `Reset your PGCON password` | [`reset-password.html`](reset-password.html) |

The button uses `token_hash`, so the link works even when the email is opened
on a different phone or laptop from the one that requested it.

### 3. SMTP (required for real users)
Supabase's built-in mailer only delivers to your project's team members and is
heavily rate-limited — fine for a quick test, not for students and owners.

Supabase Dashboard → **Authentication → Emails → SMTP Settings** → enable custom SMTP.
With Resend (already used for owner inquiry emails):

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your Resend API key (same as `RESEND_API_KEY`) |
| Sender email | e.g. `noreply@your-domain.com` (domain must be verified in Resend) |
| Sender name | `PGCON` |

### 4. Rate limit
After custom SMTP is on: **Authentication → Rate Limits → "Emails sent per
hour"** — raise it from the default to suit your traffic.

### 5. Test
1. Register an account with an email inbox you can open (the seeded
   `@pgconnect.test` accounts cannot receive mail).
2. Go to `/signin` → **Forgot password?** → enter that email.
3. Open the email, click **Choose a new password**, save a new one.
4. You land on `/signin` with a "Password updated" message — log in.

## Template variables used
| Variable | Meaning |
|---|---|
| `{{ .SiteURL }}` | Site URL from step 1 |
| `{{ .TokenHash }}` | One-time recovery token, verified by `/reset-password` |
| `{{ .Email }}` | The recipient's email address |
