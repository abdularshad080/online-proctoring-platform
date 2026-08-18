// Student exam-room client.
// Owns: session bootstrap, exam timer, proctoring signal simulator.

const EXAM_SECONDS = 20 * 60; // 20 minute demo exam

const gatePanel = document.getElementById("gatePanel");
const examPanel = document.getElementById("examPanel");
const submittedPanel = document.getElementById("submittedPanel");

const gateForm = document.getElementById("gateForm");
const studentNameInput = document.getElementById("studentName");

const nodeId = document.getElementById("nodeId");
const studentLabel = document.getElementById("studentLabel");
const sessionLabel = document.getElementById("sessionLabel");
const recDot = document.getElementById("recDot");
const monitorLabel = document.getElementById("monitorLabel");
const timerEl = document.getElementById("timer");
const statusPill = document.getElementById("statusPill");
const toast = document.getElementById("toast");
const submitBtn = document.getElementById("submitBtn");

let sessionId = null;
let secondsLeft = EXAM_SECONDS;
let timerHandle = null;

function showToast(message, severity) {
  toast.textContent = message;
  toast.hidden = false;
  toast.className = `toast ${severity}`;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.hidden = true; }, 3200);
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function tickTimer() {
  secondsLeft -= 1;
  timerEl.textContent = formatTime(Math.max(secondsLeft, 0));

  timerEl.classList.remove("warn", "critical");
  if (secondsLeft <= 60) timerEl.classList.add("critical");
  else if (secondsLeft <= 300) timerEl.classList.add("warn");

  if (secondsLeft <= 0) {
    clearInterval(timerHandle);
    submitExam(true);
  }
}

function flashRecDot() {
  recDot.classList.add("active");
  monitorLabel.textContent = "SIGNAL FLAGGED";
  monitorLabel.classList.add("active");
  setTimeout(() => {
    recDot.classList.remove("active");
    monitorLabel.textContent = "MONITORING";
    monitorLabel.classList.remove("active");
  }, 1400);
}

async function startSession(name) {
  const res = await fetch("/api/session/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student: name })
  });
  const data = await res.json();
  if (!data.success) {
    alert(data.message || "Could not start session");
    return;
  }

  sessionId = data.sessionId;
  sessionStorage.setItem("proctorgrid_sessionId", sessionId);
  sessionStorage.setItem("proctorgrid_student", data.student);

  studentLabel.textContent = data.student;
  sessionLabel.textContent = sessionId;
  nodeId.textContent = `NODE — ${sessionId}`;

  gatePanel.hidden = true;
  examPanel.hidden = false;
  monitorLabel.textContent = "MONITORING";
  statusPill.textContent = "Status: Exam in progress";

  timerEl.textContent = formatTime(secondsLeft);
  timerHandle = setInterval(tickTimer, 1000);
}

async function sendEvent(eventName) {
  if (!sessionId) return;

  flashRecDot();

  const res = await fetch("/api/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, event: eventName })
  });

  if (res.status === 404 || res.status === 409) {
    const data = await res.json();
    showToast(data.message, "high");
    return;
  }

  const data = await res.json();
  const severity = data.riskScore >= 60 ? "high" : data.riskScore >= 30 ? "medium" : "low";
  showToast(`${eventName} — risk score now ${data.riskScore}`, severity);

  if (data.autoSubmitted) {
    clearInterval(timerHandle);
    finishExam("Auto-submitted", "Your exam was auto-submitted after repeated integrity violations.");
  }
}

async function submitExam(timedOut = false) {
  if (!sessionId) return;
  clearInterval(timerHandle);

  await fetch("/api/session/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId })
  });

  finishExam(
    timedOut ? "Time expired" : "Session Closed",
    timedOut
      ? "Your time ran out and the exam was submitted automatically."
      : "Your responses and integrity log have been recorded."
  );
}

function finishExam(eyebrow, sub) {
  examPanel.hidden = true;
  submittedPanel.hidden = false;
  document.getElementById("submittedEyebrow").textContent = eyebrow;
  document.getElementById("submittedSub").textContent = sub;
}

gateForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = studentNameInput.value.trim();
  if (!name) return;
  startSession(name);
});

document.querySelectorAll(".sim-btn").forEach((btn) => {
  btn.addEventListener("click", () => sendEvent(btn.dataset.event));
});

submitBtn.addEventListener("click", () => submitExam(false));
