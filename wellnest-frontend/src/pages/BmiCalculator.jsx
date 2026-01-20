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
      background: "radial-gradient(circle at top left, #1e1b4b, #0f172a)"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "500px",
        background: "rgba(30, 41, 59, 0.7)",
        backdropFilter: "blur(20px)",
        borderRadius: "24px",
        padding: "32px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
      }}>
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <div style={{
            width: "60px", height: "60px",
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            borderRadius: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", color: "white",
            margin: "0 auto 16px",
            boxShadow: "0 10px 20px rgba(99, 102, 241, 0.3)"
          }}>
            <FiActivity />
          </div>
          <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "white", marginBottom: "8px" }}>BMI Calculator</h2>
          <p style={{ color: "#9ca3af" }}>Understand your body stats instantly.</p>
        </div>

        <form onSubmit={calculateBMI} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", color: "#cbd5e1", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Height (cm)</label>
              <input
                type="number"
                name="heightCm"
                value={formData.heightCm}
                onChange={handleChange}
                placeholder="175"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(0, 0, 0, 0.2)",
                  color: "white",
                  fontSize: "16px",
                  outline: "none"
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#cbd5e1", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>Weight (kg)</label>
              <input
                type="number"
                name="weightKg"
                value={formData.weightKg}
                onChange={handleChange}
                placeholder="70"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(0, 0, 0, 0.2)",
                  color: "white",
                  fontSize: "16px",
                  outline: "none"
                }}
                required
              />
            </div>
          </div>

          <button type="submit" style={{
            marginTop: "8px",
            padding: "16px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(to right, #6366f1, #8b5cf6)",
            color: "white",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "transform 0.2s",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)"
          }}
            onMouseOver={(e) => e.target.style.transform = "scale(1.02)"}
            onMouseOut={(e) => e.target.style.transform = "scale(1)"}
          >
            Calculate Now
          </button>
        </form>

        {result && (
          <div style={{
            marginTop: "32px",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "16px",
            padding: "24px",
            border: `1px solid ${result.color}40`,
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
              <div>
                <p style={{ color: "#9ca3af", fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>YOUR BMI</p>
                <h3 style={{ fontSize: "3rem", fontWeight: "800", color: "white", lineHeight: 1 }}>{result.bmi}</h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: "99px",
                  background: `${result.color}20`,
                  color: result.color,
                  fontWeight: "700",
                  fontSize: "14px",
                  border: `1px solid ${result.color}40`
                }}>
                  {result.category}
                </span>
              </div>
            </div>

            {/* Visual Bar */}
            <div style={{ height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", marginBottom: "16px", position: "relative" }}>
              <div style={{
                position: "absolute",
                left: 0, top: 0, bottom: 0,
                width: `${Math.min(result.widthPercent, 100)}%`,
                background: result.color,
                borderRadius: "4px",
                transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)"
              }}></div>
            </div>

            <p style={{ color: "#cbd5e1", fontSize: "15px", lineHeight: "1.5" }}>
              {result.message}
            </p>
          </div>
        )}

        <button onClick={() => navigate("/dashboard")} style={{
          marginTop: "24px",
          background: "transparent",
          border: "none",
          color: "#9ca3af",
          cursor: "pointer",
          display: "flex", alignItems: "center", gap: "8px",
          fontSize: "14px",
          fontWeight: "500",
          padding: "8px",
          margin: "0 auto",
          transition: "color 0.2s"
        }}
          onMouseOver={(e) => e.target.style.color = "white"}
          onMouseOut={(e) => e.target.style.color = "#9ca3af"}
        >
          <FiArrowLeft /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default BmiCalculator;
