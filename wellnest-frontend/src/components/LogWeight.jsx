import React, { useState } from "react";
import { logWeight } from "../api/weightApi";

const LogWeight = ({ onLogged }) => {
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateWeight = (value) => {
    const w = Number(value);

    if (!value) return "Weight is required";
    if (isNaN(w)) return "Invalid number";
    if (w < 30) return "Weight too low (min 30kg)";
    if (w > 300) return "Weight too high (max 300kg)";

    return "";
  };

  const submit = async () => {
    const validationError = validateWeight(weight);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await logWeight(Number(weight));
      setWeight("");
      setError("");
      onLogged?.(); // refresh analytics
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to log weight"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="number"
        step="0.1"
        placeholder="Current weight (kg)"
        value={weight}
        onChange={(e) => {
          setWeight(e.target.value);
          setError(""); // clear error while typing
        }}
      />

      <button
        onClick={submit}
        disabled={loading}
        style={{ marginLeft: 8 }}
      >
        {loading ? "Saving..." : "Log Weight"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: 6 }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default LogWeight;
