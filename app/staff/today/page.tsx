"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

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

type AvailabilitySlot = {
  time_block_id: string;
  start: string;
  end: string;
  open_bays: number;
  total_bays: number;
  preferred_bays_required?: number;
  minimum_bays_required?: number;
  state: "available" | "limited" | "full";
};

type AvailabilityResponse = {
  date: string;
  throwers: number | null;
  slots: AvailabilitySlot[];
};

type CreateBookingPayload = {
  date: string;
  time: string;
  throwers: number;
  customer: {
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
  };
  booking_source: "admin" | "walk_in" | "phone" | "corporate";
  booking_type: "open" | "league" | "corporate";
  customer_notes?: string;
  internal_notes?: string;
  payment_status: "pending" | "paid";
};

type CreateBookingResponse = {
  success: true;
  booking_id: string;
  booking_status: string;
  payment_status: string;
  totals: {
    base_price: number;
    addons_subtotal: number;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
  };
  allocation: {
    mode: string;
    bays_allocated: number;
    preferred_bays_required: number;
    minimum_bays_required: number;
  };
};

type CreateFormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  time: string;
  throwers: number;
  booking_source: "admin" | "walk_in" | "phone" | "corporate";
  booking_type: "open" | "league" | "corporate";
  customer_notes: string;
  internal_notes: string;
};

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

function getLocalDateInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function shiftDate(dateString: string, days: number) {
  const d = new Date(`${dateString}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function toneClass(status: string) {
  switch (status) {
    case "paid":
    case "checked_in":
    case "completed":
    case "signed":
      return styles.toneGood;
    case "pending":
    case "awaiting_payment":
    case "missing":
    case "guardian_required":
    case "confirmed":
      return styles.toneWarn;
    case "failed":
    case "expired":
    case "no_show":
    case "void":
      return styles.toneBad;
    default:
      return styles.toneNeutral;
  }
}

function slotToneClass(state: AvailabilitySlot["state"]) {
  if (state === "available") return styles.slotAvailable;
  if (state === "limited") return styles.slotLimited;
  return styles.slotFull;
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

function defaultCreateForm(date: string): CreateFormState {
  return {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    time: "",
    throwers: 2,
    booking_source: "walk_in",
    booking_type: "open",
    customer_notes: "",
    internal_notes: "",
  };
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
    throw new Error((json as any)?.error || `Request failed: ${res.status}`);
  }

  return json as T;
}

export default function StaffTodayPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateInputValue);
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(() =>
    defaultCreateForm(getLocalDateInputValue())
  );
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);

  async function loadBoard(date = selectedDate) {
    try {
      setLoading(true);
      setError("");
      const json = await opsFetch<TodayResponse>(
        `/api/admin/bookings-today?date=${encodeURIComponent(date)}`
      );
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailability(date: string, throwers: number) {
    try {
      setAvailabilityLoading(true);
      const json = await opsFetch<AvailabilityResponse>(
        `/availability?date=${encodeURIComponent(date)}&throwers=${encodeURIComponent(
          String(throwers)
        )}`
      );
      setAvailability(json.slots || []);
    } catch (_err) {
      setAvailability([]);
    } finally {
      setAvailabilityLoading(false);
    }
  }

  useEffect(() => {
    loadBoard(selectedDate);
    setExpanded(null);
  }, [selectedDate]);

  useEffect(() => {
    if (!showCreateModal) return;
    loadAvailability(selectedDate, createForm.throwers);
  }, [showCreateModal, selectedDate, createForm.throwers]);

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

    return {
      outstanding,
      percentCollected,
      attentionCount: bookings.filter(isAttentionBooking).length,
      missingWaivers: bookings.filter((row) => row.waiver_status !== "signed").length,
      unpaidCount: bookings.filter((row) => row.payment_status !== "paid").length,
    };
  }, [data]);

  const filteredBookings = useMemo(() => {
    const rows = [...(data?.bookings || [])].sort((a, b) => {
      const priorityDiff = getPriorityScore(a) - getPriorityScore(b);
      if (priorityDiff !== 0) return priorityDiff;
      return a.start_time.localeCompare(b.start_time);
    });

    if (filter === "all") return rows;
    if (filter === "attention") return rows.filter(isAttentionBooking);
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
      await loadBoard(selectedDate);
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

  function openCreateModal() {
    setCreateError("");
    setCreateForm(defaultCreateForm(selectedDate));
    setAvailability([]);
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    if (createBusy) return;
    setShowCreateModal(false);
    setCreateError("");
  }

  function updateCreateField<K extends keyof CreateFormState>(
    key: K,
    value: CreateFormState[K]
  ) {
    setCreateForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function submitCreateBooking(payment_status: "pending" | "paid") {
    try {
      setCreateBusy(true);
      setCreateError("");

      const payload: CreateBookingPayload = {
        date: selectedDate,
        time: createForm.time,
        throwers: Number(createForm.throwers),
        customer: {
          first_name: createForm.first_name,
          last_name: createForm.last_name,
          email: createForm.email || null,
          phone: createForm.phone || null,
        },
        booking_source: createForm.booking_source,
        booking_type: createForm.booking_type,
        customer_notes: createForm.customer_notes || "",
        internal_notes: createForm.internal_notes || "",
        payment_status,
      };

      await opsFetch<CreateBookingResponse>("/api/admin/create-booking", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setShowCreateModal(false);
      setCreateForm(defaultCreateForm(selectedDate));
      await loadBoard(selectedDate);
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create booking");
    } finally {
      setCreateBusy(false);
    }
  }

  return (
    <>
      <main className={styles.page}>
        <div className={styles.shell}>
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <div>
                <div className={styles.kicker}>Tex Axes Staff Board</div>
                <h1 className={styles.title}>Operations Board</h1>
                <p className={styles.subtitle}>
                  Live front-desk command surface for today, tomorrow, and future
                  bookings. Staff can review, adjust, and create bookings directly.
                </p>
                <div className={styles.metaRow}>
                  <span className={styles.metaPill}>Connected: {OPS_API_BASE}</span>
                  <span className={styles.metaPill}>Selected Date: {data?.date || selectedDate}</span>
                </div>
              </div>

              <div className={styles.heroActions}>
                <button
                  onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
                  className={styles.secondaryButton}
                >
                  ← Prev
                </button>

                <button
                  onClick={() => setSelectedDate(getLocalDateInputValue())}
                  className={styles.secondaryButton}
                >
                  Today
                </button>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={styles.dateInput}
                />

                <button
                  onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
                  className={styles.secondaryButton}
                >
                  Next →
                </button>

                <button onClick={() => loadBoard(selectedDate)} className={styles.secondaryButton}>
                  Refresh Board
                </button>

                <button onClick={openCreateModal} className={styles.primaryButton}>
                  + New Booking
                </button>
              </div>
            </div>
          </section>

          {loading ? (
            <div className={styles.messageCard}>Loading board...</div>
          ) : error ? (
            <div className={`${styles.messageCard} ${styles.errorCard}`}>{error}</div>
          ) : (
            <>
              {derived.attentionCount > 0 ? (
                <section className={styles.attentionStrip}>
                  <div>
                    <div className={styles.attentionLabel}>Attention Required</div>
                    <div className={styles.attentionTitle}>
                      {derived.attentionCount} booking
                      {derived.attentionCount === 1 ? "" : "s"} need action
                    </div>
                  </div>
                  <div className={styles.attentionMetrics}>
                    <span className={styles.attentionPill}>
                      Unpaid: {derived.unpaidCount}
                    </span>
                    <span className={styles.attentionPill}>
                      Waivers pending: {derived.missingWaivers}
                    </span>
                  </div>
                </section>
              ) : null}

              <section className={styles.statsGrid}>
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

              <section className={styles.filterBar}>
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
                      className={active ? styles.filterActive : styles.filterButton}
                    >
                      {label}
                    </button>
                  );
                })}
              </section>

              <section className={styles.board}>
                <div className={styles.tableHead}>
                  <div>Time</div>
                  <div>Guest / Group</div>
                  <div>Details</div>
                  <div>Payment</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className={styles.emptyWrap}>
                    <div className={styles.emptyCard}>
                      <div className={styles.emptyKicker}>Clear Board</div>
                      <div className={styles.emptyTitle}>No bookings match this view.</div>
                      <p className={styles.emptyText}>
                        This is now a valid empty operational state, not an error.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredBookings.map((row) => {
                    const isExpanded = expanded === row.booking_id;
                    const busy = busyId === row.booking_id;

                    const boardDate = data?.date || selectedDate;
                    const now = new Date();
                    const start = new Date(`${boardDate}T${row.start_time}`);
                    const minutesAway = (start.getTime() - now.getTime()) / 60000;

                    const isSelectedDateToday = boardDate === getLocalDateInputValue();
                    const urgent =
                      isSelectedDateToday &&
                      minutesAway <= 30 &&
                      minutesAway >= -30 &&
                      row.booking_status !== "checked_in" &&
                      row.booking_status !== "completed";

                    const late =
                      isSelectedDateToday &&
                      minutesAway < -30 &&
                      row.booking_status !== "checked_in" &&
                      row.booking_status !== "completed" &&
                      row.booking_status !== "no_show";

                    const attention = isAttentionBooking(row);

                    const rowClassName = [
                      styles.row,
                      late ? styles.rowLate : "",
                      urgent ? styles.rowUrgent : "",
                      attention ? styles.rowAttention : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div key={row.booking_id} className={rowClassName}>
                        <div className={styles.rowGrid}>
                          <div>
                            <div className={styles.timePrimary}>{formatTime(row.start_time)}</div>
                            <div className={styles.timeSecondary}>{formatTime(row.end_time)}</div>
                            {late ? (
                              <div className={styles.lateLabel}>Past due check-in</div>
                            ) : urgent ? (
                              <div className={styles.urgentLabel}>Starting now</div>
                            ) : null}
                          </div>

                          <div>
                            <div className={styles.customerRow}>
                              <div className={styles.customerName}>{row.customer_name}</div>
                              {attention ? (
                                <span className={styles.attentionTag}>Needs attention</span>
                              ) : null}
                            </div>

                            <div className={styles.contactBlock}>
                              {row.email ? (
                                <a href={`mailto:${row.email}`} className={styles.contactLink}>
                                  {row.email}
                                </a>
                              ) : (
                                <div className={styles.contactMuted}>No email</div>
                              )}

                              {row.phone ? (
                                <a href={`tel:${row.phone}`} className={styles.contactLinkMuted}>
                                  {row.phone}
                                </a>
                              ) : (
                                <div className={styles.contactMuted}>No phone</div>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className={styles.detailStrong}>Party of {row.party_size}</div>
                            <div className={styles.detailMuted}>
                              {(row.booking_type || "open").replaceAll("_", " ")} ·{" "}
                              {(row.booking_source || "unknown").replaceAll("_", " ")}
                            </div>
                            <div className={styles.detailMuted}>
                              Bays: {row.bays_allocated ?? "-"} ·{" "}
                              {(row.allocation_mode || "-").replaceAll("_", " ")}
                            </div>
                          </div>

                          <div>
                            <StatusPill
                              label={row.payment_status}
                              className={toneClass(row.payment_status)}
                            />
                            <div className={styles.paymentStrong}>
                              Due: {formatMoney(row.total_amount)}
                            </div>
                            <div className={styles.paymentMuted}>
                              Paid: {formatMoney(row.amount_paid)}
                            </div>
                            <div className={styles.paymentStrong}>
                              Outstanding:{" "}
                              {formatMoney(
                                Math.max(
                                  0,
                                  Number(row.total_amount || 0) - Number(row.amount_paid || 0)
                                )
                              )}
                            </div>
                          </div>

                          <div className={styles.statusGroup}>
                            <StatusPill
                              label={row.booking_status}
                              className={toneClass(row.booking_status)}
                            />
                            <StatusPill
                              label={row.waiver_status}
                              className={toneClass(row.waiver_status)}
                            />
                          </div>

                          <div className={styles.actionStack}>
                            <div className={styles.actionGroup}>
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
                                className={styles.successButton}
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
                                className={styles.warnButton}
                              >
                                Mark Unpaid
                              </button>
                            </div>

                            <div className={styles.actionGroup}>
                              <button
                                disabled={busy}
                                onClick={() =>
                                  applyUpdate(row.booking_id, {
                                    booking_status: "checked_in",
                                  })
                                }
                                className={styles.infoButton}
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
                                className={styles.ghostButton}
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
                                className={styles.dangerButton}
                              >
                                No Show
                              </button>

                              <button
                                disabled={busy}
                                onClick={() => setExpanded(isExpanded ? null : row.booking_id)}
                                className={styles.secondaryButton}
                              >
                                {isExpanded ? "Hide" : "Details"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {isExpanded ? (
                          <div className={styles.expandPanel}>
                            <div className={styles.expandGrid}>
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
                              <div className={styles.detailBox}>
                                <div className={styles.detailTitle}>Quick Adjust</div>

                                <div className={styles.quickInfo}>
                                  <div>
                                    Waiver:{" "}
                                    <span className={styles.quickStrong}>
                                      {row.waiver_status.replaceAll("_", " ")}
                                    </span>
                                  </div>
                                  <div>
                                    Booking ID:{" "}
                                    <span className={styles.codeText}>{row.booking_id}</span>
                                  </div>
                                </div>

                                <div className={styles.quickActions}>
                                  <button
                                    onClick={() => handleEditPartySize(row)}
                                    className={styles.ghostButton}
                                  >
                                    Edit Party Size
                                  </button>
                                  <button
                                    onClick={() => handleEditNotes(row)}
                                    className={styles.ghostButton}
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

      {showCreateModal ? (
        <div className={styles.modalOverlay} onClick={closeCreateModal}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalKicker}>Staff Booking Entry</div>
                <h2 className={styles.modalTitle}>Create Booking</h2>
                <p className={styles.modalText}>
                  Add walk-ins, phone bookings, admin holds, and future reservations.
                </p>
              </div>

              <button onClick={closeCreateModal} className={styles.modalCloseButton}>
                ✕
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Party Size</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={createForm.throwers}
                  onChange={(e) =>
                    updateCreateField("throwers", Math.max(1, Number(e.target.value || 1)))
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>First Name</label>
                <input
                  type="text"
                  value={createForm.first_name}
                  onChange={(e) => updateCreateField("first_name", e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Last Name</label>
                <input
                  type="text"
                  value={createForm.last_name}
                  onChange={(e) => updateCreateField("last_name", e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Phone</label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => updateCreateField("phone", e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => updateCreateField("email", e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Booking Source</label>
                <select
                  value={createForm.booking_source}
                  onChange={(e) =>
                    updateCreateField(
                      "booking_source",
                      e.target.value as CreateFormState["booking_source"]
                    )
                  }
                  className={styles.input}
                >
                  <option value="walk_in">Walk-In</option>
                  <option value="admin">Admin</option>
                  <option value="phone">Phone</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Booking Type</label>
                <select
                  value={createForm.booking_type}
                  onChange={(e) =>
                    updateCreateField(
                      "booking_type",
                      e.target.value as CreateFormState["booking_type"]
                    )
                  }
                  className={styles.input}
                >
                  <option value="open">Open</option>
                  <option value="corporate">Corporate</option>
                  <option value="league">League</option>
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Available Time Slots</label>
              <div className={styles.slotGrid}>
                {availabilityLoading ? (
                  <div className={styles.slotLoading}>Checking availability...</div>
                ) : availability.length === 0 ? (
                  <div className={styles.slotLoading}>No available slots found for this date.</div>
                ) : (
                  availability.map((slot) => {
                    const selected = createForm.time === slot.start;
                    const disabled = slot.state === "full";
                    const className = [
                      styles.slotButton,
                      slotToneClass(slot.state),
                      selected ? styles.slotSelected : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <button
                        key={`${slot.time_block_id}-${slot.start}`}
                        type="button"
                        disabled={disabled}
                        onClick={() => updateCreateField("time", slot.start)}
                        className={className}
                      >
                        <span className={styles.slotTime}>
                          {formatTime(`${slot.start}:00`)}
                        </span>
                        <span className={styles.slotMeta}>
                          {slot.state} · bays open {slot.open_bays}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className={styles.formGridSingle}>
              <div className={styles.field}>
                <label className={styles.label}>Customer Notes</label>
                <textarea
                  value={createForm.customer_notes}
                  onChange={(e) => updateCreateField("customer_notes", e.target.value)}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Internal Notes</label>
                <textarea
                  value={createForm.internal_notes}
                  onChange={(e) => updateCreateField("internal_notes", e.target.value)}
                  className={styles.textarea}
                />
              </div>
            </div>

            {createError ? <div className={styles.createError}>{createError}</div> : null}

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => submitCreateBooking("pending")}
                disabled={createBusy}
                className={styles.warnButton}
              >
                Create Unpaid
              </button>

              <button
                type="button"
                onClick={() => submitCreateBooking("paid")}
                disabled={createBusy}
                className={styles.successButton}
              >
                Create + Mark Paid
              </button>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={createBusy}
                className={styles.secondaryButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );
}

function StatusPill({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return <span className={`${styles.pill} ${className}`}>{label.replaceAll("_", " ")}</span>;
}

function DetailBox({ title, value }: { title: string; value: string }) {
  return (
    <div className={styles.detailBox}>
      <div className={styles.detailTitle}>{title}</div>
      <pre className={styles.detailValue}>{value}</pre>
    </div>
  );
}
