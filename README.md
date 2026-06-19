# Male Skincare Rebrand Validator — V1.0

A mobile-first survey and analytics app for validating a Filipino male skincare rebrand. Collects 20-question validation responses and automatically computes rebrand receptivity, product trial intent, pricing sensitivity, channel preference, trust drivers, and messaging resonance scores.

---

## File List

| File | Description |
|------|-------------|
| `index.html` | Complete frontend — survey app + admin analytics dashboard |
| `api.gs` | Google Apps Script backend — handles submissions and analytics |
| `README.md` | This file |

---

## 1. Google Sheet Setup

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it something like **Male Skincare Rebrand Validator**.
3. Copy the Sheet URL from your browser — you'll need it later for the SETTINGS tab.
4. The Apps Script backend will **automatically create** the three required tabs on first run:
   - `RESPONSES` — one row per survey submission, 43 columns
   - `ANALYTICS_CACHE` — reserved for future use
   - `SETTINGS` — stores admin PIN, sheet link, and app version

You do not need to create columns manually.

---

## 2. Apps Script Setup

1. Inside your Google Sheet, click **Extensions → Apps Script**.
2. Delete any default code in the editor.
3. Paste the entire contents of `api.gs` into the editor.
4. Click **Save** (Ctrl+S or ⌘+S). Name the project anything you like (e.g. `Skincare Validator API`).

---

## 3. Deploy the Web App — CRITICAL SETTINGS

This step is the most important. Wrong settings will silently break survey submissions.

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to "Type" and select **Web app**.
3. Set the following — **both settings are required**:
   - **Execute as:** `Me` (your Google account)
   - **Who has access:** `Anyone` ← **NOT** "Anyone with Google Account"
4. Click **Deploy**.
5. Copy the **Web App URL** — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

> **Why this matters:** The survey uses a `no-cors` POST to bypass browser CORS restrictions. If access is set to "Anyone with Google Account," the request will be blocked by a Google login redirect, and responses will never reach the Sheet.

---

## 4. Paste the Web App URL into index.html

Open `index.html` in a text editor and find this line near the top of the `<script>` section:

```javascript
const API_URL = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
```

Replace the placeholder with your actual Web App URL:

```javascript
const API_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
```

Save the file. The yellow setup warning banner will disappear once the URL is set.

---

## 5. Publish on GitHub Pages

1. Create a new GitHub repository (e.g. `skincare-rebrand-validator`).
2. Upload `index.html` to the repository root.
3. Go to **Settings → Pages**.
4. Under "Source," select **Deploy from a branch** → branch: `main` → folder: `/ (root)`.
5. Click Save. GitHub will give you a URL like `https://yourusername.github.io/skincare-rebrand-validator/`.
6. Share this URL with respondents.

---

## 6. Admin Dashboard Access

1. Open the survey URL in any browser.
2. Scroll to the bottom and click **Admin** in the footer.
3. Enter PIN: **`2468`** (default).
4. The dashboard loads analytics via JSONP from your Apps Script backend.

---

## 7. Changing the Admin PIN

**No code change required.** To update the PIN:

1. Open your Google Sheet.
2. Click the **SETTINGS** tab.
3. Find the row where column A = `adminPin`.
4. Change the value in column B to your new PIN.
5. The next admin login will use the new PIN automatically.

> Note: The PIN is also stored client-side in `index.html` as `const ADMIN_PIN = '2468'`. Update that value too so the frontend sends the correct PIN with analytics requests. This is not enterprise-grade security — for MVP research purposes only.

---

## 8. Updating Survey Brand Names (Q6)

In `index.html`, find the Q6 section and update the brand option:

```html
<div class="chk-btn" data-key="q6_brandAwareness" data-value="[Rebranded Brand]" ...>[Rebranded Brand]</div>
```

Change `[Rebranded Brand]` (both in `data-value` and the visible label) to your actual brand name.

---

## 9. Replacing the Logo Placeholder (Q7)

Find this block in `index.html` inside the Q7 section:

```html
<div class="placeholder-card">
  <div class="ph-title">[Place rebranded logo or brand image here]</div>
  ...
</div>
```

Replace the placeholder card with an `<img>` tag pointing to your logo:

```html
<img src="your-logo.png" alt="Brand Logo" style="max-width:100%;border-radius:8px;"/>
```

Upload the image to the same GitHub repository and reference it by filename.

---

## 10. Replacing Packaging Image Placeholders (Q8)

Find the `pkg-pair` div in the Q8 section. Replace the two placeholder cards with actual images:

```html
<div class="pkg-pair">
  <img src="packaging-a.jpg" alt="Packaging A" style="width:100%;border-radius:8px;"/>
  <img src="packaging-b.jpg" alt="Packaging B" style="width:100%;border-radius:8px;"/>
</div>
```

---

## 11. Updating the Positioning Statement (Q9)

Find this text inside Q9:

```
"Daily skincare for men who want to look clean, confident, and ready — without a complicated routine."
```

Replace it with your actual brand positioning statement.

---

## 12. UTM Tracking — Channel Attribution

Build shareable survey links with UTM parameters to track where responses come from:

| Channel | Example Link |
|---------|-------------|
| TikTok | `https://yoursite.github.io/validator/?utm_source=tiktok&utm_medium=video&utm_campaign=rebrand` |
| Barbershop QR | `https://yoursite.github.io/validator/?utm_source=barbershop-qr&utm_medium=print&utm_campaign=rebrand` |
| Email | `https://yoursite.github.io/validator/?utm_source=email&utm_medium=newsletter&utm_campaign=rebrand` |
| Direct | No parameters needed — stored as `direct` |

The admin dashboard shows a **UTM Source Breakdown** table so you can see which channels drove the most responses.

---

## 13. Exporting Raw Data

1. Open your Google Sheet directly.
2. All responses are in the `RESPONSES` tab — one row per submission.
3. To enable a quick-export link in the admin dashboard:
   - Copy your Google Sheet URL.
   - Open the SETTINGS tab in the Sheet.
   - Find the row where column A = `sheetLink`.
   - Paste the Sheet URL into column B.
   - The admin dashboard will now show a direct link to the Sheet.

---

## 14. Troubleshooting

### Responses not saving to the Sheet

Most common cause: **wrong deployment settings**.

- Go to Apps Script → Deploy → Manage deployments.
- Confirm "Who has access" is **Anyone** (not "Anyone with Google Account").
- If you changed any settings, create a **new deployment** — editing an existing one sometimes doesn't take effect.
- Re-copy the new Web App URL and update `index.html`.

### Admin dashboard shows "Could not load analytics"

- Confirm the API URL in `index.html` is correct and not the placeholder.
- Confirm the PIN in `index.html` (`const ADMIN_PIN`) matches the PIN in the SETTINGS sheet.
- Open the Web App URL directly in a browser with `?action=ping` appended — it should return `{"ok":true}`.

### CORS errors in browser console

This is **expected and normal**. The `no-cors` POST submission intentionally produces an opaque response. You will see something like `TypeError: Failed to fetch` or a CORS warning — this does not mean the submission failed. Open your Sheet to verify rows are being written.

### Survey data not persisting when navigating sections

The app saves answers to `localStorage` on every selection. If a user is in private/incognito mode, localStorage may be disabled. The survey still works but the resume prompt will not appear.

### Re-deploying after code changes

After editing `api.gs`, always create a **new deployment** (not "edit existing"). Then update the URL in `index.html` and push to GitHub Pages.

---

## Changelog

### V1.0
- Built 20-question Filipino male skincare rebrand validation survey
- Google Sheets response storage via Apps Script with LockService for safe concurrent writes
- Six computed scores: Skincare Readiness, Brand Relevance, Trial Intent, Price Acceptance, Channel Fit, Rebrand Validation
- Admin analytics dashboard with KPI cards, 13 distribution charts, and open-ended response panels
- Twelve segment tags (Current Skincare User, High-Intent Trial User, Rebrand Supporter, etc.)
- Brand awareness chart (Q6) for competitive recall analysis
- UTM source tracking for channel attribution (TikTok, barbershop QR, email, direct)
- Respondent age range and location fields for cross-tabulation
- Q15 collision-prevention ranking dropdowns — real-time exclusion logic
- Q20 weighted 2× as highest-intent predictor in all trial scoring
- localStorage persistence with resume prompt on return visit
- JSONP analytics fetch pattern for cross-origin compatibility
- no-cors POST submission with 2500ms graceful UX + thank-you screen
- Mobile-first design with 48px tap targets
- PIN-protected admin dashboard (PIN stored in SETTINGS sheet — no code change required)
- Backend score recomputation with mismatch logging
- Demo mode with sample data when API URL is not yet configured
- Setup warning banner if API URL is placeholder
