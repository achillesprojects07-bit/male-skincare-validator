# SKIN CHECK V1.4 LIVE

## What changed

This build changes SKIN CHECK from an SPF-led validation survey into a true men's skincare product opportunity survey.

### Respondent app
- SPF is now one product option, not the center of the survey.
- Product opportunity questions now compare facial wash, moisturizer, all-in-one serum, dark spot/acne mark care, oil control, SPF, eye/tired-face, and shaving irritation care.
- Respondent score preview has been removed. Scores are internal analytics only.
- Q7 image remains: `house-of-adonis-q7.png`.
- Start Over clears local storage and resets the app.
- Q13, Q17, Q18, and Q21 are multi-select "choose up to 3" questions.

### Apps Script backend
- New Google Sheets tabs:
  - `RESPONSES`
  - `ANALYTICS_DATA`
  - `DASHBOARD`
  - `OPEN_ENDS`
  - `SEGMENTS`
  - `SETTINGS`
- Dashboard is rebuilt after every response and whenever admin analytics is loaded.
- Old rebrand analytics labels are replaced by product-opportunity analytics.
- The backend appends missing columns to existing response sheets so previous data is not deleted.

## Upload files

Upload these to GitHub:
- Rename `index_skin_check_v1_4.html` to `index.html`
- Keep `house-of-adonis-q7.png` in the same folder
- Keep `skin-check-preview.png` in the same folder

Update Apps Script:
- Replace the full Apps Script backend with `api_skin_check_v1_4.gs`
- Save
- Deploy > Manage deployments > Edit pencil > New version
- Keep the same Web App URL
- Access: Anyone
- Execute as: Me

## Rebuild Google Sheets dashboard manually

Open this URL after updating Apps Script:

`YOUR_WEB_APP_URL?action=rebuildDashboard&pin=2468`

The app is already configured with the current Apps Script URL.
