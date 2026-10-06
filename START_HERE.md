# Dupont Borough Light Pole App — Netlify package

## Corrected package — start here

Open `READ_ME_FIRST.html` for the simple steps for your existing GitHub repository and Netlify site.

The previous live deploy contained only `Dupont_Light_Poles_Netlify.zip`. GitHub does not unpack that archive for Netlify. **Extract this ZIP on your computer, then upload its contents to the top level of your existing repository. Do not upload the ZIP itself or the enclosing folder.**

This corrected ZIP has `netlify.toml` and `package.json` directly at its root, with no extra enclosing project folder. The existing site is https://dupontlightpolestreetaddress.netlify.app . Its root returned 404 when checked on October 6, 2026. This package has not been deployed by the assistant.

The command-line deployment method below is an alternative for an IT helper. You do not need to create another site.

Prepared October 6, 2026 for Tony Guariglia, Borough Manager.

## What is ready

- All 204 original light-pole records, with original source street text retained.
- A searchable street dropdown with 81 consistent choices. Type part of the street name, select it, and enter the house number separately. The server rejects unlisted streets.
- Shared online records, a server-checked password, secure 12-hour sessions, printing, JSON download and JSON import.
- A daily JSON email to **drguariglia@hotmail.com**, once the email service is connected.
- A daily server-side snapshot, plus visible email status in the app.

**This package has not been published. Automatic emails are not active yet.**

## Publish this on Netlify

This app contains server functions. Uploading only the HTML file through Netlify Drop will not activate the password, shared records or emails. Use the full project with the following steps (or give this package to your IT helper).

1. Extract the ZIP file on your computer.
2. Install Node.js 22 or newer from https://nodejs.org if it is not installed.
3. Open a terminal inside the extracted folder containing `package.json` and `netlify.toml`.
4. Run these commands, one line at a time:

```text
npm ci
npx netlify login
npx netlify link --id faa35cf8-5475-4551-b43c-039da8b5373c
```

Choose the Netlify account that owns your light-pole project. The link command targets your existing `dupontlightpolestreetaddress` site. Do not select your Borough payment or management website.

5. Set the password you requested:

```text
npx netlify env:set APP_PASSWORD YOUR_APP_PASSWORD
```

6. Generate a session-signing secret:

```text
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy the generated result into a Netlify environment variable called `SESSION_SECRET`. Keep it private. The app will refuse login until this variable contains at least 32 characters. Do not use the shared password as the session secret.

7. Set up the two email variables described below. You can publish before doing this; the app will display that email setup is needed.
8. Deploy the full project:

```text
npm run deploy
```

The command supplies your live Netlify web address. Share that address and the password with the people entering information.

Your existing GitHub repository is already connected to Netlify. Follow READ_ME_FIRST.html to upload the extracted contents at its root. The included `netlify.toml` supplies the build command and publish folder. Keep secrets only in Netlify environment variables, not in your public GitHub repository.

## Connect daily email backups

This package uses Resend to send the attachment. It does not need access to your Outlook mailbox.

1. Create or sign into your account at https://resend.com.
2. Verify a sending domain you control, following Resend's DNS instructions. Obtain help from the domain administrator if needed. Use an approved sender address on that verified domain.
3. Create an API key for sending email.
4. In your Netlify project's environment variables, add:

| Variable | Value |
| --- | --- |
| `APP_PASSWORD` | `18641` |
| `SESSION_SECRET` | Your random secret from step 6 |
| `RESEND_API_KEY` | Your Resend sending key |
| `BACKUP_FROM` | Your approved sender address on the verified domain |

Use the Functions scope (or all scopes) and the production context. Redeploy after changing variables. Do not paste API keys into the public website or commit them to Git.

The recipient is fixed in the server code as `drguariglia@hotmail.com`.

The first daily attempt is at **10:00 UTC**, which is **6:00 AM Eastern during daylight saving time and 5:00 AM Eastern during standard time**. If sending fails, the app tries again at 11:00 and 12:00 UTC. It does not send another copy after a successful acceptance that day. It runs when the app is closed. Scheduled functions operate only on the published production deployment.

After publishing, use Netlify's Functions screen to run `daily-backup` once. Check the app's daily-backup status and confirm that the JSON attachment reached your inbox (or junk folder). An accepted email is not proof of inbox delivery; check Resend's delivery log if needed.

## Enter an address

1. Open the live address and enter the password.
2. Search for the pole number or choose a street using the top street field.
3. Select **Enter address** beside the correct pole.
4. Enter the nearest house number.
5. Start typing the street and choose the matching name.
6. Check visual verification only after checking the actual location.
7. Select **Save Address** and wait for the saved confirmation.

Entries refresh every minute when no editing window is open, or immediately with **Refresh**. An internet connection is required to save. If saving fails, the editing window keeps your text so you can retry. If your session expires, sign in in a second tab and return to retry the unsaved entry.

The street names match the Borough register, which omits many suffixes. For example the consistent stored address is `600 Chestnut, Dupont, PA 18641`. The utility's original spelling is kept separately. `Street_Register.json` lists the names and sources. The register preserves names such as `Champman` as supplied; review any register corrections centrally before republishing. New roads added after the source documents need to be added to the shared street list and the page together.

## Existing work, backups and restores

Existing addresses saved inside an old local HTML file are not automatically moved online. Open that old file on the device that holds the entries, choose **Backup JSON**, then use **Import JSON** in this online app.

Import merges compatible entries; matching pole entries are replaced and poles absent from the file are unchanged. Before importing, the app downloads a backup of the current shared records. Old free-text addresses are matched to the standard street names where possible. Entries that cannot be matched are skipped and identified for manual entry. Importing does not silently discard or guess those addresses. Keep the original backup.

**Backup & Reset** clears the shared address entries for everyone after starting a backup download and asking you to confirm it is saved. Do not use it during someone else's editing session. Imports and resets apply one pole at a time; if interrupted, the app reports the number processed and you can refresh before retrying.

Each pole saves independently, so people working on different poles do not overwrite each other. If two people edit the same pole, the last completed save wins. Coordinate which streets people are working on. This is a shared-password app, with no individual user accounts or individual editor audit trail.

## Technical handoff

- Public login: `public/index.html`; authenticated page: `private/app.html`.
- Functions are in `netlify/functions`; Blobs holds one object per pole with strong reads.
- Production storage persists across deployments; previews use separate deploy-scoped storage.
- Daily snapshots are retained in the `backups/` prefix. They are not automatically deleted.
- JSON contains the original poles and the current edits and can be imported by this app.
- Build: `npm run build`. Automated checks: `npm test`.
- Tested locally: TypeScript compile; original count and unique pole IDs; address validation; login denial, origin checks, session tampering; unauthorized page/API access; email attachment encoding and error handling; DOM interaction simulation of editing and failed-save retention. Full browser visual testing was unavailable in this environment. Live Netlify storage, live delivery and the scheduled production job still require the post-deployment check above.
- The requested shared-password flow is custom server authentication, not Netlify Identity individual accounts.

Documentation: https://docs.netlify.com/build/functions/api/ and https://resend.com/docs/api-reference/emails/send-email
Street reference: https://gis.penndot.gov/BPR_pdf_files/Maps/Type5/40406.pdf (map revision December 30, 2024), plus the supplied Borough DBMS V10.7 register and light-pole source.
