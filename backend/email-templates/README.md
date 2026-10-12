# Email templates (Supabase Auth)

Password-reset emails are sent by **Supabase Auth**, not by our backend. The
app pages are `/forgot-password` (requests the email) and `/reset-password`
(verifies the link and saves the new password).

## Setup checklist

Do these once per Supabase project (dev and production).

### 1. URL configuration
Supabase Dashboard → **Authentication → URL Configuration**

| Setting | Dev | Production |
|---|---|---|
| Site URL | `http://localhost:3000` | `https://your-domain.com` |
| Redirect URLs (add) | `http://localhost:3000/reset-password` | `https://your-domain.com/reset-password` |

`{{ .SiteURL }}` in the template comes from **Site URL** — if it's wrong, the
email button points to the wrong site.

### 2. Template
Supabase Dashboard → **Authentication → Emails → Templates → Reset Password**

- **Subject:** `Reset your PG Connect password`
- **Body:** paste the whole of [`reset-password.html`](reset-password.html)

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
| Sender name | `PG Connect` |

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
