# Activate visitor accounts

The production homepage shows Sign in when at least one provider is configured. One Supabase project owns the login identities, private starred lists and opt-in records. Resend delivers a daily summary for a verified subscriber whose stars have published updates. Both the account page and emails support English and Simplified Chinese.

## Sign-in

1. In the website owner's Supabase project, run [schema.sql](schema.sql) once in the SQL Editor. It creates private tables and scoped RPCs. Keep `watch_private` outside the Data API's exposed schemas.
2. Under Authentication → URL Configuration set the Site URL to `https://www.1aminvesting.com`. Allow these exact return URLs for the website.
   - `https://www.1aminvesting.com/account/?lang=en`
   - `https://www.1aminvesting.com/account/?lang=zh-CN`
3. In Authentication → Sign In / Providers, configure each desired provider and allow new users to sign up. Copy the project callback URL shown by Supabase into each provider's web application settings. Provider credentials belong in the Supabase dashboard.
   - [Google web sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google) uses the web client ID and secret. Request basic identity and email scopes.
   - [Apple web sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-apple) uses a Services ID and an Apple Developer signing key. Arrange renewal of the Apple client secret before expiry and register the email sender for Apple's private relay.
   - [Facebook Login](https://supabase.com/docs/guides/auth/social-sign-in/auth-facebook) uses a Meta app ID and secret with email permission. Put the app into live mode when ready. The account data notice and self-service deletion instructions are at `https://www.1aminvesting.com/account/#privacy`. Review the notice for the operator's actual business and provider requirements.
4. Set these **production build** environment variables in Netlify. Add only providers that work for public users. The build emits only the public client settings.
   - `ACCOUNT_PROJECT_URL` = the project's HTTPS Supabase URL
   - `ACCOUNT_PUBLIC_KEY` = the Supabase publishable key beginning with `sb_publishable_`
   - `ACCOUNT_PROVIDERS` = comma-separated names selected from `google,apple,facebook`
5. Deploy and check each provider with a test visitor in both languages. After sign-in, existing browser stars can be imported explicitly. New star changes save to the signed-in account. Signing out restores the device's guest list.

## Optional starred-company emails

1. [Verify the sending domain in Resend](https://resend.com/docs/dashboard/domains/introduction). Choose the From address and create a sending key restricted to that domain. Register this sender with Apple's private relay to reach visitors using Hide My Email.
2. In GitHub Actions secrets, store `RESEND_API_KEY` and `ACCOUNT_SERVICE_KEY` (a server-side Supabase secret key for this project). In Actions variables, set `ACCOUNT_PROJECT_URL` and `ACCOUNT_FROM` (the verified sender). The service key and sending key stay in the Actions runner.
3. In Netlify production build settings set `ACCOUNT_EMAIL_ENABLED=true` and redeploy. Confirm `/watch-updates.json` serves JSON on the public site. Then set the GitHub Actions variable `ACCOUNT_EMAIL_ENABLED=true` to start delivery. The separate subscriber workflow reads the published site and runs independently of price updates and the owner's personal mail.
4. Test using a consenting test address and a starred company with a subsequent published change. Check the article link, native currency, email language and unsubscribe. In the account page, subscribing requires a separate opt-in. The delivery job checks the verified address and matches changes after both the opt-in and the star date.

The digest groups published research revisions and quarterly model changes through midnight UTC. Short hourly delivery runs drain the queue and retry interrupted sends. Before each send the database rechecks the account, consent and starred companies. Each queued message has a durable ID used as its Resend idempotency key. An unresolved send older than 23 hours is held for review. Look up that key in Resend, record a confirmed acceptance with `watch_delivered`, or release the job for retry after confirming it was never accepted. [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys)

Disable the Actions variable to pause sending. Keep the account settings and unsubscribe route available to existing subscribers. The SDK in `assets/account` is the published UMD bundle from `@supabase/supabase-js@2.119.2` and loads on demand. Functional checks are in `tests/accounts.test.cjs`, `tests/accounts.browser.cjs` and `tests/account-store.integration.cjs`.
