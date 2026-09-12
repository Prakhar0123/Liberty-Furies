## Setup & Deployment Instructions:

**1. Google Sheets Setup**
- Create a new Google Sheet named Jobs.
- In the first row (Header), add the following exact column titles from column A to I: id, date, role, company, sector, experience, pay, description, link

**2. Google Apps Script Backend**
- In your Google Sheet, click on Extensions > Apps Script.
- Replace the default code with the contents of code.gs.
- Save the project and click Deploy > New deployment.
- Select type Web app.
- Set configuration:
  - Execute as: Me
  - Who has access: Anyone
- Authorize the script when prompted and copy the generated Web App URL.

**3. Frontend Configuration**
Open script.js & replace the placeholder URL in the WEB_APP_URL constant with your deployed Google Apps Script Web App URL:
