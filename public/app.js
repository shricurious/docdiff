const leftFile = document.querySelector("#leftFile");
const rightFile = document.querySelector("#rightFile");
const leftName = document.querySelector("#leftName");
const rightName = document.querySelector("#rightName");
const compareButton = document.querySelector("#compareButton");
const statusBox = document.querySelector("#status");
const diffOutput = document.querySelector("#diffOutput");
const addedCount = document.querySelector("#addedCount");
const removedCount = document.querySelector("#removedCount");
const sameCount = document.querySelector("#sameCount");
const inlineMode = document.querySelector("#inlineMode");
const sideBySideMode = document.querySelector("#sideBySideMode");
const allLinesMode = document.querySelector("#allLinesMode");

let currentParts = [];
let currentMode = "inline";

leftFile.addEventListener("change", () => updateFileName(leftFile, leftName));
rightFile.addEventListener("change", () => updateFileName(rightFile, rightName));
compareButton.addEventListener("click", compareFiles);
inlineMode.addEventListener("click", () => setMode("inline"));
sideBySideMode.addEventListener("click", () => setMode("side-by-side"));
allLinesMode.addEventListener("click", () => setMode("all-lines"));

function updateFileName(input, target) {
  const file = input.files[0];
  target.textContent = file ? `${file.name} (${formatBytes(file.size)})` : "Choose a file";
}

async function compareFiles() {
  const left = leftFile.files[0];
  const right = rightFile.files[0];

  if (!left || !right) {
    setStatus("Choose two files before comparing.", true);
    return;
  }

  const body = new FormData();
  body.append("left", left);
  body.append("right", right);

  setBusy(true);
  setStatus("Reading files and building word-level diff...");
  currentParts = [];
  diffOutput.innerHTML = "";

  try {
    const response = await fetch("/api/diff", {
      method: "POST",
      body
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Could not compare those files.");
    }

    renderSummary(result.summary);
    currentParts = result.parts;
    renderDiff();
    setStatus(`${result.files.left.name} compared with ${result.files.right.name}.`);
  } catch (error) {
    renderSummary({ added: 0, removed: 0, unchanged: 0 });
    currentParts = [];
    diffOutput.innerHTML = "";
    setStatus(error.message, true);
  } finally {
    setBusy(false);
  }
}

function renderSummary(summary) {
  addedCount.textContent = summary.added.toLocaleString();
  removedCount.textContent = summary.removed.toLocaleString();
  sameCount.textContent = summary.unchanged.toLocaleString();
}

function setMode(mode) {
  currentMode = mode;
  inlineMode.classList.toggle("active", mode === "inline");
  sideBySideMode.classList.toggle("active", mode === "side-by-side");
  allLinesMode.classList.toggle("active", mode === "all-lines");
  renderDiff();
}

function renderDiff() {
  diffOutput.innerHTML = "";
  diffOutput.classList.toggle("side-by-side", currentMode === "side-by-side");
  diffOutput.classList.toggle("all-lines", currentMode === "all-lines");

  if (currentMode === "side-by-side") {
    renderSideBySideDiff(currentParts);
    return;
  }

  if (currentMode === "all-lines") {
    renderAllLinesDiff(currentParts);
    return;
  }

  renderInlineDiff(currentParts);
}

function renderInlineDiff(parts) {
  const fragment = document.createDocumentFragment();

  for (const part of parts) {
    const span = document.createElement("span");
    span.textContent = part.value;
    if (part.added) {
      span.className = "added";
    } else if (part.removed) {
      span.className = "removed";
    }
    fragment.appendChild(span);
  }

  diffOutput.appendChild(fragment);
}

function renderSideBySideDiff(parts) {
  const table = document.createElement("div");
  table.className = "side-table";

  appendSideHeader(table, "Original", "Changed");

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];

    if (part.removed && parts[index + 1]?.added) {
      appendSideRow(table, part.value, parts[index + 1].value, "removed", "added");
      index += 1;
    } else if (part.added) {
      appendSideRow(table, "", part.value, "", "added");
    } else if (part.removed) {
      appendSideRow(table, part.value, "", "removed", "");
    } else {
      appendSideRow(table, part.value, part.value, "unchanged", "unchanged");
    }
  }

  diffOutput.appendChild(table);
}

function renderAllLinesDiff(parts) {
  const table = document.createElement("div");
  table.className = "all-lines-table";

  appendSideHeader(table, "Original", "Changed");

  const leftCell = document.createElement("div");
  const rightCell = document.createElement("div");
  leftCell.className = "full-text-cell";
  rightCell.className = "full-text-cell";

  for (const part of parts) {
    if (part.removed) {
      leftCell.appendChild(createDiffSpan(part.value, "removed"));
    } else if (part.added) {
      rightCell.appendChild(createDiffSpan(part.value, "added"));
    } else {
      leftCell.appendChild(createDiffSpan(part.value, ""));
      rightCell.appendChild(createDiffSpan(part.value, ""));
    }
  }

  table.append(leftCell, rightCell);
  diffOutput.appendChild(table);
}

function createDiffSpan(text, className) {
  const span = document.createElement("span");
  span.textContent = text;
  if (className) {
    span.className = className;
  }
  return span;
}

function appendSideHeader(table, left, right) {
  const leftCell = document.createElement("div");
  const rightCell = document.createElement("div");
  leftCell.className = "side-heading";
  rightCell.className = "side-heading";
  leftCell.textContent = left;
  rightCell.textContent = right;
  table.append(leftCell, rightCell);
}

function appendSideRow(table, leftText, rightText, leftClass, rightClass) {
  table.append(
    createSideCell(leftText, leftClass),
    createSideCell(rightText, rightClass)
  );
}

function createSideCell(text, className) {
  const cell = document.createElement("div");
  cell.className = `side-cell ${className}`.trim();
  cell.textContent = text || " ";
  return cell;
}

function setBusy(isBusy) {
  compareButton.disabled = isBusy;
  compareButton.textContent = isBusy ? "Comparing..." : "Compare";
}

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle("error", isError);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
