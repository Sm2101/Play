/* === NEOQUIZ — Futuristic CBT Engine === */

// DOM elements
const pdfInput = document.getElementById("pdfInput");
const jsonInput = document.getElementById("jsonInput");
const palette = document.getElementById("palette");
const qText = document.getElementById("questionText");
const optionsBox = document.getElementById("options");
const qIndex = document.getElementById("qIndex");
const globalTimerEl = document.getElementById("globalTimer");
const perTimerEl = document.getElementById("perTimer");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const perQtimeInput = document.getElementById("perQtime");
const shuffleQs = document.getElementById("shuffleQs");
const shuffleOpts = document.getElementById("shuffleOpts");

let questions = [];
let current = 0;
let globalTime = 0;
let perTime = 0;
let globalTimer;
let perTimer;

let answered = new Set();
let marked = new Set();
let flagged = new Set();
let selectedAnswers = {};

function initTimers() {
  clearInterval(globalTimer);
  globalTime = 0;
  globalTimer = setInterval(() => {
    globalTime++;
    globalTimerEl.textContent = formatTime(globalTime);
  }, 1000);
}

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// extract text from PDF
async function extractPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(t => t.str).join(" ") + "\n";
  }
  return text;
}

// parse MCQs
function parseMCQs(rawText) {
  let text = rawText.replace(/\s+/g, " ").replace(/Page\s*\d+/gi, "");
  const regex = /(\d+[\.\)]\s*[^(\d\.)]+?)\s*(?:\(a\)|a\))\s*(.+?)\s*(?:\(b\)|b\))\s*(.+?)\s*(?:\(c\)|c\))\s*(.+?)\s*(?:\(d\)|d\))\s*(.+?)(?=\d+[\.\)]|$)/gis;
  let matches = [...text.matchAll(regex)];
  return matches.map(m => ({
    question: clean(m[1]),
    options: [m[2], m[3], m[4], m[5]].map(clean)
  }));
}

function clean(t) {
  return t.replace(/\s+/g, " ").replace(/[^\w\s,.'’\-+/*=°]/g, "").trim();
}

// display question
function renderQuestion() {
  clearInterval(perTimer);
  perTime = parseInt(perQtimeInput.value) || 30;
  perTimerEl.textContent = `${perTime}s`;
  perTimer = setInterval(() => {
    perTime--;
    perTimerEl.textContent = `${perTime}s`;
    if (perTime <= 0) nextQ();
  }, 1000);

  const q = questions[current];
  qIndex.textContent = `Q${current + 1}`;
  qText.textContent = q.question;

  optionsBox.innerHTML = "";
  let opts = [...q.options];
  if (shuffleOpts.checked) opts.sort(() => Math.random() - 0.5);
  opts.forEach(opt => {
    const div = document.createElement("div");
    div.className = "option";
    div.textContent = opt;
    div.onclick = () => selectOption(opt);
    if (selectedAnswers[current] === opt) div.classList.add("selected");
    optionsBox.appendChild(div);
  });

  updatePalette();
  updateStats();
}

function selectOption(opt) {
  selectedAnswers[current] = opt;
  answered.add(current);
  marked.delete(current);
  updatePalette();
  renderQuestion();
}

function updatePalette() {
  palette.innerHTML = "";
  for (let i = 0; i < questions.length; i++) {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    if (answered.has(i)) btn.classList.add("answered");
    if (marked.has(i)) btn.classList.add("marked");
    if (flagged.has(i)) btn.classList.add("flagged");
    if (i === current) btn.style.outline = "2px solid var(--accent)";
    btn.onclick = () => {
      current = i;
      renderQuestion();
    };
    palette.appendChild(btn);
  }
  progressText.textContent = `${answered.size}/${questions.length}`;
  progressFill.style.width = `${(answered.size / questions.length) * 100}%`;
}

function updateStats() {
  document.getElementById("statAttempted").textContent = answered.size;
  document.getElementById("statMarked").textContent = marked.size;
  document.getElementById("statFlagged").textContent = flagged.size;
  document.getElementById("statUnattempted").textContent =
    questions.length - answered.size;
}

function nextQ() {
  if (current < questions.length - 1) {
    current++;
    renderQuestion();
  } else {
    alert("End of questions.");
  }
}

function prevQ() {
  if (current > 0) {
    current--;
    renderQuestion();
  }
}

function clearResponse() {
  delete selectedAnswers[current];
  answered.delete(current);
  updatePalette();
  renderQuestion();
}

function markReview() {
  marked.add(current);
  updatePalette();
}

function flagQuestion() {
  if (flagged.has(current)) flagged.delete(current);
  else flagged.add(current);
  updatePalette();
}

function submitExam() {
  clearInterval(globalTimer);
  clearInterval(perTimer);
  let score = answered.size; // simple placeholder scoring
  let total = questions.length;
  let time = formatTime(globalTime);
  alert(`✅ Exam Finished!\nAttempted: ${answered.size}/${total}\nTime: ${time}`);
}

// event listeners
document.getElementById("nextBtn").onclick = nextQ;
document.getElementById("prevBtn").onclick = prevQ;
document.getElementById("clearResp").onclick = clearResponse;
document.getElementById("markReview").onclick = markReview;
document.getElementById("flagBtn").onclick = flagQuestion;
document.getElementById("saveNext").onclick = nextQ;
document.getElementById("submitExam").onclick = submitExam;

document.getElementById("fullscreenBtn").onclick = () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
};

document.getElementById("resetBtn").onclick = () => {
  if (confirm("Reset all data?")) location.reload();
};

pdfInput.onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  qText.textContent = "⏳ Reading PDF...";
  const raw = await extractPDF(file);
  questions = parseMCQs(raw);
  if (shuffleQs.checked) questions.sort(() => Math.random() - 0.5);
  if (questions.length === 0) {
    qText.textContent = "❌ No questions found.";
    return;
  }
  current = 0;
  initTimers();
  renderQuestion();
};

jsonInput.onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  const txt = await file.text();
  try {
    questions = JSON.parse(txt);
  } catch {
    alert("Invalid JSON file!");
    return;
  }
  current = 0;
  initTimers();
  renderQuestion();
};

document.getElementById("exportBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(questions, null, 2)], {
    type: "application/json"
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "neoquiz_questions.json";
  a.click();
};

// keyboard shortcuts
document.addEventListener("keydown", e => {
  if (["1", "2", "3", "4"].includes(e.key)) {
    const idx = parseInt(e.key) - 1;
    const q = questions[current];
    if (q && q.options[idx]) selectOption(q.options[idx]);
  }
  if (e.key.toLowerCase() === "n") nextQ();
  if (e.key.toLowerCase() === "p") prevQ();
  if (e.key.toLowerCase() === "m") markReview();
  if (e.key.toLowerCase() === "f") flagQuestion();
  if (e.key.toLowerCase() === "s") nextQ();
});

// initial UI state
qText.textContent = "Upload a PDF to start your futuristic CBT session.";
