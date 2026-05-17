const express = require("express");
const multer = require("multer");
const cheerio = require("cheerio");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const { diffWordsWithSpace } = require("diff");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

const PORT = process.env.PORT || 3517;

app.use(express.static("public"));

app.post(
  "/api/diff",
  upload.fields([
    { name: "left", maxCount: 1 },
    { name: "right", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const leftFile = req.files?.left?.[0];
      const rightFile = req.files?.right?.[0];

      if (!leftFile || !rightFile) {
        return res.status(400).json({ error: "Please choose two files to compare." });
      }

      const [left, right] = await Promise.all([
        extractText(leftFile),
        extractText(rightFile)
      ]);

      const parts = diffWordsWithSpace(left.text, right.text);
      const summary = summarize(parts);

      res.json({
        files: {
          left: fileInfo(leftFile, left.kind),
          right: fileInfo(rightFile, right.kind)
        },
        summary,
        parts
      });
    } catch (error) {
      res.status(500).json({
        error: error.message || "Could not compare those files."
      });
    }
  }
);

async function extractText(file) {
  const extension = getExtension(file.originalname);
  const type = file.mimetype || "";

  if (extension === ".pdf" || type === "application/pdf") {
    const result = await pdfParse(file.buffer);
    return { kind: "PDF", text: normalizeText(result.text) };
  }

  if (
    extension === ".docx" ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return { kind: "Word", text: normalizeText(result.value) };
  }

  if (extension === ".html" || extension === ".htm" || type.includes("html")) {
    const source = file.buffer.toString("utf8");
    const $ = cheerio.load(source);
    $("script, style, noscript, svg").remove();
    return { kind: "HTML", text: normalizeText($("body").text() || $.root().text()) };
  }

  if (extension === ".doc") {
    throw new Error("Legacy .doc files are not supported yet. Please save as .docx and try again.");
  }

  return { kind: "Text", text: normalizeText(file.buffer.toString("utf8")) };
}

function normalizeText(value) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function summarize(parts) {
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const part of parts) {
    const words = part.value.match(/\S+/g)?.length || 0;
    if (part.added) {
      added += words;
    } else if (part.removed) {
      removed += words;
    } else {
      unchanged += words;
    }
  }

  return { added, removed, unchanged };
}

function fileInfo(file, kind) {
  return {
    name: file.originalname,
    kind,
    size: file.size
  };
}

function getExtension(filename) {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

const server = app.listen(PORT, () => {
  console.log(`WordHtmlDiff is running at http://localhost:${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Close the other server or run with a different port, for example: set PORT=3518 && npm.cmd start`
    );
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});
