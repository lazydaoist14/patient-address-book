# Patient Address Book — Google Sheets setup

The production version uses **Google Sheets + Google Apps Script**:

**Browser UI → Apps Script → private Google Sheet**

### Search speed
The app loads the patient list once when it opens. Name and phone searching then happens entirely in the browser, so typing in the search box does not make a network request for every character. Saves and deletes are sent to Apps Script and the in-memory list is refreshed after the operation.

The Apps Script backend uses batched spreadsheet reads, Cache Service, and Script Lock to reduce repeated spreadsheet calls and protect concurrent writes. Google recommends minimizing service calls, batching reads/writes, and using Cache Service for performance.

### Setup
1. Create a **private** Google Sheet named `Patient Address Book Data`.
2. Open **Extensions → Apps Script**.
3. Replace `Code.gs` with `google-apps-script/Code.gs` from this repository.
4. Add an HTML file named `Index`.
5. Copy `google-apps-script/Index.html` into that file.
6. Save the project.
7. Select the `setup` function in the Apps Script editor and click **Run** once. Approve the Google authorization request.
8. Select **Deploy → New deployment → Web app**.
9. Set **Execute as: Me**.
10. Set **Who has access: Only myself**.
11. Deploy and open the generated web-app URL on your computer and phone while signed into the same Google account.

### Privacy
Keep the Google Sheet private. Do not deploy the web app anonymously for patient records. This is a personal/internal tool architecture; if it becomes a multi-user clinical system, we should add stronger authentication, audit logging, backups, and a healthcare-oriented database/security design.

### Official Google documentation
- Apps Script Web Apps: https://developers.google.com/apps-script/guides/web
- google.script.run: https://developers.google.com/apps-script/guides/html/communication
- Apps Script performance best practices: https://developers.google.com/apps-script/guides/support/best-practices