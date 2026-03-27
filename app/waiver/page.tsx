"use client";

import { useState, useRef } from "react";

const OPS_URL =
  process.env.NEXT_PUBLIC_OPS_URL ||
  "https://texaxes-ops.vercel.app";

export default function WaiverPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    is_minor: false,
    guardian_first_name: "",
    guardian_last_name: "",
    guardian_email: "",
    guardian_phone: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===============================
  // SIGNATURE PAD
  // ===============================
  function getContext() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }

  function startDrawing(e: any) {
    const ctx = getContext();
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();

    const rect = e.target.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.moveTo(x, y);
  }

  function draw(e: any) {
    if (!isDrawing) return;

    const ctx = getContext();
    if (!ctx) return;

    const rect = e.target.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function getSignatureData() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL("image/png");
  }

  // ===============================
  // SUBMIT
  // ===============================
  async function handleSubmit() {
    setError(null);

    if (!form.first_name || !form.last_name) {
      setError("Name required");
      return;
    }

    if (form.is_minor && !form.guardian_first_name) {
      setError("Guardian required for minors");
      return;
    }

    const signature = getSignatureData();
    if (!signature) {
      setError("Signature required");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${OPS_URL}/api/waivers/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            phone: form.phone,
          },
          is_minor: form.is_minor,
          guardian: form.is_minor
            ? {
                first_name: form.guardian_first_name,
                last_name: form.guardian_last_name,
                email: form.guardian_email,
                phone: form.guardian_phone,
              }
            : null,
          signature_data_url: signature,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="container">
        <h1>Waiver Complete</h1>
        <p>You’re all set. You can proceed to your booking.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Tex Axes Waiver</h1>

      {error && <div className="error">{error}</div>}

      <div className="section">
        <h3>Participant Information</h3>

        <input
          placeholder="First Name"
          value={form.first_name}
          onChange={(e) =>
            setForm({ ...form, first_name: e.target.value })
          }
        />

        <input
          placeholder="Last Name"
          value={form.last_name}
          onChange={(e) =>
            setForm({ ...form, last_name: e.target.value })
          }
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />

        <label>
          <input
            type="checkbox"
            checked={form.is_minor}
            onChange={(e) =>
              setForm({ ...form, is_minor: e.target.checked })
            }
          />
          Minor Participant
        </label>
      </div>

      {form.is_minor && (
        <div className="section">
          <h3>Guardian Information</h3>

          <input
            placeholder="Guardian First Name"
            value={form.guardian_first_name}
            onChange={(e) =>
              setForm({
                ...form,
                guardian_first_name: e.target.value,
              })
            }
          />

          <input
            placeholder="Guardian Last Name"
            value={form.guardian_last_name}
            onChange={(e) =>
              setForm({
                ...form,
                guardian_last_name: e.target.value,
              })
            }
          />

          <input
            placeholder="Guardian Email"
            value={form.guardian_email}
            onChange={(e) =>
              setForm({
                ...form,
                guardian_email: e.target.value,
              })
            }
          />

          <input
            placeholder="Guardian Phone"
            value={form.guardian_phone}
            onChange={(e) =>
              setForm({
                ...form,
                guardian_phone: e.target.value,
              })
            }
          />
        </div>
      )}

      <div className="section">
        <h3>Signature</h3>

        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="signature"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        <button onClick={clearSignature}>Clear</button>
      </div>

      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Sign Waiver"}
      </button>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: auto;
          padding: 20px;
        }
        .section {
          margin-bottom: 20px;
        }
        input {
          display: block;
          width: 100%;
          margin-bottom: 10px;
          padding: 10px;
        }
        .signature {
          border: 1px solid #ccc;
          background: #fff;
          touch-action: none;
        }
        button {
          padding: 12px;
          width: 100%;
          margin-top: 10px;
        }
        .error {
          color: red;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
}
