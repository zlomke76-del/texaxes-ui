"use client";

import { useMemo, useState } from "react";
import { checkInWaiver, searchWaivers } from "../today/lib/api";
import type { WaiverSearchResult } from "../today/types";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function StaffWaiversPage() {
  const [query, setQuery] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [checkedInBy, setCheckedInBy] = useState("");
  const [waivers, setWaivers] = useState<WaiverSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const readyToSearch = useMemo(
    () => query.trim().length > 0 || bookingId.trim().length > 0,
    [query, bookingId],
  );

  async function runSearch() {
    if (!readyToSearch) {
      setError("Enter a name, email, phone, or booking ID.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setToast("");

      const response = await searchWaivers({
        q: query.trim() || undefined,
        booking_id: bookingId.trim() || undefined,
        limit: 30,
      });

      setWaivers(response.waivers || []);
      if (!response.waivers?.length) {
        setToast("No matching waivers found.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to search waivers");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn(waiver: WaiverSearchResult) {
    try {
      setBusyId(waiver.id);
      setError("");
      setToast("");

      await checkInWaiver({
        waiver_id: waiver.id,
        booking_id: bookingId.trim() || waiver.booking_id || null,
        checked_in_by: checkedInBy.trim() || null,
      });

      setToast(`${waiver.customer_name} checked in.`);
      await runSearch();
    } catch (err: any) {
      setError(err?.message || "Failed to check in waiver");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="page">
      <section className="shell">
        <div className="hero">
          <div>
            <div className="kicker">Tex Axes Staff</div>
            <h1>Waiver Check-In</h1>
            <p>
              Search standalone or booking-linked waivers by name, email, phone,
              or booking ID. Check a waiver in when the guest arrives and attach
              it to the active booking when needed.
            </p>
          </div>
        </div>

        <section className="card searchCard">
          <label>
            Guest search
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch();
              }}
              placeholder="Name, email, or phone"
            />
          </label>

          <label>
            Booking ID / attach target
            <input
              value={bookingId}
              onChange={(event) => setBookingId(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch();
              }}
              placeholder="Optional booking UUID"
            />
          </label>

          <label>
            Checked in by
            <input
              value={checkedInBy}
              onChange={(event) => setCheckedInBy(event.target.value)}
              placeholder="Optional staff name or ID"
            />
          </label>

          <button
            type="button"
            onClick={runSearch}
            disabled={loading || !readyToSearch}
          >
            {loading ? "Searching..." : "Find Waiver"}
          </button>
        </section>

        {error ? <div className="error">{error}</div> : null}
        {toast ? <div className="toast">{toast}</div> : null}

        <section className="results">
          {waivers.map((waiver) => {
            const checkedIn = Boolean(waiver.checked_in_at);
            const canAttach =
              bookingId.trim() && waiver.booking_id !== bookingId.trim();

            return (
              <article className="waiverCard" key={waiver.id}>
                <div className="waiverMain">
                  <div>
                    <div className="name">{waiver.customer_name}</div>
                    <div className="details">
                      {waiver.email || "No email"} ·{" "}
                      {waiver.phone || "No phone"}
                    </div>
                    <div className="details">
                      Signed {formatDateTime(waiver.signed_at)} · Expires{" "}
                      {formatDateTime(waiver.expires_at)}
                    </div>
                    <div className="details">
                      Booking: {waiver.booking_id || "Standalone"}
                    </div>
                  </div>

                  <div className={checkedIn ? "chip good" : "chip pending"}>
                    {checkedIn ? "Checked in" : "Signed"}
                  </div>
                </div>

                <div className="actions">
                  <button
                    type="button"
                    onClick={() => handleCheckIn(waiver)}
                    disabled={busyId === waiver.id}
                  >
                    {busyId === waiver.id
                      ? "Saving..."
                      : checkedIn && !canAttach
                        ? "Re-check In"
                        : canAttach
                          ? "Check In + Attach"
                          : "Check In"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 32px 16px 56px;
          color: #f8fafc;
          background:
            radial-gradient(
              circle at top left,
              rgba(251, 146, 60, 0.12),
              transparent 28%
            ),
            linear-gradient(180deg, #06101f 0%, #081423 55%, #09111b 100%);
        }

        .shell {
          max-width: 1100px;
          margin: 0 auto;
        }

        .hero,
        .card,
        .waiverCard,
        .error,
        .toast {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
        }

        .hero {
          padding: 28px;
          margin-bottom: 18px;
        }

        .kicker {
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

        p {
          max-width: 780px;
          margin: 0;
          color: rgba(248, 250, 252, 0.74);
          line-height: 1.7;
        }

        .searchCard {
          display: grid;
          gap: 12px;
          padding: 18px;
          margin-bottom: 18px;
        }

        label {
          display: grid;
          gap: 7px;
          color: rgba(248, 250, 252, 0.76);
          font-size: 13px;
          font-weight: 800;
        }

        input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          outline: none;
        }

        input::placeholder {
          color: rgba(248, 250, 252, 0.42);
        }

        button {
          appearance: none;
          border: 0;
          cursor: pointer;
          border-radius: 14px;
          padding: 12px 14px;
          background: #f97316;
          color: #fff;
          font: inherit;
          font-weight: 900;
          transition: 160ms ease;
        }

        button:hover:enabled {
          background: #fb923c;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .error,
        .toast {
          margin-bottom: 18px;
          padding: 14px 16px;
        }

        .error {
          color: #fecaca;
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(248, 113, 113, 0.24);
        }

        .toast {
          color: #bbf7d0;
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(74, 222, 128, 0.24);
        }

        .results {
          display: grid;
          gap: 14px;
        }

        .waiverCard {
          padding: 18px;
        }

        .waiverMain {
          display: grid;
          gap: 14px;
        }

        .name {
          font-size: 18px;
          font-weight: 900;
        }

        .details {
          margin-top: 5px;
          color: rgba(248, 250, 252, 0.68);
          line-height: 1.45;
          word-break: break-word;
        }

        .chip {
          width: fit-content;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 900;
        }

        .chip.good {
          color: #bbf7d0;
          background: rgba(34, 197, 94, 0.14);
        }

        .chip.pending {
          color: #fed7aa;
          background: rgba(249, 115, 22, 0.14);
        }

        .actions {
          margin-top: 16px;
          display: flex;
          justify-content: flex-end;
        }

        @media (min-width: 760px) {
          .searchCard {
            grid-template-columns: 1.3fr 1.1fr 0.9fr auto;
            align-items: end;
          }

          .waiverMain {
            grid-template-columns: 1fr auto;
            align-items: start;
          }
        }
      `}</style>
    </main>
  );
}
