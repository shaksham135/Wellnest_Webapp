// src/pages/HealthReport.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";

import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler
} from "chart.js";
import { getWeeklyReport } from "../api/reportApi";
import toast from "react-hot-toast";
import "./HealthReport.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// ─── Helpers ───────────────────────────────────────────────────────────────
const scoreColor = (score) => {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#fb923c";
  return "#ef4444";
};

const scoreLabel = (score) => {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Great";
  if (score >= 60) return "Good";
  if (score >= 45) return "Fair";
  return "Needs Work";
};

const scoreGrade = (score) => {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C+";
  return "C";
};

const formatDate = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric"
  });
};

// ─── Dimension Colors ────────────────────────────────────────────────────────
const dimensionMeta = {
  fitness:   { label: "Fitness",   color: "#22c55e" },
  hydration: { label: "Hydration", color: "#3b82f6" },
  sleep:     { label: "Sleep",     color: "#8b5cf6" },
  nutrition: { label: "Nutrition", color: "#f59e0b" },
  activity:  { label: "Activity",  color: "#f43f5e" },
};

// ─── PDF Export ──────────────────────────────────────────────────────────────
const exportPDF = async (printRef, userName, weekStart) => {
  try {
    toast.loading("Generating PDF...", { id: "pdf" });
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#0f172a",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let yPos = 0;
    let pageCount = 0;
    while (yPos < imgHeight) {
      if (pageCount > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, -yPos, imgWidth, imgHeight);
      yPos += pageHeight;
      pageCount++;
    }

    const dateStr = formatDate(weekStart).replace(/,/g, "").replace(/ /g, "_");
    pdf.save(`Wellnest_Report_${userName}_${dateStr}.pdf`);
    toast.success("PDF downloaded!", { id: "pdf" });
  } catch (e) {
    toast.error("PDF generation failed. Please try again.", { id: "pdf" });
    console.error(e);
  }
};

// ─── Sparkline Chart ─────────────────────────────────────────────────────────
const SparkChart = ({ data, label, color }) => {
  if (!data || data.length === 0) return null;
  const chartData = {
    labels: data.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString("en-US", { weekday: "short" });
    }),
    datasets: [{
      label,
      data: data.map(d => d.calories || d.value || 0),
      borderColor: color,
      backgroundColor: `${color}25`,
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointBackgroundColor: color,
      borderWidth: 2,
    }],
  };
  const options = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 10 } } },
      y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#64748b", font: { size: 10 } } },
    },
  };
  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "16px", padding: "16px 18px", backdropFilter: "var(--glass-blur)" }}>
      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>{label}</div>
      <Line data={chartData} options={options} />
    </div>
  );
};

// ─── Locked Section Overlay ───────────────────────────────────────────────────
const LockedSection = ({ children }) => (
  <div className="locked-section">
    <div className="locked-blur-overlay">{children}</div>
    <div className="locked-cta">
      <div className="lock-icon">🔒</div>
      <h4>Premium Feature</h4>
      <p>Unlock AI insights, health score breakdown, trend charts, and your action plan.</p>
      <button className="upgrade-btn">✨ Upgrade to PRO</button>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const HealthReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const printRef = useRef(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getWeeklyReport();
      setReport(res.data);
    } catch (e) {
      setError("Failed to load your health report. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading) {
    return (
      <div className="report-page">
        <div className="report-loading">
          <div className="report-spinner" />
          <p style={{ fontWeight: 600 }}>Analyzing your health data...</p>
          <p style={{ fontSize: "13px" }}>This may take a few seconds.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-page">
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
          <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>{error}</p>
          <button className="primary-btn" style={{ width: "auto", padding: "12px 28px" }} onClick={fetchReport}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, isPremium, weekStart, weekEnd, insights = [], actionPlan = [], doctorSummary } = report;
  const scoreBreakdown = stats?.scoreBreakdown || {};
  const healthScore = stats?.healthScore ?? 0;
  const weekRange = `${formatDate(weekStart)} — ${formatDate(weekEnd)}`;

  return (
    <div className="report-page">
      <div ref={printRef}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="report-header">
          <div className="report-header-meta">📊 Wellnest Health Report</div>
          <h1>Weekly Summary</h1>
          <div className="report-header-date">{weekRange}</div>
          {isPremium ? (
            <span className="pro-badge">✨ PRO Report</span>
          ) : (
            <span className="free-badge">Free Preview</span>
          )}
        </div>

        {/* ── Stats Summary (always visible) ─────────────────────── */}
        <p className="report-section-title">This Week's Stats</p>
        <div className="stats-grid">
          {[
            { emoji: "🏋️", value: stats?.totalWorkouts ?? 0, label: "Workouts" },
            { emoji: "🔥", value: `${stats?.totalCaloriesBurned ?? 0}`, label: "kcal Burned" },
            { emoji: "💧", value: `${stats?.avgWaterLiters ?? 0}L`, label: "Avg Water/Day" },
            { emoji: "😴", value: `${stats?.avgSleepHours ?? 0}h`, label: "Avg Sleep" },
            { emoji: "👟", value: (stats?.totalSteps ?? 0).toLocaleString(), label: "Total Steps" },
            { emoji: "🍽️", value: `${stats?.avgDailyCaloriesConsumed ?? 0}`, label: "kcal/Day Eaten" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <span className="stat-card-emoji">{s.emoji}</span>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* First insight — always visible */}
        {insights.length > 0 && (
          <>
            <p className="report-section-title">AI Insight Preview</p>
            <div className="insights-list">
              <div className="insight-card">
                <span className="insight-emoji">{insights[0].emoji}</span>
                <div className="insight-text">
                  <h4>{insights[0].title}</h4>
                  <p>{insights[0].body}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── PREMIUM SECTIONS ─────────────────────────────────────── */}
        {isPremium ? (
          <>
            {/* Health Score */}
            <p className="report-section-title">Health Score</p>
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
              </div>
              <div className="health-score-info">
                <h3>
                  {healthScore}/100
                  <span style={{ fontSize: "13px", fontWeight: 600, color: scoreColor(healthScore) }}>
                    {scoreLabel(healthScore)}
                  </span>
                </h3>
                <div className="score-breakdown">
                  {Object.entries(dimensionMeta).map(([key, meta]) => (
                    <div key={key} className="score-dimension">
                      <span className="score-dimension-label">{meta.label}</span>
                      <div className="score-dimension-bar">
                        <div
                          className="score-dimension-fill"
                          style={{
                            width: `${scoreBreakdown[key] ?? 0}%`,
                            background: meta.color,
                          }}
                        />
                      </div>
                      <span className="score-dimension-value">{scoreBreakdown[key] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* All AI Insights */}
            <p className="report-section-title">AI Insights ({insights.length})</p>
            <div className="insights-list">
              {insights.map((ins, i) => (
                <div key={i} className="insight-card">
                  <span className="insight-emoji">{ins.emoji}</span>
                  <div className="insight-text">
                    <h4>{ins.title}</h4>
                    <p>{ins.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trend Charts */}
            {stats?.dailyCaloriesBurned?.length > 0 && (
              <>
                <p className="report-section-title">Weekly Trends</p>
                <div className="trend-charts-grid">
                  <SparkChart
                    data={stats.dailyCaloriesBurned}
                    label="Calories Burned Per Day"
                    color="#22c55e"
                  />
                </div>
              </>
            )}

            {/* Action Plan */}
            {actionPlan.length > 0 && (
              <>
                <p className="report-section-title">Next Week's Action Plan 🎯</p>
                <div className="action-plan-list">
                  {actionPlan.map((goal, i) => (
                    <div key={i} className="action-item">
                      <span className="action-number">{i + 1}</span>
                      {goal}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Doctor Summary */}
            {doctorSummary && (
              <>
                <p className="report-section-title">Doctor-Ready Summary</p>
                <div className="doctor-summary-card">
                  <h4>🩺 Clinical Summary</h4>
                  <p>{doctorSummary}</p>
                </div>
              </>
            )}
          </>
        ) : (
          /* ── FREE USER LOCK GATES ─────────────────────────────── */
          <>
            <p className="report-section-title">Health Score & Full Report</p>
            <LockedSection>
              {/* Dummy blurred content */}
              <div className="health-score-section" style={{ opacity: 0.4 }}>
                <div className="health-score-gauge">
                  <CircularProgressbar value={72} text="B+" styles={buildStyles({ pathColor: "#22c55e", textColor: "#fff", trailColor: "rgba(255,255,255,0.06)" })} />
                </div>
                <div className="health-score-info">
                  <h3>72/100 — Great</h3>
                  <div className="score-breakdown" style={{ gap: "8px" }}>
                    {["Fitness", "Hydration", "Sleep", "Nutrition", "Activity"].map((d) => (
                      <div key={d} className="score-dimension">
                        <span className="score-dimension-label">{d}</span>
                        <div className="score-dimension-bar"><div className="score-dimension-fill" style={{ width: "70%", background: "#4f46e5" }} /></div>
                        <span className="score-dimension-value">70</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </LockedSection>
          </>
        )}
      </div>

      {/* ── PDF Button (outside print ref for cleanliness) ─────── */}
      {isPremium && (
        <button
          className="pdf-btn"
          onClick={() => exportPDF(printRef, "User", weekStart)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PDF Report
        </button>
      )}

      <p style={{ textAlign: "center", fontSize: "11px", color: "var(--text-muted)", marginTop: "24px" }}>
        Generated by Wellnest AI · Not a medical diagnosis
      </p>
    </div>
  );
};

export default HealthReport;
