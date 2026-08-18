const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------------------
// In-memory data store.
// Each "session" represents one exam client (a node in the distributed
// proctoring network) reporting events back to this backend. No database is
// wired up yet -- see the project report for the reasoning.
// ---------------------------------------------------------------------------
const sessions = new Map(); // sessionId -> session record
const alerts = [];          // flat, most-recent-first feed across every session

const EVENT_WEIGHTS = {
  "Face Missing": 15,
  "Multiple Faces": 25,
  "Tab Switch": 10,
  "No Face Timeout": 20
};

const RISK_FLAG_THRESHOLD = 60;
const AUTO_SUBMIT_THRESHOLD = 100;

function newId() {
  return crypto.randomBytes(4).toString("hex");
}

function serializeSession(s) {
  return {
    sessionId: s.sessionId,
    student: s.student,
    startedAt: s.startedAt,
    status: s.status,
    riskScore: s.riskScore,
    eventCount: s.events.length,
    lastEvent: s.events[0] || null
  };
}

// ---- Health ----------------------------------------------------------------
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    uptimeSeconds: Math.floor(process.uptime()),
    activeSessions: Array.from(sessions.values()).filter(s => s.status === "in_progress").length
  });
});

// ---- Session lifecycle -------------------------------------------------------
app.post("/api/session/start", (req, res) => {
  const { student } = req.body || {};
  if (!student || !student.trim()) {
    return res.status(400).json({ success: false, message: "Student name is required" });
  }

  const sessionId = newId();
  sessions.set(sessionId, {
    sessionId,
    student: student.trim(),
    startedAt: new Date().toISOString(),
    status: "in_progress",
    riskScore: 0,
    events: []
  });

  res.json({ success: true, sessionId, student: student.trim() });
});

app.post("/api/session/submit", (req, res) => {
  const { sessionId } = req.body || {};
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ success: false, message: "Unknown session" });

  if (session.status === "in_progress") session.status = "submitted";
  res.json({ success: true, status: session.status });
});

// ---- Proctoring events -------------------------------------------------------
app.post("/api/event", (req, res) => {
  const { sessionId, event } = req.body || {};
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ success: false, message: "Unknown or expired session" });
  }
  if (session.status !== "in_progress") {
    return res.status(409).json({ success: false, message: "Session has already ended" });
  }

  const weight = EVENT_WEIGHTS[event] ?? 10;
  session.riskScore = Math.min(100, session.riskScore + weight);

  const alert = {
    id: newId(),
    sessionId,
    student: session.student,
    event,
    severity: weight >= 20 ? "high" : weight >= 12 ? "medium" : "low",
    time: new Date().toLocaleTimeString(),
    timestamp: Date.now()
  };

  session.events.unshift(alert);
  alerts.unshift(alert);

  let autoSubmitted = false;
  if (session.riskScore >= AUTO_SUBMIT_THRESHOLD) {
    session.status = "auto_submitted";
    autoSubmitted = true;
  }

  res.json({
    success: true,
    message: `${event} logged`,
    riskScore: session.riskScore,
    flagged: session.riskScore >= RISK_FLAG_THRESHOLD,
    autoSubmitted
  });
});

// ---- Faculty console reads ----------------------------------------------------
app.get("/api/alerts", (req, res) => {
  res.json(alerts.slice(0, 100));
});

app.get("/api/sessions", (req, res) => {
  const list = Array.from(sessions.values())
    .sort((a, b) => b.riskScore - a.riskScore)
    .map(serializeSession);
  res.json(list);
});

app.get("/api/stats", (req, res) => {
  const all = Array.from(sessions.values());
  res.json({
    totalSessions: all.length,
    active: all.filter(s => s.status === "in_progress").length,
    flagged: all.filter(s => s.riskScore >= RISK_FLAG_THRESHOLD).length,
    autoSubmitted: all.filter(s => s.status === "auto_submitted").length,
    totalAlerts: alerts.length
  });
});

app.listen(PORT, () => {
  console.log(`Proctoring platform backend running on port ${PORT}`);
});
