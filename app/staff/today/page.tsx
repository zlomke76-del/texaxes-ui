"use client";

import { useEffect, useMemo, useState } from "react";

type PaymentStatus = "paid" | "pending" | "failed" | "void" | "unknown";
type BookingStatus =
  | "pending"
  | "awaiting_payment"
  | "confirmed"
  | "paid"
  | "checked_in"
  | "completed"
  | "expired"
  | "no_show"
  | "unknown";

type WaiverStatus = "signed" | "missing" | "guardian_required" | "unknown";

type BookingRow = {
  booking_id: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  email: string | null;
  phone: string | null;
  party_size: number;
  booking_type: string | null;
  booking_source: string | null;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  waiver_status: WaiverStatus;
  total_amount: number;
  amount_paid: number;
  customer_notes: string | null;
  internal_notes: string | null;
  allocation_mode: string | null;
  bays_allocated: number | null;
  created_at: string | null;
};

type Summary = {
  booking_count: number;
  paid_count: number;
  unpaid_count: number;
  checked_in_count: number;
  completed_count: number;
  expected_revenue: number;
  collected_revenue: number;
};

type TodayResponse = {
  date: string;
  summary: Summary;
  bookings: BookingRow[];
};

type FilterKey =
  | "all"
  | "attention"
  | "upcoming"
  | "unpaid"
  | "checked_in"
  | "completed"
  | "no_show";

const OPS_API_BASE =
  process.env.NEXT_PUBLIC_TEXAXES_OPS_URL?.replace(/\/+$/, "") ||
  "https://texaxes-ops.vercel.app";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatMoney(value: number) {
  return money.format(Number(value || 0));
}

function formatTime(value: string) {
  const [hour, minute] = String(value || "00:00:00").split(":").map(Number);
  const date = new Date();
  date.setHours(hour || 0, minute || 0, 0, 0);
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusTone(status: string) {
  switch (status) {
    case "paid":
    case "checked_in":
    case "completed":
    case "signed":
      return "good";
    case "pending":
    case "awaiting_payment":
    case "missing":
    case "guardian_required":
      return "warn";
    case "failed":
    case "expired":
    case "no_show":
    case "void":
      return "bad";
    default:
      return "neutral";
  }
}

function isAttentionBooking(row: BookingRow) {
  return (
    row.payment_status !== "paid" ||
    row.waiver_status !== "signed" ||
    row.booking_status === "awaiting_payment"
  );
}

function getPriorityScore(row: BookingRow) {
  if (row.booking_status === "awaiting_payment") return 0;
  if (row.payment_status !== "paid") return 1;
  if (row.waiver_status !== "signed") return 2;
  if (row.booking_status === "checked_in") return 3;
  if (row.booking_status === "completed") return 5;
  if (row.booking_status === "no_show") return 6;
  return 4;
}

async function opsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${OPS_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(json?.error || `Request failed: ${res.status}`);
  }

  return json as T;
}

export default function StaffTodayPage() {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadBoard() {
    try {
      setLoading(true);
      setError("");
      const json = await opsFetch<TodayResponse>("/api/admin/bookings-today");
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBoard();
  }, []);

  const derived = useMemo(() => {
    if (!data) {
      return {
        outstanding: 0,
        percentCollected: 0,
        attentionCount: 0,
        missingWaivers: 0,
        unpaidCount: 0,
      };
    }

    const bookings = data.bookings || [];
    const outstanding = Math.max(
      0,
      Number(data.summary.expected_revenue || 0) -
        Number(data.summary.collected_revenue || 0)
    );

    const percentCollected =
      Number(data.summary.expected_revenue || 0) > 0
        ? (Number(data.summary.collected_revenue || 0) /
            Number(data.summary.expected_revenue || 0)) *
          100
        : 0;

    const missingWaivers = bookings.filter(
      (row) => row.waiver_status !== "signed"
    ).length;

    const unpaidCount = bookings.filter(
      (row) => row.payment_status !== "paid"
    ).length;

    const attentionCount = bookings.filter(isAttentionBooking).length;

    return {
      outstanding,
      percentCollected,
      attentionCount,
      missingWaivers,
      unpaidCount,
    };
  }, [data]);

  const filteredBookings = useMemo(() => {
    const rows = [...(data?.bookings || [])].sort((a, b) => {
      const priorityDiff = getPriorityScore(a) - getPriorityScore(b);
      if (priorityDiff !== 0) return priorityDiff;
      return a.start_time.localeCompare(b.start_time);
    });

    if (filter === "all") return rows;

    if (filter === "attention") {
      return rows.filter(isAttentionBooking);
    }

    if (filter === "unpaid") {
      return rows.filter(
        (row) => row.payment_status !== "paid" && row.booking_status !== "completed"
      );
    }

    if (filter === "checked_in") {
      return rows.filter((row) => row.booking_status === "checked_in");
    }

    if (filter === "completed") {
      return rows.filter((row) => row.booking_status === "completed");
    }

    if (filter === "no_show") {
      return rows.filter((row) => row.booking_status === "no_show");
    }

    if (filter === "upcoming") {
      return rows.filter((row) =>
        ["pending", "awaiting_payment", "confirmed", "paid"].includes(
          row.booking_status
        )
      );
    }

    return rows;
  }, [data, filter]);

  async function applyUpdate(
    bookingId: string,
    updates: Record<string, unknown>
  ) {
    try {
      setBusyId(bookingId);
      await opsFetch("/api/admin/update-booking", {
        method: "POST",
        body: JSON.stringify({
          booking_id: bookingId,
          ...updates,
        }),
      });
      await loadBoard();
    } catch (err: any) {
      alert(err?.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleEditNotes(row: BookingRow) {
    const next = window.prompt(
      "Update internal notes",
      row.internal_notes || row.customer_notes || ""
    );
    if (next === null) return;
    await applyUpdate(row.booking_id, { internal_notes: next });
  }

  async function handleEditPartySize(row: BookingRow) {
    const next = window.prompt("Update party size", String(row.party_size || 1));
    if (next === null) return;

    const size = Number(next);
    if (!Number.isInteger(size) || size <= 0) {
      alert("Invalid party size");
      return;
    }

    await applyUpdate(row.booking_id, { party_size: size });
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.1),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-2xl shadow-black/25">
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_40%,transparent_60%,rgba(255,255,255,0.03))]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-200">
                Tex Axes Staff Board
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Today’s Operations
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70 sm:text-base">
                Live front-desk command surface for bookings, payment visibility,
                waiver readiness, and quick operational adjustments.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/45">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Connected: {OPS_API_BASE}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Date: {data?.date || "—"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadBoard}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Refresh Board
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-6 text-white/70 shadow-xl shadow-black/10">
            Loading today’s board...
          </div>
        ) : error ? (
          <div className="mt-6 rounded-[28px] border border-red-400/20 bg-red-500/10 p-6 text-red-200 shadow-xl shadow-black/10">
            {error}
          </div>
        ) : (
          <>
            {derived.attentionCount > 0 ? (
              <section className="mt-6 rounded-[24px] border border-red-400/20 bg-red-500/10 p-4 shadow-xl shadow-black/10">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-red-200/80">
                      Attention Required
                    </div>
                    <div className="mt-1 text-lg font-bold text-red-100">
                      {derived.attentionCount} booking
                      {derived.attentionCount === 1 ? "" : "s"} need action
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-red-100/90">
                    <span className="rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1.5">
                      Unpaid: {derived.unpaidCount}
                    </span>
                    <span className="rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1.5">
                      Waivers pending: {derived.missingWaivers}
                    </span>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <StatCard label="Bookings" value={String(data?.summary.booking_count || 0)} />
              <StatCard label="Paid" value={String(data?.summary.paid_count || 0)} />
              <StatCard label="Unpaid" value={String(data?.summary.unpaid_count || 0)} />
              <StatCard label="Outstanding" value={formatMoney(derived.outstanding)} />
              <StatCard
                label="% Collected"
                value={`${Math.round(derived.percentCollected)}%`}
              />
              <StatCard label="Attention" value={String(derived.attentionCount)} />
            </section>

            <section className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/10">
              <div className="flex flex-wrap gap-3">
                {(
                  [
                    ["all", "All"],
                    ["attention", "Attention"],
                    ["upcoming", "Upcoming"],
                    ["unpaid", "Unpaid"],
                    ["checked_in", "Checked In"],
                    ["completed", "Completed"],
                    ["no_show", "No Show"],
                  ] as Array<[FilterKey, string]>
                ).map(([key, label]) => {
                  const active = filter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                        active
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-900/30"
                          : "border border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-2xl shadow-black/20">
              <div className="hidden grid-cols-[120px_1.55fr_1fr_1fr_1fr_210px] gap-4 border-b border-white/10 bg-black/15 px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white/45 lg:grid">
                <div>Time</div>
                <div>Guest / Group</div>
                <div>Details</div>
                <div>Payment</div>
                <div>Status</div>
                <div>Actions</div>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="p-10">
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 p-8 text-center">
                    <div className="text-sm font-bold uppercase tracking-[0.18em] text-white/35">
                      Clear Board
                    </div>
                    <div className="mt-3 text-xl font-bold text-white/80">
                      No bookings match this view.
                    </div>
                    <p className="mt-2 text-sm text-white/50">
                      This is now a valid empty operational state, not an error.
                    </p>
                  </div>
                </div>
              ) : (
                filteredBookings.map((row) => {
                  const isExpanded = expanded === row.booking_id;
                  const busy = busyId === row.booking_id;

                  const now = new Date();
                  const start = new Date();
                  const [h, m] = row.start_time.split(":").map(Number);
                  start.setHours(h || 0, m || 0, 0, 0);

                  const minutesAway = (start.getTime() - now.getTime()) / 60000;
                  const urgent =
                    minutesAway <= 30 &&
                    minutesAway >= -30 &&
                    row.booking_status !== "checked_in" &&
                    row.booking_status !== "completed";

                  const late =
                    minutesAway < -30 &&
                    row.booking_status !== "checked_in" &&
                    row.booking_status !== "completed" &&
                    row.booking_status !== "no_show";

                  const attention = isAttentionBooking(row);

                  return (
                    <div
                      key={row.booking_id}
                      className={`border-b border-white/10 transition last:border-b-0 ${
                        late
                          ? "bg-red-500/10"
                          : urgent
                          ? "bg-orange-500/10"
                          : attention
                          ? "bg-white/[0.03]"
                          : ""
                      }`}
                    >
                      <div className="grid gap-4 px-5 py-5 lg:grid-cols-[120px_1.55fr_1fr_1fr_1fr_210px] lg:items-start">
                        <div>
                          <div className="text-base font-black text-white">
                            {formatTime(row.start_time)}
                          </div>
                          <div className="text-sm text-white/50">
                            {formatTime(row.end_time)}
                          </div>
                          {late ? (
                            <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-red-200">
                              Past due check-in
                            </div>
                          ) : urgent ? (
                            <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">
                              Starting now
                            </div>
                          ) : null}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-base font-bold text-white">
                              {row.customer_name}
                            </div>
                            {attention ? (
                              <span className="rounded-full border border-orange-300/20 bg-orange-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-200">
                                Needs attention
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 space-y-1 text-sm">
                            {row.email ? (
                              <a
                                href={`mailto:${row.email}`}
                                className="block text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white"
                              >
                                {row.email}
                              </a>
                            ) : (
                              <div className="text-white/35">No email</div>
                            )}

                            {row.phone ? (
                              <a
                                href={`tel:${row.phone}`}
                                className="block text-white/60 underline decoration-white/20 underline-offset-4 hover:text-white"
                              >
                                {row.phone}
                              </a>
                            ) : (
                              <div className="text-white/35">No phone</div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-white">
                            Party of {row.party_size}
                          </div>
                          <div className="mt-1 text-sm text-white/65">
                            {(row.booking_type || "open").replaceAll("_", " ")} ·{" "}
                            {(row.booking_source || "unknown").replaceAll("_", " ")}
                          </div>
                          <div className="mt-2 text-sm text-white/50">
                            Bays: {row.bays_allocated ?? "-"} ·{" "}
                            {(row.allocation_mode || "-").replaceAll("_", " ")}
                          </div>
                        </div>

                        <div>
                          <StatusPill
                            label={row.payment_status}
                            tone={getStatusTone(row.payment_status)}
                          />
                          <div className="mt-3 text-sm text-white/75">
                            Due: {formatMoney(row.total_amount)}
                          </div>
                          <div className="text-sm text-white/55">
                            Paid: {formatMoney(row.amount_paid)}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-white/80">
                            Outstanding:{" "}
                            {formatMoney(
                              Math.max(0, Number(row.total_amount || 0) - Number(row.amount_paid || 0))
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <StatusPill
                            label={row.booking_status}
                            tone={getStatusTone(row.booking_status)}
                          />
                          <StatusPill
                            label={row.waiver_status}
                            tone={getStatusTone(row.waiver_status)}
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              disabled={busy}
                              onClick={() =>
                                applyUpdate(row.booking_id, {
                                  payment_status: "paid",
                                  booking_status:
                                    row.booking_status === "awaiting_payment"
                                      ? "paid"
                                      : row.booking_status,
                                  amount_paid: row.total_amount,
                                })
                              }
                              className="rounded-xl bg-green-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-400 disabled:opacity-50"
                            >
                              Mark Paid
                            </button>

                            <button
                              disabled={busy}
                              onClick={() =>
                                applyUpdate(row.booking_id, {
                                  payment_status: "pending",
                                  amount_paid: 0,
                                })
                              }
                              className="rounded-xl bg-yellow-500/90 px-3 py-2 text-xs font-bold text-white transition hover:bg-yellow-400 disabled:opacity-50"
                            >
                              Mark Unpaid
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              disabled={busy}
                              onClick={() =>
                                applyUpdate(row.booking_id, {
                                  booking_status: "checked_in",
                                })
                              }
                              className="rounded-xl bg-blue-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-400 disabled:opacity-50"
                            >
                              Check In
                            </button>

                            <button
                              disabled={busy}
                              onClick={() =>
                                applyUpdate(row.booking_id, {
                                  booking_status: "completed",
                                })
                              }
                              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15 disabled:opacity-50"
                            >
                              Complete
                            </button>

                            <button
                              disabled={busy}
                              onClick={() =>
                                applyUpdate(row.booking_id, {
                                  booking_status: "no_show",
                                })
                              }
                              className="rounded-xl bg-red-500/80 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-400 disabled:opacity-50"
                            >
                              No Show
                            </button>

                            <button
                              disabled={busy}
                              onClick={() => setExpanded(isExpanded ? null : row.booking_id)}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
                            >
                              {isExpanded ? "Hide" : "Details"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="border-t border-white/10 bg-black/20 px-5 py-5">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <DetailBox
                              title="Customer Notes"
                              value={row.customer_notes || "None"}
                            />
                            <DetailBox
                              title="Internal Notes"
                              value={row.internal_notes || "None"}
                            />
                            <DetailBox
                              title="Payment Snapshot"
                              value={`Status: ${row.payment_status}\nDue: ${formatMoney(
                                row.total_amount
                              )}\nPaid: ${formatMoney(row.amount_paid)}\nOutstanding: ${formatMoney(
                                Math.max(
                                  0,
                                  Number(row.total_amount || 0) - Number(row.amount_paid || 0)
                                )
                              )}`}
                            />
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                              <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                                Quick Adjust
                              </div>

                              <div className="mb-4 space-y-2 text-sm text-white/70">
                                <div>
                                  Waiver:{" "}
                                  <span className="font-semibold text-white">
                                    {row.waiver_status.replaceAll("_", " ")}
                                  </span>
                                </div>
                                <div>
                                  Booking ID:{" "}
                                  <span className="font-mono text-xs text-white/60">
                                    {row.booking_id}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleEditPartySize(row)}
                                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15"
                                >
                                  Edit Party Size
                                </button>
                                <button
                                  onClick={() => handleEditNotes(row)}
                                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15"
                                >
                                  Edit Notes
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10 backdrop-blur-sm">
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
        {label}
      </div>
      <div className="mt-3 text-3xl font-black tracking-tight text-white">
        {value}
      </div>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: string }) {
  const toneClass =
    tone === "good"
      ? "border-green-400/20 bg-green-500/15 text-green-200"
      : tone === "warn"
      ? "border-yellow-400/20 bg-yellow-500/15 text-yellow-200"
      : tone === "bad"
      ? "border-red-400/20 bg-red-500/15 text-red-200"
      : "border-white/10 bg-white/10 text-white/75";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${toneClass}`}
    >
      {label.replaceAll("_", " ")}
    </span>
  );
}

function DetailBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
        {title}
      </div>
      <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-white/75">
        {value}
      </pre>
    </div>
  );
}
