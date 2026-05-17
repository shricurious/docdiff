# Word HTML Diff

Pick two local files and compare their extracted text with word-level highlighting. The app runs as a small Node/Express web server because PDFs, DOCX files, and uploads need server-side parsing.

## Features

- Inline word-level diff.
- Side-by-side diff chunks.
- Full-document side-by-side mode where all lines stay visible and changed words are colored.
- Local file upload flow. Files are read in memory and are not saved to disk by the app.

## Supported inputs

- HTML: `.html`, `.htm`
- Text-like files: `.txt`, `.md`, `.csv`, `.srt`, and other UTF-8 text files
- PDF: `.pdf`
- Word: `.docx`

Legacy `.doc` files are not supported. Save them as `.docx` first.

## Run

```powershell
npm.cmd install
npm.cmd start
```

Then open `http://localhost:3517`.

You can also double-click `start-app.bat` on Windows.

## Deployment

This project will not run on GitHub Pages as-is because GitHub Pages only hosts static files. Deploy it to a Node-capable service such as Render, Railway, Fly.io, Azure App Service, or a VPS.

## Libraries

This project uses open source libraries for the web server, uploads, document extraction, HTML parsing, and word-level diffing. See `ATTRIBUTIONS.md` for license and attribution details.
