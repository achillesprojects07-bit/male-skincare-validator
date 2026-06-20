# SKIN INTEL V1.5 LIVE

## Files
- Rename `index_skin_intel_v1_5.html` to `index.html`
- Replace your full Apps Script backend with `api_skin_intel_v1_5.gs`

## Main changes
- Uses the V1.5 Skin Intel question set from the uploaded prompt.
- Shows: "SKIN INTEL — Takes about 3 minutes. No wrong answers."
- Adds Q12A as the primary product concept intent question.
- Skips Q4 automatically if Q3 = "I do not have any skin concerns."
- Updates Q6 brand list.
- Uses Q7 placeholder card instead of fixed brand artwork.
- Removes respondent-visible scoring.
- Backend dashboard now weights Q12A and Q20 as primary intent indicators.
- Google Sheets dashboard includes product opportunity, specific product intent, product ideas, skin concerns, trust drivers, purchase channels, barriers, and messages.

## Deploy
Apps Script:
1. Replace full `api.gs` with `api_skin_intel_v1_5.gs`.
2. Save.
3. Deploy > Manage deployments > Edit pencil > New version.
4. Execute as: Me.
5. Access: Anyone.

GitHub:
1. Rename `index_skin_intel_v1_5.html` to `index.html`.
2. Upload/replace `index.html` in GitHub.
3. Commit.
4. Hard refresh the live link.

## Rebuild dashboard manually
Open:
`YOUR_WEB_APP_URL?action=rebuildDashboard&pin=2468`
