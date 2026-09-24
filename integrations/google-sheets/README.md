# Google Sheets integration

Every lead and every automatic grant check is written to a Google Sheet, so
the business has a working record outside the website.

`Code.gs` is an Apps Script that lives inside the spreadsheet. The website
POSTs JSON to it (`lib/sheets.ts`), and it writes rows and builds its own
tabs on first use:

| Tab | What's in it |
|---|---|
| Leads | One row per lead, newest first: contact details, location (county inferred from city), income vs. area median, credit band, matched programs, a Hot/Warm/Cold priority, and your own Status and Notes columns |
| Summary | Leads by state, callbacks by state, income tier, priority, source, and status |
| Daily | Leads, callback requests, and hot leads per day |
| Program Checks | Every check of a program's official page, newest first |

## Setup

1. Create a Google Sheet (any name).
2. **Extensions → Apps Script**. Delete the placeholder code, paste all of
   `Code.gs`, and **Save**.
3. **Deploy → New deployment**. Click the gear, choose **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. **Deploy**, then **Authorize access** and choose your Google account.
   Google warns that the app isn't verified because it's your own script:
   choose **Advanced → Go to (project) (unsafe) → Allow**.
5. Copy the **Web app URL** (ends in `/exec`) into Vercel as
   `GOOGLE_SHEETS_WEBHOOK_URL`, then redeploy.

Visiting the Web app URL in a browser shows "PocketGrants is connected to
this sheet." The tabs appear with the first lead.

**Updating the script later:** paste the new code, Save, then
**Deploy → Manage deployments → edit (pencil) → Version: New version →
Deploy**. Editing without a new version leaves the old code running.

## Notes

- Leads are written after the buyer's response is sent (`after()`), so a
  slow spreadsheet never delays the quiz. The lead email is still the
  record of last resort.
- Deliveries are idempotent by Lead ID.
- Text that starts with `=`, `+`, `-` or `@` is stored as text, so a
  submitted name can't run as a spreadsheet formula.
- The script never overwrites Status, Notes, or columns you add to the
  right of Lead ID.
