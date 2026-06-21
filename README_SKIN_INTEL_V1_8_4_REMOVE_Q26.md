# SKIN INTEL V1.8.4 — Remove Q26

Changes:
- Removed Q26 pre-order question from Section F.
- Survey now continues from Q25 directly to Q27.
- Removed pre-order scoring and pre-order dashboard/readout metrics from backend.
- Q7 choices remain fixed.
- Q7 image reference remains `adonis-q7-brand-identity.jpg`.

Files:
- Upload `index_skin_intel_v1_8_4_REMOVE_Q26.html` as `index.html` in GitHub.
- Replace Apps Script `Code.gs` with `api_skin_intel_v1_8_4_REMOVE_Q26.gs` or the copy-paste text file.
- Keep `adonis-q7-brand-identity.jpg` in GitHub.

After backend update:
Deploy → Manage deployments → Edit pencil → New version → Deploy

Test:
WEB_APP_URL?action=ping

Expected:
{"ok":true,"app":"SKIN INTEL","version":"V1.8.4 LIVE"}
