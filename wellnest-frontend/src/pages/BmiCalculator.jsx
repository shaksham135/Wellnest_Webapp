import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiActivity, FiArrowLeft } from "react-icons/fi";

const BmiCalculator = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    heightCm: "",
    weightKg: "",
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const calculateBMI = (e) => {
    e.preventDefault();

    const height = parseFloat(formData.heightCm);
    const weight = parseFloat(formData.weightKg);

    if (!height || !weight || height <= 0 || weight <= 0) {
      return;
    }

    // BMI = weight (kg) / (height (m))^2
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    const bmiRounded = parseFloat(bmi.toFixed(1));

    let category = "";
    let message = "";
    let color = "";
    let widthPercent = 0;

    if (bmi < 18.5) {
      category = "Underweight";
      message = "You are currently underweight. Focusing on nutrient-dense foods can help.";
      color = "#3b82f6"; // Blue
      widthPercent = 20;
    } else if (bmi >= 18.5 && bmi < 25) {
      category = "Normal Weight";
      message = "Great job! You are in a healthy weight range.";
      color = "#22c55e"; // Green
      widthPercent = 50;
    } else if (bmi >= 25 && bmi < 30) {
      category = "Overweight";
      message = "You are slightly above the ideal range. Regular activity can help.";
      color = "#f59e0b"; // Orange
      widthPercent = 75;
    } else {
      category = "Obese";
      message = "Your BMI suggests obesity. Consulting a professional is recommended.";
      color = "#ef4444"; // Red
      widthPercent = 95;
    }

    setResult({
      bmi: bmiRounded,
      category,
      message,
      color,
      widthPercent
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "var(--bg-main)",
      transition: "background 0.3s ease"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "500px",
        background: "var(--card-bg)",
        backdropFilter: "blur(20px)",
        borderRadius: "28px",
        padding: "32px",
        border: "1px solid var(--card-border)",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s ease"
      }}>
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <div style={{
            width: "60px", height: "60px",
            background: "linear-gradient(135deg, var(--primary), var(--secondary))",
            borderRadius: "18px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", color: "white",
            margin: "0 auto 20px",
            boxShadow: "0 10px 20px rgba(99, 102, 241, 0.2)"
          }}>
            <FiActivity />
          </div>
          <h2 style={{ fontSize: "1.85rem", fontWeight: "850", color: "var(--text-main)", marginBottom: "8px", letterSpacing: "-0.02em" }}>BMI Calculator</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Understand your body stats instantly.</p>
        </div>

        <form onSubmit={calculateBMI} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", color: "var(--text-main)", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>Height (cm)</label>
              <input
                type="number"
                name="heightCm"
                value={formData.heightCm}
                onChange={handleChange}
                placeholder="175"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "14px",
                  border: "1px solid var(--input-border)",
                  background: "var(--input-bg)",
                  color: "var(--text-main)",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", color: "var(--text-main)", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>Weight (kg)</label>
              <input
                type="number"
                name="weightKg"
                value={formData.weightKg}
                onChange={handleChange}
                placeholder="70"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "14px",
                  border: "1px solid var(--input-border)",
                  background: "var(--input-bg)",
                  color: "var(--text-main)",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                required
              />
            </div>
          </div>

          <button type="submit" className="primary-btn" style={{
            marginTop: "10px",
            height: "56px",
            fontSize: "16px",
            fontWeight: "700"
          }}>
            Calculate Now
          </button>
        </form>

        {result && (
          <div style={{
            marginTop: "32px",
            background: "var(--bg-main)",
            borderRadius: "20px",
            padding: "24px",
            border: `1px solid ${result.color}60`,
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: "600", marginBottom: "4px", textTransform: "uppercase" }}>Your BMI</p>
                <h3 style={{ fontSize: "3.2rem", fontWeight: "850", color: "var(--text-main)", lineHeight: 1, letterSpacing: "-0.04em" }}>{result.bmi}</h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  borderRadius: "99px",
                  background: `${result.color}15`,
                  color: result.color,
                  fontWeight: "750",
                  fontSize: "14px",
                  border: `1px solid ${result.color}30`
                }}>
                  {result.category}
                </span>
              </div>
            </div>

            {/* Visual Bar */}
            <div style={{ height: "10px", background: "var(--card-border)", borderRadius: "5px", marginBottom: "16px", position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute",
                left: 0, top: 0, bottom: 0,
                width: `${Math.min(result.widthPercent, 100)}%`,
                background: result.color,
                borderRadius: "5px",
                transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)"
              }}></div>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "15px", lineHeight: "1.6" }}>
              {result.message}
            </p>
          </div>
        )}

        <button onClick={() => navigate("/dashboard")} className="ghost-btn" style={{
          marginTop: "24px",
          width: "100%",
          gap: "8px",
          color: "var(--text-muted)"
        }}>
          <FiArrowLeft /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default BmiCalculator;
