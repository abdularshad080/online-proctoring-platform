// Faculty console client.
// Polls the backend every 2s for stats, sessions, and the alert feed.

const POLL_MS = 2000;

const serverStatus = document.getElementById("serverStatus");
const statTotal = document.getElementById("statTotal");
const statActive = document.getElementById("statActive");
const statFlagged = document.getElementById("statFlagged");
const statAuto = document.getElementById("statAuto");
const statAlerts = document.getElementById("statAlerts");
const studentsGrid = document.getElementById("studentsGrid");
const feedList = document.getElementById("feedList");
const feedCount = document.getElementById("feedCount");

function riskClass(score) {
  if (score >= 60) return "high";
  if (score >= 30) return "warn";
  return "ok";
}

function statusBadge(status) {
  if (status === "in_progress") return `<span class="badge badge-progress">In progress</span>`;
  if (status === "auto_submitted") return `<span class="badge badge-auto">Auto-submitted</span>`;
  return `<span class="badge badge-submitted">Submitted</span>`;
}

function renderStudents(sessions) {
  if (!sessions.length) {
    studentsGrid.innerHTML = `<p class="empty-state">No sessions yet. Start an exam from the student page to see it appear here in real time.</p>`;
    return;
  }

  studentsGrid.innerHTML = sessions.map((s) => {
    const flagged = s.riskScore >= 60;
    const last = s.lastEvent ? `Last signal: ${s.lastEvent.event} at ${s.lastEvent.time}` : "No signals reported yet";
    return `
      <div class="student-card ${flagged ? "flagged" : ""}">
        <div class="student-top">
          <div>
            <div class="student-name">${escapeHtml(s.student)}</div>
            <div class="student-session">SESSION ${s.sessionId}</div>
          </div>
          ${statusBadge(s.status)}
        </div>
        <div class="risk-row">
          <div class="risk-bar"><div class="risk-fill ${riskClass(s.riskScore)}" style="width:${s.riskScore}%"></div></div>
          <span class="risk-value">${s.riskScore}</span>
        </div>
        <div class="student-last">${escapeHtml(last)}</div>
      </div>
    `;
  }).join("");
}

function renderFeed(alerts) {
  feedCount.textContent = `${alerts.length} event${alerts.length === 1 ? "" : "s"}`;

  if (!alerts.length) {
    feedList.innerHTML = `<p class="empty-state">No alerts yet.</p>`;
    return;
  }

  feedList.innerHTML = alerts.map((a) => `
    <div class="feed-item">
      <span class="feed-sev ${a.severity}"></span>
      <span class="feed-text"><span class="feed-student">${escapeHtml(a.student)}</span> <span class="feed-event">— ${escapeHtml(a.event)}</span></span>
      <span class="feed-time">${a.time}</span>
    </div>
  `).join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function poll() {
  try {
    const [statusRes, statsRes, sessionsRes, alertsRes] = await Promise.all([
      fetch("/api/status"),
      fetch("/api/stats"),
      fetch("/api/sessions"),
      fetch("/api/alerts")
    ]);

    if (statusRes.ok) {
      const s = await statusRes.json();
      serverStatus.textContent = `BACKEND ONLINE · ${s.activeSessions} ACTIVE`;
    }

    if (statsRes.ok) {
      const stats = await statsRes.json();
      statTotal.textContent = stats.totalSessions;
      statActive.textContent = stats.active;
      statFlagged.textContent = stats.flagged;
      statAuto.textContent = stats.autoSubmitted;
      statAlerts.textContent = stats.totalAlerts;
    }

    if (sessionsRes.ok) renderStudents(await sessionsRes.json());
    if (alertsRes.ok) renderFeed(await alertsRes.json());
  } catch (err) {
    serverStatus.textContent = "BACKEND UNREACHABLE";
  }
}

poll();
setInterval(poll, POLL_MS);
