// src/pages/HealthReport.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Tooltip, Filler, Legend
} from "chart.js";
import { getWeeklyReport, refreshWeeklyReport } from "../api/reportApi";
import toast from "react-hot-toast";
import "./HealthReport.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler, Legend);

// ─── Helpers ────────────────────────────────────────────────────────────────
const scoreColor  = (s) => s >= 80 ? "#22c55e" : s >= 60 ? "#f59e0b" : s >= 40 ? "#fb923c" : "#ef4444";
const scoreLabel  = (s) => s >= 90 ? "Excellent" : s >= 75 ? "Great" : s >= 60 ? "Good" : s >= 45 ? "Fair" : "Needs Work";
const scoreGrade  = (s) => s >= 90 ? "A+" : s >= 80 ? "A" : s >= 70 ? "B+" : s >= 60 ? "B" : s >= 50 ? "C+" : "C";
const deltaColor  = (v) => v > 0 ? "#22c55e" : v < 0 ? "#ef4444" : "#94a3b8";
const deltaSign   = (v) => v > 0 ? `+${v}` : `${v}`;
const fmt         = (n, dec = 1) => Number(n ?? 0).toFixed(dec);
const round       = (n) => Math.round(n ?? 0).toLocaleString();

const formatDate  = (iso) => iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";

const priorityColor = (p) => p === "High" ? "#ef4444" : p === "Medium" ? "#f59e0b" : "#3b82f6";

const dimensionMeta = {
  fitness:   { label: "Fitness",   icon: "💪", color: "#22c55e" },
  hydration: { label: "Hydration", icon: "💧", color: "#3b82f6" },
  sleep:     { label: "Sleep",     icon: "😴", color: "#8b5cf6" },
  nutrition: { label: "Nutrition", icon: "🍽️", color: "#f59e0b" },
  activity:  { label: "Activity",  icon: "👟", color: "#f43f5e" },
};

// ─── PDF Export ──────────────────────────────────────────────────────────────
const exportPDF = async (printRef, weekStart) => {
  try {
    toast.loading("Generating PDF…", { id: "pdf" });
    const { default: jsPDF }       = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");
    const canvas   = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: "#0f172a", logging: false });
    const imgData  = canvas.toDataURL("image/png");
    const pdf      = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pw       = pdf.internal.pageSize.getWidth();
    const ph       = pdf.internal.pageSize.getHeight();
    const iH       = (canvas.height * pw) / canvas.width;
    let   yPos = 0, page = 0;
    while (yPos < iH) {
      if (page++ > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, -yPos, pw, iH);
      yPos += ph;
    }
    pdf.save(`Wellnest_Report_${formatDate(weekStart).replace(/,/g, "").replace(/ /g, "_")}.pdf`);
    toast.success("PDF downloaded!", { id: "pdf" });
  } catch { toast.error("PDF generation failed.", { id: "pdf" }); }
};



// ─── Day Heatmap Row ─────────────────────────────────────────────────────────
const DayRow = ({ day }) => {
  const intensity = Math.min(1, (day.caloriesBurned || 0) / 500);
  const bg = `rgba(99,102,241,${0.1 + intensity * 0.7})`;
  return (
    <div className="day-row" style={{ background: bg }}>
      <span className="day-name">{day.dayName}</span>
      <span className="day-stat">🏋️ {day.workouts}</span>
      <span className="day-stat">🔥 {round(day.caloriesBurned)}</span>
      <span className="day-stat">👟 {round(day.steps)}</span>
      <span className="day-stat">💧 {fmt(day.waterL)}L</span>
      <span className="day-stat">😴 {fmt(day.sleepH)}h</span>
    </div>
  );
};

// ─── Locked Overlay ──────────────────────────────────────────────────────────
const LockedSection = ({ children, title }) => (
  <div className="locked-section">
    <div className="locked-blur-overlay">{children}</div>
    <div className="locked-cta">
      <div className="lock-icon">🔒</div>
      <h4>{title || "Premium Feature"}</h4>
      <p>Upgrade to PRO to unlock AI insights, trends, action plans & PDF export.</p>
      <button className="upgrade-btn">✨ Upgrade to PRO</button>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const HealthReport = () => {
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const printRef = useRef(null);

  const fetchReport = useCallback(async () => {
    setLoading(true); setError("");
    try { const res = await getWeeklyReport(); setReport(res.data); }
    catch { setError("Failed to load your health report. Please try again."); }
    finally { setLoading(false); }
  }, []);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    const tid = toast.loading("Recalculating weekly clinical analysis... 🩺");
    try {
      setIsRefreshing(true);
      const res = await refreshWeeklyReport();
      setReport(res.data);
      toast.success("Health report refreshed successfully! ✨", { id: tid });
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to refresh your health report. Try again.";
      toast.error(errMsg, { id: tid, duration: 4000 });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading) return (
    <div className="report-page">
      <div className="report-loading">
        <div className="report-spinner" />
        <p style={{ fontWeight: 700, marginTop: 16 }}>Analyzing your health data…</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Pulling 7 days of insights.</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="report-page">
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>⚠️</div>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>{error}</p>
        <button className="primary-btn" style={{ width: "auto", padding: "12px 28px" }} onClick={fetchReport}>Retry</button>
      </div>
    </div>
  );

  const { stats = {}, isPremium, weekStart, weekEnd, insights = [], actionPlan = [], doctorSummary, weekHighlight, riskFlags = [], lastRefreshedAt } = report;
  const breakdown   = stats.scoreBreakdown || {};
  const vsLast      = stats.vsLastWeek || {};
  const daily       = stats.dailyBreakdown || [];
  const wTypes      = stats.workoutTypes || [];
  const wTrend      = stats.weightTrend || [];
  const healthScore = stats.healthScore ?? 0;
  const weekRange   = `${formatDate(weekStart)} — ${formatDate(weekEnd)}`;

  // Chart configs
  const dailyBarData = {
    labels: daily.map(d => d.dayName),
    datasets: [
      { label: "Cal Burned",  data: daily.map(d => d.caloriesBurned), backgroundColor: "#6366f188", borderRadius: 6 },
      { label: "Steps/100",   data: daily.map(d => Math.round((d.steps || 0) / 100)), backgroundColor: "#22c55e55", borderRadius: 6 },
    ],
  };
  const chartOpts = (max) => ({
    responsive: true,
    plugins: { legend: { labels: { color: "#94a3b8", font: { size: 11 } } }, tooltip: { mode: "index", intersect: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b" } },
      y: { max, grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#64748b" } },
    },
  });

  const weightLineData = wTrend.length ? {
    labels: wTrend.map(w => w.date?.slice(5)),
    datasets: [{ label: "Weight (kg)", data: wTrend.map(w => w.weight), borderColor: "#f59e0b", backgroundColor: "#f59e0b22", tension: 0.4, fill: true, pointRadius: 4, borderWidth: 2 }],
  } : null;

  return (
    <div className="report-page">
      <div ref={printRef}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="report-header">
          <div className="report-header-meta">📊 Wellnest Health Report</div>
          <h1>Weekly Summary</h1>
          <div className="report-header-date">{weekRange}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 10 }}>
            {isPremium ? <span className="pro-badge">✨ PRO Report</span> : <span className="free-badge">Free Preview</span>}
            {isPremium && weekHighlight && (
              <div className="highlight-pill">🏆 {weekHighlight}</div>
            )}
          </div>
          {isPremium && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {lastRefreshedAt === "NEVER" ? "No manual updates this week" : `Last updated: ${new Date(lastRefreshedAt).toLocaleString()}`}
              </div>
              <button 
                onClick={handleRefresh} 
                className="primary-btn small" 
                disabled={isRefreshing}
                style={{ width: 'auto', padding: '6px 14px', fontSize: '12px', background: 'linear-gradient(135deg, #6366f1, #a78bfa)', border: 'none', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isRefreshing ? "Refreshing..." : "🔄 Refresh Analysis (1/week)"}
              </button>
            </div>
          )}
        </div>

        {/* ── RISK FLAGS (premium only) ────────────────────────────────────  */}
        {isPremium && riskFlags?.filter(r => r && r.toLowerCase() !== "none" && !r.toLowerCase().includes("empty")).length > 0 && (
          <div className="risk-banner">
            <span>⚠️ Health Flags: </span>
            {riskFlags.filter(r => r && !r.toLowerCase().includes("empty")).map((r, i) => (
              <span key={i} className="risk-tag">{r}</span>
            ))}
          </div>
        )}

        {/* ── CORE STATS GRID ─────────────────────────────────────────────── */}
        <p className="report-section-title">📈 This Week at a Glance</p>
        <div className="stats-grid stats-grid-lg">
          {[
            { emoji: "🏋️", value: stats.totalWorkouts ?? 0, label: "Workouts", sub: `${stats.totalDurationMins ?? 0} mins total` },
            { emoji: "🔥", value: round(stats.totalCaloriesBurned), label: "kcal Burned", sub: `+${round(stats.totalActiveCalories)} active` },
            { emoji: "💧", value: `${fmt(stats.avgWaterLiters)}L`, label: "Avg Water/Day", sub: `${fmt(stats.totalWaterLiters)}L total` },
            { emoji: "😴", value: `${fmt(stats.avgSleepHours)}h`, label: "Avg Sleep", sub: `Best ${fmt(stats.bestSleepHours)}h` },
            { emoji: "👟", value: round(stats.totalSteps), label: "Total Steps", sub: `Best day ${round(stats.bestDaySteps)}` },
            { emoji: "🍽️", value: `${stats.avgDailyCaloriesConsumed ?? 0}`, label: "kcal/Day Eaten", sub: `${stats.avgProtein ?? 0}g protein` },
            { emoji: "📏", value: `${fmt(stats.totalDistanceKm)}km`, label: "Distance", sub: "This week" },
            { emoji: "🔥", value: `${stats.workoutStreak ?? 0}d`, label: "Workout Streak", sub: "Consecutive days" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <span className="stat-card-emoji">{s.emoji}</span>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
              {s.sub && <div className="stat-card-sub">{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* ── VS LAST WEEK ────────────────────────────────────────────────── */}
        <p className="report-section-title">📊 vs Last Week</p>
        <div className="comparison-row">
          {[
            { label: "Workouts",    val: vsLast.workoutsDelta,      unit: "" },
            { label: "Cal Burned",  val: vsLast.caloriesBurnedDelta, unit: "kcal" },
            { label: "Water",       val: vsLast.waterDelta,          unit: "L/day" },
            { label: "Steps",       val: vsLast.stepsDelta,          unit: "" },
            { label: "Cal Eaten",   val: vsLast.caloriesEatenDelta,  unit: "kcal/day" },
          ].map(({ label, val, unit }) => (
            <div key={label} className="comparison-card">
              <div className="comparison-label">{label}</div>
              <div className="comparison-delta" style={{ color: deltaColor(val) }}>
                {val !== undefined ? `${deltaSign(val)} ${unit}` : "—"}
              </div>
              <div className="comparison-trend">
                {val > 0 ? "▲ Up" : val < 0 ? "▼ Down" : "→ Same"}
              </div>
            </div>
          ))}
        </div>

        {/* ── DAILY BREAKDOWN TABLE ─────────────────────────────────────── */}
        <p className="report-section-title">📅 Daily Breakdown</p>
        <div className="daily-breakdown">
          {daily.map((d, i) => <DayRow key={i} day={d} />)}
        </div>

        {/* ── MACRO NUTRITION ─────────────────────────────────────────────── */}
        {(stats.avgProtein > 0 || stats.avgCarbs > 0 || stats.avgFats > 0) && (
          <>
            <p className="report-section-title">🍽️ Nutrition Macros (Daily Avg)</p>
            <div className="macros-row">
              {[
                { label: "Protein",  val: stats.avgProtein, color: "#22c55e", goal: 120 },
                { label: "Carbs",    val: stats.avgCarbs,   color: "#f59e0b", goal: 250 },
                { label: "Fats",     val: stats.avgFats,    color: "#f43f5e", goal: 65  },
              ].map(({ label, val, color, goal }) => (
                <div key={label} className="macro-card">
                  <div className="macro-label">{label}</div>
                  <div className="macro-value" style={{ color }}>{val ?? 0}g</div>
                  <div className="macro-bar-bg">
                    <div className="macro-bar-fill" style={{ width: `${Math.min(100, ((val ?? 0) / goal) * 100)}%`, background: color }} />
                  </div>
                  <div className="macro-goal">Goal: {goal}g</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── AI INSIGHT PREVIEW (free + premium) ─────────────────────────── */}
        {insights.length > 0 && (
          <>
            <p className="report-section-title">🤖 AI Insight Preview</p>
            <div className="insights-list">
              <div className="insight-card">
                <span className="insight-emoji">{insights[0].emoji}</span>
                <div className="insight-text">
                  {insights[0].category && <div className="insight-category">{insights[0].category}</div>}
                  <h4>{insights[0].title}</h4>
                  <p>{insights[0].body}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════ PREMIUM GATE ══════════════════════════════════ */}
        {isPremium ? (
          <>
            {/* ── HEALTH SCORE ──────────────────────────────────────────── */}
            <p className="report-section-title">🎯 Health Score</p>
            <div className="health-score-section">
              <div className="health-score-gauge">
                <CircularProgressbar
                  value={healthScore}
                  text={scoreGrade(healthScore)}
                  styles={buildStyles({
                    pathColor: scoreColor(healthScore),
                    textColor: "var(--text-main)",
                    trailColor: "rgba(255,255,255,0.06)",
                    textSize: "24px",
                  })}
                />
                <div style={{ textAlign: "center", marginTop: 8 }}>
                  <span style={{ fontSize: 13, color: scoreColor(healthScore), fontWeight: 700 }}>{healthScore}/100 — {scoreLabel(healthScore)}</span>
                </div>
              </div>
              <div className="health-score-info">
                <div className="score-breakdown">
                  {Object.entries(dimensionMeta).map(([key, meta]) => (
                    <div key={key} className="score-dimension">
                      <span className="score-dimension-label">{meta.icon} {meta.label}</span>
                      <div className="score-dimension-bar">
                        <div className="score-dimension-fill" style={{ width: `${breakdown[key] ?? 0}%`, background: meta.color }} />
                      </div>
                      <span className="score-dimension-value">{breakdown[key] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── CHART: DAILY ACTIVITY ──────────────────────────────────── */}
            {daily.length > 0 && (
              <>
                <p className="report-section-title">📉 Daily Activity Chart</p>
                <div className="chart-card">
                  <Bar data={dailyBarData} options={chartOpts()} />
                </div>
              </>
            )}

            {/* ── WORKOUT TYPE BREAKDOWN ────────────────────────────────── */}
            {wTypes.length > 0 && (
              <>
                <p className="report-section-title">🏋️ Workout Breakdown</p>
                <div className="workout-types-grid">
                  {wTypes.map((wt, i) => (
                    <div key={i} className="workout-type-card">
                      <div className="wt-rank">#{i + 1}</div>
                      <div className="wt-name">{wt.type}</div>
                      <div className="wt-stats">
                        <span>{wt.count}x</span>
                        <span>🔥 {round(wt.calories)} kcal</span>
                      </div>
                      <div className="wt-bar-bg">
                        <div className="wt-bar-fill" style={{ width: `${Math.min(100, (wt.count / (wTypes[0]?.count || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── WEIGHT TREND ─────────────────────────────────────────── */}
            {weightLineData && (
              <>
                <p className="report-section-title">⚖️ Weight Trend This Week</p>
                <div className="chart-card">
                  <Line data={weightLineData} options={chartOpts()} />
                </div>
              </>
            )}

            {/* ── ALL AI INSIGHTS ───────────────────────────────────────── */}
            <p className="report-section-title">🤖 AI Insights ({insights.length})</p>
            <div className="insights-list">
              {insights.map((ins, i) => (
                <div key={i} className="insight-card">
                  <span className="insight-emoji">{ins.emoji}</span>
                  <div className="insight-text">
                    {ins.category && <div className="insight-category">{ins.category}</div>}
                    <h4>{ins.title}</h4>
                    <p>{ins.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── ACTION PLAN ───────────────────────────────────────────── */}
            {actionPlan.length > 0 && (
              <>
                <p className="report-section-title">🎯 Next Week's Action Plan</p>
                <div className="action-plan-list">
                  {actionPlan.map((item, i) => {
                    const goal = typeof item === "string" ? item : item?.goal;
                    const why  = typeof item === "object" ? item?.why : null;
                    const pri  = typeof item === "object" ? item?.priority : null;
                    return (
                      <div key={i} className="action-item">
                        <div className="action-left">
                          <span className="action-number">{i + 1}</span>
                          {pri && <span className="action-priority" style={{ background: priorityColor(pri) + "33", color: priorityColor(pri) }}>{pri}</span>}
                        </div>
                        <div className="action-content">
                          <div className="action-goal">{goal}</div>
                          {why && <div className="action-why">Why: {why}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── DOCTOR SUMMARY ────────────────────────────────────────── */}
            {doctorSummary && (
              <>
                <p className="report-section-title">🩺 Doctor-Ready Summary</p>
                <div className="doctor-summary-card">
                  <h4>🩺 Clinical Summary</h4>
                  <p>{doctorSummary}</p>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
                    Generated {formatDate(weekEnd)} · Not a medical diagnosis · For informational use only
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          /* ═══ FREE GATE ══════════════════════════════════════════════════ */
          <>
            <LockedSection title="Health Score & AI Analysis">
              <div className="health-score-section" style={{ opacity: 0.4 }}>
                <div className="health-score-gauge">
                  <CircularProgressbar value={72} text="B+" styles={buildStyles({ pathColor: "#22c55e", textColor: "#fff", trailColor: "rgba(255,255,255,0.06)" })} />
                </div>
                <div className="health-score-info">
                  <div className="score-breakdown">
                    {Object.values(dimensionMeta).map(m => (
                      <div key={m.label} className="score-dimension">
                        <span className="score-dimension-label">{m.icon} {m.label}</span>
                        <div className="score-dimension-bar"><div className="score-dimension-fill" style={{ width: "70%", background: m.color }} /></div>
                        <span className="score-dimension-value">70</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </LockedSection>

            <LockedSection title="Daily Activity Charts">
              <div className="chart-card" style={{ opacity: 0.3 }}>
                <div style={{ height: 120, background: "rgba(99,102,241,0.1)", borderRadius: 12 }} />
              </div>
            </LockedSection>

            <LockedSection title="Action Plan & Doctor Summary">
              <div className="action-plan-list" style={{ opacity: 0.4 }}>
                {["Log 4 workouts next week","Increase water to 3L/day","Aim for 8h sleep nightly"].map((g, i) => (
                  <div key={i} className="action-item">
                    <span className="action-number">{i + 1}</span>
                    <div className="action-content"><div className="action-goal">{g}</div></div>
                  </div>
                ))}
              </div>
            </LockedSection>
          </>
        )}
      </div>

      {/* ── PDF BUTTON ──────────────────────────────────────────────────────── */}
      {isPremium && (
        <button className="pdf-btn" onClick={() => exportPDF(printRef, weekStart)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PDF Report
        </button>
      )}

      <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 24 }}>
        Generated by Wellnest AI · Not a medical diagnosis
      </p>
    </div>
  );
};

export default HealthReport;
