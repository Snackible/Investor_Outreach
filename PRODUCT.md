# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated (inferred, user did not answer the stack question): Next.js on Vercel. Server routes read Google Sheets through the Sheets API and handle the PIN login. Chosen because the Vercel account is already connected and the Sheets credentials must stay server-side.

Database (confirmed): the user's existing MongoDB Atlas free cluster (512 MB, shared with another app). Use a separate `investor_hub` database. The connection string comes from the `MONGODB_URI` environment variable and is never committed. Because Atlas's free-tier quota is a hard limit that would also break the other app, the app checks cluster usage before writing and stops above a safety ceiling.

## Users

Snackible's small fundraising team (founder office: Aditya Sanghavi "AS", plus team members such as Aditi, Stuti, Saumya, Heet, Hitansh, Chinmay). They run cold investor outreach through YAMM mail merges from Google Sheets, follow up by email, WhatsApp and LinkedIn, and move interested investors toward meetings, data sharing and due diligence. Only users whose `role` is `admin` in the users sheet may sign in.

Device use (inferred): laptop-first during the working day; phone use for quick checks (who is due a follow-up, has this email been contacted).

## Product Purpose

Investor Hub puts investor outreach in one place:

1. One email hashmap of every address ever contacted or barred, so a new lead list can be checked and cleaned of duplicates in seconds before it goes to YAMM.
2. YAMM campaign analytics across all sheets.
3. Investor response tracking: who replied, which stage they are at, who is due a follow-up.

Success: no investor is ever mailed twice by accident, the team can see its outreach and replies over any date range, and nobody has to hunt across 50+ tabs to find where an investor stands. There is no weekly contact goal; about 500 a week is only the expected volume used for storage sizing.

## Positioning

The hashmap is built from Snackible's own sheets and YAMM merge history. "Used" means YAMM actually merged the email, not merely that it was uploaded somewhere.

## Operating Context

- Source data lives in three Google Sheets: Investor Tracker (pipeline tabs per team member), Master Investor Database (`Exhausted` tab, about 8,200 approached funds = do not contact) and Master Investor Sheet (about 50 lead and campaign tabs with YAMM `Merge status` / `Previous merge status` columns).
- Logins come from a separate users sheet with columns: username, password (4-digit PIN), role, account_id, display_name, Email, Contact. It is read through the Sheets API.
- YAMM (Yet Another Mail Merge) sends from Google Sheets and writes statuses: EMAIL_SENT, EMAIL_OPENED, EMAIL_CLICKED, RESPONDED, BOUNCED, UNSUBSCRIBED.
- Pipeline vocabulary already in use: Waiting for reply, 1st Followup pending, Connected on WhatsApp, 1st/2nd/3rd Meet scheduled, Data to be sent, Due Diligence, Interested, Converted, Not Interested, Inactive.

## Capabilities and Constraints

- **Storage: only the email hashmap is stored** (cleaned email → status, plus who and when), one MongoDB document per email with the email as `_id`. A tiny self-expiring collection holds login-lockout counters. Everything else (analytics, pipeline, contact history) is read live from the Google Sheets and is not persisted, so YAMM status history is not kept.
- Expected footprint: about 3 MB at backfill, about 9-13 MB after one year, about 32 MB after five years.
- Hashmap statuses: `contacted` (YAMM merged it, or it is on a tracker tab), `do_not_contact` (Exhausted list), `bounced`, `unsubscribed`, `staged` (uploaded for checking but not yet merged).
- Uploading a list checks it and never marks anyone as used. Unmerged uploads stay saved as `staged`, and a later upload containing them is warned, not blocked. When a sync sees a YAMM merge status, the email is promoted to `contacted`.
- Email cleaning: trim, lowercase, strip trailing punctuation, split multi-email cells, drop placeholders such as "WA" or "Not availaible".
- Login: admin role only, username + 4-digit PIN, lockout after repeated failures.
- Expected volume: about 20,000 unique emails today, plus about 500 contacted per week.
- Undecided: final pipeline stage list; whether a new contact at an already-contacted firm is warned or blocked.

## Brand Commitments

None confirmed (inferred: internal tool, only the name "Snackible" appears).

## Evidence on Hand

- Plan document: `Investor_Hub_Plan.pdf` in this folder. It predates the "store only the hashmap" decision, so its data-model and size sections are out of date.
- No real metrics are available to the design yet. Mock data must look plausible and must never be presented as real figures.

## Product Principles

1. Never mail the same investor twice: the duplicate check is the product's core and must be fast, obvious and trustworthy.
2. The sheets stay the source of truth; the Hub reads them and stores nothing but the hashmap.
3. Show who did what: every upload and stage carries a person's name.
4. Today's work first: follow-ups due and this week's activity before historical analytics.
