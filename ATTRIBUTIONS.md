# Attributions

This project includes and depends on open source libraries installed through npm. Each library remains under its own license.

| Library | Purpose | Version tested | License |
| --- | --- | --- | --- |
| `diff` | Word-level diff generation through `diffWordsWithSpace`. | 5.2.2 | BSD-3-Clause |
| `express` | Local Node web server and static file hosting. | 4.22.2 | MIT |
| `multer` | Multipart upload handling for selected files. | 2.1.1 | MIT |
| `cheerio` | HTML parsing and text extraction. | 1.2.0 | MIT |
| `mammoth` | Raw text extraction from `.docx` files. | 1.12.0 | BSD-2-Clause |
| `pdf-parse` | Text extraction from `.pdf` files. | 1.1.4 | MIT |

Dependency versions may resolve to newer compatible releases when `npm install` is run because `package.json` uses semver ranges. The tested versions above are from the local development install used to validate the app.

## Notes

- No source code from these libraries is copied into this repository.
- Runtime dependencies are installed into `node_modules`, which is intentionally ignored by Git.
- See each package's npm page or repository for full license text and upstream copyright notices.
