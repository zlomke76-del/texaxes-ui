"use client";

import { useMemo, useRef, useState } from "react";

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

  const [ack, setAck] = useState({
    read: false,
    risk: false,
    rules: false,
    medical: false,
    media: false,
    guardian: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecked = useMemo(() => {
    return (
      ack.read &&
      ack.risk &&
      ack.rules &&
      ack.medical &&
      ack.media &&
      (!form.is_minor || ack.guardian)
    );
  }, [ack, form.is_minor]);

  function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ===============================
  // SIGNATURE PAD
  // ===============================
  function getContext() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }

  function getPointFromEvent(e: any) {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const source = e.touches ? e.touches[0] : e;

    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top,
    };
  }

  function startDrawing(e: any) {
    const ctx = getContext();
    const point = getPointFromEvent(e);
    if (!ctx || !point) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }

  function draw(e: any) {
    if (!isDrawing) return;

    const ctx = getContext();
    const point = getPointFromEvent(e);
    if (!ctx || !point) return;

    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
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

  function signatureLooksEmpty() {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] !== 0) return false;
    }
    return true;
  }

  function getSignatureData() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    if (signatureLooksEmpty()) return null;
    return canvas.toDataURL("image/png");
  }

  // ===============================
  // SUBMIT
  // ===============================
  async function handleSubmit() {
    setError(null);

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("Participant first and last name are required.");
      return;
    }

    if (!allChecked) {
      setError("You must review and acknowledge all required terms before signing.");
      return;
    }

    if (form.is_minor) {
      if (!form.guardian_first_name.trim() || !form.guardian_last_name.trim()) {
        setError("Guardian first and last name are required for minors.");
        return;
      }
    }

    const signature = getSignatureData();
    if (!signature) {
      setError("Signature required.");
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
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
          },
          is_minor: form.is_minor,
          guardian: form.is_minor
            ? {
                first_name: form.guardian_first_name.trim(),
                last_name: form.guardian_last_name.trim(),
                email: form.guardian_email.trim() || null,
                phone: form.guardian_phone.trim() || null,
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
        <div className="shell">
          <div className="successCard">
            <div className="eyebrow">Tex Axes</div>
            <h1>Waiver Complete</h1>
            <p>
              You’re all set. Your waiver has been recorded successfully.
            </p>
          </div>
        </div>

        <style jsx>{`
          .container {
            min-height: 100vh;
            background:
              radial-gradient(circle at top left, rgba(251, 146, 60, 0.08), transparent 28%),
              linear-gradient(180deg, #06101f 0%, #081423 55%, #09111b 100%);
            color: #f8fafc;
            padding: 32px 16px;
          }
          .shell {
            max-width: 760px;
            margin: 0 auto;
          }
          .successCard {
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 24px;
            padding: 32px;
            background: rgba(255, 255, 255, 0.06);
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
          }
          .eyebrow {
            display: inline-flex;
            margin-bottom: 12px;
            border-radius: 999px;
            border: 1px solid rgba(253, 186, 116, 0.24);
            background: rgba(251, 146, 60, 0.12);
            padding: 6px 12px;
            color: #fdba74;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }
          h1 {
            margin: 0 0 12px;
            font-size: clamp(2rem, 4vw, 3rem);
            line-height: 1;
          }
          p {
            margin: 0;
            color: rgba(248, 250, 252, 0.75);
            line-height: 1.7;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="shell">
        <div className="heroCard">
          <div className="eyebrow">Tex Axes</div>
          <h1>Release of Liability & Waiver</h1>
          <p className="heroText">
            Please read this agreement carefully before signing. By signing, you
            acknowledge that you understand its contents and are giving up certain
            legal rights.
          </p>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="card">
          <div className="section">
            <h3>Participant Information</h3>

            <div className="grid">
              <input
                placeholder="First Name"
                value={form.first_name}
                onChange={(e) => updateForm("first_name", e.target.value)}
              />

              <input
                placeholder="Last Name"
                value={form.last_name}
                onChange={(e) => updateForm("last_name", e.target.value)}
              />

              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
              />

              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
              />
            </div>

            <label className="minorToggle">
              <input
                type="checkbox"
                checked={form.is_minor}
                onChange={(e) => updateForm("is_minor", e.target.checked)}
              />
              <span>Participant is a minor and requires parent/legal guardian consent</span>
            </label>
          </div>

          {form.is_minor && (
            <div className="section">
              <h3>Guardian Information</h3>

              <div className="grid">
                <input
                  placeholder="Guardian First Name"
                  value={form.guardian_first_name}
                  onChange={(e) => updateForm("guardian_first_name", e.target.value)}
                />

                <input
                  placeholder="Guardian Last Name"
                  value={form.guardian_last_name}
                  onChange={(e) => updateForm("guardian_last_name", e.target.value)}
                />

                <input
                  placeholder="Guardian Email"
                  value={form.guardian_email}
                  onChange={(e) => updateForm("guardian_email", e.target.value)}
                />

                <input
                  placeholder="Guardian Phone"
                  value={form.guardian_phone}
                  onChange={(e) => updateForm("guardian_phone", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="section">
            <h3>Waiver Text</h3>

            <div className="waiverBox">
              <p>
                This Release of Liability, Assumption of Risk, and Indemnity Agreement
                applies to participation in any activity at or associated with Tex Axes,
                including but not limited to axe throwing, knife throwing, training,
                instruction, league play, competitions, demonstrations, special events,
                private events, corporate events, spectator activities, and presence
                anywhere on the premises or related areas.
              </p>

              <p>
                I understand and acknowledge that these activities involve inherent and
                obvious risks, including but not limited to serious personal injury,
                permanent disability, death, property damage, emotional distress,
                injuries caused by thrown objects, rebounding objects, falling objects,
                broken equipment, collisions, slips, trips, falls, or the acts or
                omissions of myself or others.
              </p>

              <p>
                I knowingly and voluntarily assume all risks, both known and unknown,
                arising from or related to participation in these activities, including
                the risk of injury, death, or property damage.
              </p>

              <p>
                I represent that I am physically and mentally capable of safely
                participating, that I will comply with all rules, instructions, safety
                requirements, and staff directions, and that I will stop participating
                and notify staff immediately if I observe any unsafe condition or
                experience any medical or physical issue.
              </p>

              <p>
                To the fullest extent permitted by law, I release, waive, discharge, and
                covenant not to sue Tex Axes Entertainment, LLC and its owners,
                officers, members, managers, employees, contractors, agents,
                representatives, affiliates, landlords, insurers, successors, assigns,
                and any other persons or entities acting in any capacity on its behalf
                from and against any and all claims, demands, causes of action, damages,
                liabilities, losses, costs, or expenses of any kind arising out of or
                related to participation in the activities or presence on the premises,
                including claims arising from negligence, except to the extent caused by
                gross negligence or willful misconduct where such limitation is
                prohibited by law.
              </p>

              <p>
                I agree to indemnify, defend, and hold harmless the Releasees from and
                against any and all claims, liabilities, damages, losses, costs, and
                expenses, including attorneys’ fees, arising out of or related to my
                participation, my conduct on the premises, my violation of any rule,
                instruction, or law, and any claim brought by a third party arising from
                my actions or omissions.
              </p>

              <p>
                I consent to emergency medical treatment if deemed necessary by Tex Axes
                staff or emergency responders. I understand that Tex Axes has no
                obligation to provide medical care and is not responsible for the cost of
                any treatment, transport, or related services.
              </p>

              <p>
                I understand that photographs, video, and audio recordings may be taken
                during normal operations, events, promotions, or competitions. I grant
                Tex Axes the right to photograph, record, use, reproduce, publish,
                display, distribute, and otherwise use my name, likeness, image, voice,
                and appearance in any media for lawful business purposes including
                promotion, advertising, social media, website content, marketing, and
                internal use, without compensation.
              </p>

              <p>
                If I am signing on behalf of a minor participant, I certify that I am
                the parent or legal guardian of that minor and have full authority to
                sign this agreement on the minor’s behalf. I understand and agree that
                the minor is bound by this agreement to the fullest extent permitted by
                law and that I assume all risks and obligations on behalf of the minor.
              </p>

              <p>
                This agreement shall be governed by the laws of the State of Texas, and
                any dispute arising out of or relating to this agreement or the
                activities shall be brought exclusively in a state or federal court of
                competent jurisdiction located in Texas.
              </p>

              <p>
                I have read this agreement carefully. I understand its terms. I
                understand that by signing it, I am giving up substantial legal rights,
                including the right to sue. I sign this agreement voluntarily and without
                inducement.
              </p>
            </div>
          </div>

          <div className="section">
            <h3>Acknowledgment</h3>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={ack.read}
                onChange={(e) => setAck({ ...ack, read: e.target.checked })}
              />
              <span>I have read and agree to this waiver.</span>
            </label>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={ack.risk}
                onChange={(e) => setAck({ ...ack, risk: e.target.checked })}
              />
              <span>I understand the risks involved, including serious injury or death.</span>
            </label>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={ack.rules}
                onChange={(e) => setAck({ ...ack, rules: e.target.checked })}
              />
              <span>I agree to follow all rules and staff instructions.</span>
            </label>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={ack.medical}
                onChange={(e) => setAck({ ...ack, medical: e.target.checked })}
              />
              <span>I consent to emergency medical treatment if necessary.</span>
            </label>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={ack.media}
                onChange={(e) => setAck({ ...ack, media: e.target.checked })}
              />
              <span>I consent to the photo/video release described above.</span>
            </label>

            {form.is_minor && (
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={ack.guardian}
                  onChange={(e) => setAck({ ...ack, guardian: e.target.checked })}
                />
                <span>
                  I certify that I am the parent/legal guardian and agree on behalf of
                  the minor participant.
                </span>
              </label>
            )}
          </div>

          <div className="section">
            <h3>Signature</h3>
            <p className="signatureHelp">
              Sign below using your finger or mouse. This signature is legally binding.
            </p>

            <div className="signatureWrap">
              <canvas
                ref={canvasRef}
                width={700}
                height={220}
                className="signature"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            <button type="button" className="clearButton" onClick={clearSignature}>
              Clear Signature
            </button>
          </div>

          <button
            type="button"
            className="submitButton"
            onClick={handleSubmit}
            disabled={submitting || !allChecked}
          >
            {submitting ? "Submitting..." : "Sign Waiver"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(251, 146, 60, 0.08), transparent 28%),
            linear-gradient(180deg, #06101f 0%, #081423 55%, #09111b 100%);
          color: #f8fafc;
          padding: 24px 16px 48px;
        }

        .shell {
          max-width: 860px;
          margin: 0 auto;
        }

        .heroCard,
        .card,
        .error {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
        }

        .heroCard {
          padding: 28px;
          margin-bottom: 20px;
          background:
            radial-gradient(circle at top left, rgba(251, 146, 60, 0.12), transparent 26%),
            linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
        }

        .card {
          padding: 24px;
        }

        .eyebrow {
          display: inline-flex;
          margin-bottom: 12px;
          border-radius: 999px;
          border: 1px solid rgba(253, 186, 116, 0.24);
          background: rgba(251, 146, 60, 0.12);
          padding: 6px 12px;
          color: #fdba74;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        h1 {
          margin: 0 0 12px;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        h3 {
          margin: 0 0 14px;
          font-size: 1.1rem;
          color: #fff;
        }

        .heroText {
          margin: 0;
          color: rgba(248, 250, 252, 0.74);
          line-height: 1.7;
        }

        .section {
          margin-bottom: 24px;
        }

        .grid {
          display: grid;
          gap: 12px;
          grid-template-columns: 1fr;
        }

        input {
          display: block;
          width: 100%;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          outline: none;
          box-sizing: border-box;
        }

        input::placeholder {
          color: rgba(248, 250, 252, 0.42);
        }

        input:focus {
          border-color: rgba(251, 146, 60, 0.65);
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.16);
        }

        .minorToggle,
        .checkbox {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: rgba(248, 250, 252, 0.78);
          line-height: 1.6;
        }

        .minorToggle {
          margin-top: 14px;
        }

        .minorToggle input,
        .checkbox input {
          width: 16px;
          height: 16px;
          margin-top: 4px;
          accent-color: #f97316;
          flex: 0 0 auto;
        }

        .checkbox {
          margin-bottom: 12px;
        }

        .waiverBox {
          max-height: 320px;
          overflow-y: auto;
          padding: 18px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.18);
          color: rgba(248, 250, 252, 0.78);
          line-height: 1.75;
          font-size: 14px;
        }

        .waiverBox p {
          margin: 0 0 14px;
        }

        .waiverBox p:last-child {
          margin-bottom: 0;
        }

        .signatureHelp {
          margin: 0 0 10px;
          color: rgba(248, 250, 252, 0.64);
          line-height: 1.6;
        }

        .signatureWrap {
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: #fff;
          padding: 8px;
          overflow: hidden;
        }

        .signature {
          width: 100%;
          height: auto;
          display: block;
          background: #ffffff;
          touch-action: none;
          border-radius: 12px;
        }

        .clearButton,
        .submitButton {
          appearance: none;
          border: 0;
          cursor: pointer;
          font: inherit;
          transition: 160ms ease;
        }

        .clearButton {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          font-weight: 700;
        }

        .clearButton:hover {
          background: rgba(255, 255, 255, 0.14);
        }

        .submitButton {
          width: 100%;
          padding: 14px 16px;
          border-radius: 16px;
          background: #f97316;
          color: #fff;
          font-weight: 800;
          box-shadow: 0 16px 34px rgba(124, 45, 18, 0.28);
        }

        .submitButton:hover:enabled {
          background: #fb923c;
        }

        .submitButton:disabled {
          cursor: not-allowed;
          opacity: 0.55;
          box-shadow: none;
        }

        .error {
          margin-bottom: 20px;
          padding: 16px 18px;
          color: #fecaca;
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(248, 113, 113, 0.24);
        }

        @media (min-width: 720px) {
          .container {
            padding: 32px 20px 56px;
          }

          .heroCard,
          .card {
            padding: 28px;
          }

          .grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
