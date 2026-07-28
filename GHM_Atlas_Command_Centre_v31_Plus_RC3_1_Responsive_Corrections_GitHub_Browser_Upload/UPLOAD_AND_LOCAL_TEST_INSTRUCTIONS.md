# Upload and local browser test

## Local check before upload

From Terminal:

```bash
cd "$HOME/Downloads/GHM_Atlas_Command_Centre_v31_Plus_RC3_1_Responsive_Corrections_GitHub_Browser_Upload"
python3 -m http.server 8000
```

Open:

`http://127.0.0.1:8000/index.html#overview`

Stop the server with Control+C.

## GitHub Pages

1. Upload this complete folder to the repository.
2. In **Settings → Pages**, publish from the required branch and `/(root)`.
3. Wait for the Pages deployment to finish.
4. Open the URL using the exact folder name:

`https://<account>.github.io/<repository>/GHM_Atlas_Command_Centre_v31_Plus_RC3_1_Responsive_Corrections_GitHub_Browser_Upload/index.html#overview`
