# Upload and local-test instructions — RC3.2

## Upload through GitHub

1. Open the target repository and exact destination folder.
2. Choose **Add file → Upload files**.
3. Upload the contents of `GHM_Atlas_Command_Centre_v31_Plus_RC3_2_Final_Corrections_GitHub_Browser_Upload`.
4. Commit the upload to the publishing branch.
5. Confirm **Settings → Pages** publishes from that branch and `/(root)`.
6. Wait for the deployment to complete, then open the exact folder URL ending in `index.html#overview`.

## Test this browser package locally

From Terminal:

```bash
cd ~/Downloads/GHM_Atlas_Command_Centre_v31_Plus_RC3_2_Final_Corrections_GitHub_Browser_Upload
python3 -m http.server 8000
open -a "Google Chrome" "http://127.0.0.1:8000/index.html#overview"
```

Keep Terminal open while testing. Press **Control+C** to stop the server.

This browser package contains snapshot data. It has no live Google Sheets connection.
