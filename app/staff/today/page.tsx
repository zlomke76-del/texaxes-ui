"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { FILTER_OPTIONS, ITEM_PRESETS, OPS_API_BASE } from "./constants";
import {
  addLineItem,
  addPayment,
  createBooking,
  createTab,
  getAvailability,
  getBookingsToday,
  getOpenTabs,
  getTab,
  updateBooking,
  updateTabStatus,
  voidLineItemRequest,
  voidPaymentRequest,
} from "./lib/api";
import {
  buildAddItemForm,
  buildPaymentForm,
  buildTaxInternalNotes,
  defaultCreateForm,
  deriveMetrics,
  getPriorityScore,
  isAttentionBooking,
} from "./lib/booking-logic";
import {
  formatLabel,
  formatMoney,
  getLocalDateInputValue,
  shiftDate,
} from "./lib/format";
import { CreateBookingModal } from "./components/CreateBookingModal";
import { AddItemModal } from "./components/AddItemModal";
import { PaymentModal } from "./components/PaymentModal";
import { StatCard } from "./components/StatCard";
import { BookingRow } from "./components/BookingRow";
import { OpenTabsSnapshot } from "./components/OpenTabsSnapshot";
import type {
  AddItemFormState,
  BookingRow as BookingRowType,
  CreateBookingPayload,
  CreateFormState,
  FilterKey,
  ListOpenTabsResponse,
  PaymentFormState,
  TabDetailResponse,
  TabStatus,
  TodayResponse,
} from "./types";

export default function StaffTodayPage() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(() => defaultCreateForm());
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availability, setAvailability] = useState<any[]>([]);

  const [tabBusyId, setTabBusyId] = useState<string | null>(null);
  const [tabDetailsByBooking, setTabDetailsByBooking] = useState<
    Record<string, TabDetailResponse | null>
  >({});
  const [openTabsSummary, setOpenTabsSummary] = useState<ListOpenTabsResponse | null>(null);
  const [openTabsLoading, setOpenTabsLoading] = useState(false);

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemBusy, setAddItemBusy] = useState(false);
  const [addItemError, setAddItemError] = useState("");
  const [addItemForm, setAddItemForm] = useState<AddItemFormState | null>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentForm, setPaymentForm] = useState<PaymentFormState | null>(null);

  useEffect(() => {
    setSelectedDate(getLocalDateInputValue());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function loadBoard(date = selectedDate) {
    if (!date) return;

    try {
      setLoading(true);
      setError("");
      const json = await getBookingsToday(date);
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailability(date: string, throwers: number) {
    if (!date) {
      setAvailability([]);
      return;
    }

    try {
      setAvailabilityLoading(true);
      const json = await getAvailability(date, throwers);
      setAvailability(json.slots || []);
    } catch {
      setAvailability([]);
    } finally {
      setAvailabilityLoading(false);
    }
  }

  async function loadOpenTabs(status: TabStatus = "open") {
    try {
      setOpenTabsLoading(true);
      const response = await getOpenTabs(status);
      setOpenTabsSummary(response);
    } catch (err) {
      console.error("Failed to load open tabs", err);
    } finally {
      setOpenTabsLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedDate) return;
    loadBoard(selectedDate);
    setExpanded(null);
  }, [selectedDate]);

  useEffect(() => {
    loadOpenTabs("open");
  }, []);

  useEffect(() => {
    if (!showCreateModal || !selectedDate) return;
    loadAvailability(selectedDate, createForm.throwers);
  }, [showCreateModal, selectedDate, createForm.throwers]);

  const derived = useMemo(() => deriveMetrics(data), [data]);

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
    if (filter === "tax_exempt") {
      return rows.filter((row) => !!row.tax_exempt);
    }
    if (filter === "upcoming") {
      return rows.filter((row) =>
        ["pending", "awaiting_payment", "confirmed", "paid"].includes(row.booking_status)
      );
    }

    return rows;
  }, [data, filter]);

  async function applyUpdate(bookingId: string, updates: Record<string, unknown>) {
    try {
      setBusyId(bookingId);
      await updateBooking(bookingId, updates);
      await loadBoard(selectedDate);
      setToast("Booking updated");
    } catch (err: any) {
      alert(err?.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleEditNotes(row: BookingRowType) {
    const next = window.prompt(
      "Update internal notes",
      row.internal_notes || row.customer_notes || ""
    );
    if (next === null) return;
    await applyUpdate(row.booking_id, { internal_notes: next });
  }

  async function handleEditPartySize(row: BookingRowType) {
    const next = window.prompt("Update party size", String(row.party_size || 1));
    if (next === null) return;

    const size = Number(next);
    if (!Number.isInteger(size) || size <= 0) {
      alert("Invalid party size");
      return;
    }

    await applyUpdate(row.booking_id, { party_size: size });
  }

  async function handleCopyWaiverLink(row: BookingRowType) {
    try {
      await navigator.clipboard.writeText(row.waiver_url);
      setToast("Waiver link copied");
    } catch {
      window.prompt("Copy waiver link", row.waiver_url);
    }
  }

  async function handleMarkTaxFormCollected(row: BookingRowType) {
    const currentNotes = row.internal_notes?.trim() || "";
    const collectLine = "Collect tax exempt form.";
    const verifiedLine = "Tax exempt form collected.";
    const nextNotes = currentNotes.replace(collectLine, verifiedLine).trim();

    await applyUpdate(row.booking_id, {
      tax_exempt_status: "verified",
      internal_notes: nextNotes,
    });
  }

  function handleOpenWaiver(row: BookingRowType) {
    window.open(row.waiver_url, "_blank", "noopener,noreferrer");
  }

  function openCreateModal() {
    setCreateError("");
    setCreateForm(defaultCreateForm());
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
    setCreateForm((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };

      if (key === "tax_exempt" && !value) {
        next.tax_exempt_reason = "";
        next.tax_exempt_form_collected = false;
        next.tax_exempt_note = "";
      }

      return next;
    });
  }

  async function submitCreateBooking(payment_status: "pending" | "paid") {
    try {
      setCreateBusy(true);
      setCreateError("");

      if (!selectedDate) {
        setCreateError("Select a date before creating the booking.");
        return;
      }

      if (!createForm.time) {
        setCreateError("Select a time slot before creating the booking.");
        return;
      }

      if (!createForm.first_name.trim() || !createForm.last_name.trim()) {
        setCreateError("First and last name are required.");
        return;
      }

      if (createForm.tax_exempt && !createForm.tax_exempt_reason) {
        setCreateError("Select a tax exempt reason.");
        return;
      }

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
        internal_notes: buildTaxInternalNotes(createForm),
        payment_status,
        tax_exempt: createForm.tax_exempt,
        tax_exempt_reason: createForm.tax_exempt ? createForm.tax_exempt_reason : null,
        tax_exempt_status: createForm.tax_exempt
          ? createForm.tax_exempt_form_collected
            ? "verified"
            : "pending_form"
          : null,
      };

      const created = await createBooking(payload);

      setShowCreateModal(false);
      setCreateForm(defaultCreateForm());
      await loadBoard(selectedDate);

      if (created.waiver_email_sent) {
        setToast("Booking created and waiver emailed");
      } else if (created.waiver_url) {
        setToast("Booking created. Open or copy the waiver link.");
      } else {
        setToast("Booking created");
      }
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create booking");
    } finally {
      setCreateBusy(false);
    }
  }

  async function findOpenTabForBooking(bookingId: string) {
    const response = await getOpenTabs("open", bookingId);
    return response.tabs.find((tab) => tab.booking_id === bookingId) || null;
  }

  async function loadTab(tabId: string, bookingIdForStore?: string) {
    const detail = await getTab(tabId);
    const bookingKey = bookingIdForStore || detail.tab.booking_id || detail.tab.id;

    setTabDetailsByBooking((prev) => ({
      ...prev,
      [bookingKey]: detail,
    }));

    return detail;
  }

  async function ensureBookingTab(row: BookingRowType) {
    try {
      setTabBusyId(row.booking_id);

      let found = await findOpenTabForBooking(row.booking_id);

      if (!found) {
        const created = await createTab({
          booking_id: row.booking_id,
          customer_id: row.customer_id,
          tab_type: "booking",
          party_name: row.customer_name,
          party_size: row.party_size,
          notes: `Auto-created from booking ${row.booking_id}`,
        });

        found = created.tab;
      }

      const detail = await loadTab(found.id, row.booking_id);
      await loadOpenTabs("open");
      setToast("Tab ready");
      return detail;
    } catch (err: any) {
      alert(err?.message || "Failed to open tab");
      return null;
    } finally {
      setTabBusyId(null);
    }
  }

  async function createStandaloneTab(tabType: "walk_in" | "spectator" | "retail_only") {
    const partyName = window.prompt("Party / tab name");
    if (partyName === null) return;

    const partySizeInput = window.prompt("Party size", "1");
    if (partySizeInput === null) return;

    const partySize = Math.max(1, Number(partySizeInput || 1));
    if (!Number.isInteger(partySize) || partySize <= 0) {
      alert("Invalid party size");
      return;
    }

    try {
      setTabBusyId(`new-${tabType}`);

      const created = await createTab({
        tab_type: tabType,
        party_name: partyName.trim() || null,
        party_size: partySize,
      });

      await loadOpenTabs("open");
      setToast(`${formatLabel(tabType)} tab created`);

      const detail = await loadTab(created.tab.id, created.tab.id);
      setExpanded(created.tab.id);
      setTabDetailsByBooking((prev) => ({
        ...prev,
        [created.tab.id]: detail,
      }));
    } catch (err: any) {
      alert(err?.message || "Failed to create tab");
    } finally {
      setTabBusyId(null);
    }
  }

  async function refreshExistingTab(bookingKey: string) {
    const detail = tabDetailsByBooking[bookingKey];
    if (!detail?.tab?.id) return;

    try {
      setTabBusyId(bookingKey);
      await loadTab(detail.tab.id, bookingKey);
      await loadOpenTabs("open");
    } catch (err: any) {
      alert(err?.message || "Failed to refresh tab");
    } finally {
      setTabBusyId(null);
    }
  }

  async function openAddItemModalForBooking(
    row: BookingRowType,
    preset?: (typeof ITEM_PRESETS)[number]
  ) {
    let detail = tabDetailsByBooking[row.booking_id];
    if (!detail) {
      detail = await ensureBookingTab(row);
    }
    if (!detail?.tab?.id) return;

    setAddItemError("");
    setAddItemForm(buildAddItemForm(row.booking_id, detail.tab.id, preset));
    setShowAddItemModal(true);
  }

  function closeAddItemModal() {
    if (addItemBusy) return;
    setShowAddItemModal(false);
    setAddItemError("");
    setAddItemForm(null);
  }

  function updateAddItemField<K extends keyof AddItemFormState>(
    key: K,
    value: AddItemFormState[K]
  ) {
    setAddItemForm((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      if (key === "tax_exempt_override" && !value) {
        next.tax_exempt_reason = "";
      }
      return next;
    });
  }

  function applyAddItemPreset(presetKey: string) {
    const preset = ITEM_PRESETS.find((item) => item.key === presetKey);
    if (!preset || !addItemForm) return;

    setAddItemForm(buildAddItemForm(addItemForm.bookingKey, addItemForm.tabId, preset));
  }

  async function submitAddItemModal() {
    if (!addItemForm) return;

    const quantity = Number(addItemForm.quantity);
    const unitPrice = Number(addItemForm.unit_price);

    if (!addItemForm.description.trim()) {
      setAddItemError("Description is required.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setAddItemError("Quantity must be at least 1.");
      return;
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      setAddItemError("Unit price must be 0 or greater.");
      return;
    }

    if (addItemForm.tax_exempt_override && !addItemForm.tax_exempt_reason.trim()) {
      setAddItemError("Tax exempt reason is required when override is on.");
      return;
    }

    try {
      setAddItemBusy(true);
      setAddItemError("");

      const description = addItemForm.size.trim()
        ? `${addItemForm.description.trim()} - ${addItemForm.size.trim()}`
        : addItemForm.description.trim();

      await addLineItem({
        tab_id: addItemForm.tabId,
        item_type: addItemForm.item_type,
        description,
        quantity,
        unit_price: unitPrice,
        taxable: addItemForm.taxable,
        tax_exempt_override: addItemForm.tax_exempt_override,
        tax_exempt_reason: addItemForm.tax_exempt_override
          ? addItemForm.tax_exempt_reason.trim()
          : null,
        note: addItemForm.note.trim() || null,
      });

      await refreshExistingTab(addItemForm.bookingKey);
      closeAddItemModal();
      setToast("Line item added");
    } catch (err: any) {
      setAddItemError(err?.message || "Failed to add item");
    } finally {
      setAddItemBusy(false);
    }
  }

  async function openPaymentModalForBooking(row: BookingRowType) {
    let detail = tabDetailsByBooking[row.booking_id];
    if (!detail) {
      detail = await ensureBookingTab(row);
    }
    if (!detail?.tab?.id) return;

    setPaymentError("");
    setPaymentForm(buildPaymentForm(row.booking_id, detail.tab.id, detail.tab.balance_due));
    setShowPaymentModal(true);
  }

  function closePaymentModal() {
    if (paymentBusy) return;
    setShowPaymentModal(false);
    setPaymentError("");
    setPaymentForm(null);
  }

  function updatePaymentField<K extends keyof PaymentFormState>(
    key: K,
    value: PaymentFormState[K]
  ) {
    setPaymentForm((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  }

  async function submitPaymentModal() {
    if (!paymentForm) return;

    const amount = Number(paymentForm.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      setPaymentError("Amount must be 0 or greater.");
      return;
    }

    try {
      setPaymentBusy(true);
      setPaymentError("");

      await addPayment({
        tab_id: paymentForm.tabId,
        amount,
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference.trim() || null,
        note: paymentForm.note.trim() || null,
        collected_by: paymentForm.collected_by.trim() || null,
      });

      await refreshExistingTab(paymentForm.bookingKey);
      closePaymentModal();
      setToast("Payment recorded");
    } catch (err: any) {
      setPaymentError(err?.message || "Failed to record payment");
    } finally {
      setPaymentBusy(false);
    }
  }

  async function updateTabStatusPrompt(bookingKey: string, status: TabStatus) {
    const detail = tabDetailsByBooking[bookingKey];
    if (!detail?.tab?.id) return;

    const note = window.prompt(
      `Optional note for ${status} tab`,
      status === "closed" ? "Closed at front desk" : ""
    );
    if (note === null) return;

    try {
      setTabBusyId(bookingKey);

      await updateTabStatus({
        tab_id: detail.tab.id,
        status,
        note: note.trim() || null,
      });

      await refreshExistingTab(bookingKey);
      await loadOpenTabs("open");
      setToast(`Tab ${status}`);
    } catch (err: any) {
      alert(err?.message || "Failed to update tab status");
    } finally {
      setTabBusyId(null);
    }
  }

  async function voidLineItem(bookingKey: string, lineItemId: string) {
    const confirmed = window.confirm("Void this line item?");
    if (!confirmed) return;

    const note = window.prompt("Reason for void (optional)", "") ?? "";

    try {
      setTabBusyId(bookingKey);

      await voidLineItemRequest({
        line_item_id: lineItemId,
        note: note.trim() || null,
      });

      await refreshExistingTab(bookingKey);
      setToast("Line item voided");
    } catch (err: any) {
      alert(err?.message || "Failed to void line item");
    } finally {
      setTabBusyId(null);
    }
  }

  async function voidPayment(bookingKey: string, paymentId: string) {
    const confirmed = window.confirm("Void this payment?");
    if (!confirmed) return;

    const note = window.prompt("Reason for void (optional)", "") ?? "";

    try {
      setTabBusyId(bookingKey);

      await voidPaymentRequest({
        payment_id: paymentId,
        note: note.trim() || null,
      });

      await refreshExistingTab(bookingKey);
      setToast("Payment voided");
    } catch (err: any) {
      alert(err?.message || "Failed to void payment");
    } finally {
      setTabBusyId(null);
    }
  }

  return (
    <>
      <main className={styles.page}>
        <div className={styles.shell}>
          {toast ? <div className={styles.toast}>{toast}</div> : null}

          <section className={styles.hero}>
  <div className={styles.heroContent}>
    <div>
      <div className={styles.kicker}>Tex Axes Staff Board</div>
      <h1 className={styles.title}>Operations Board</h1>
      <p className={styles.subtitle}>
        Live front-desk command surface for today, tomorrow, and future
        bookings. Staff can review, adjust, create bookings, drive waiver
        completion, and manage live tabs and payments.
      </p>
      <div className={styles.metaRow}>
        <span className={styles.metaPill}>Connected: {OPS_API_BASE}</span>
        <span className={styles.metaPill}>
          Selected Date: {data?.date || selectedDate || "—"}
        </span>
        <span className={styles.metaPill}>
          Open tabs: {openTabsSummary?.summary.open_count ?? "—"}
        </span>
        <span className={styles.metaPill}>
          Open tab balance:{" "}
          {formatMoney(openTabsSummary?.summary.total_balance_due ?? 0)}
        </span>
      </div>
    </div>

    <a
      href="https://www.texaxes.com"
      target="_blank"
      rel="noopener noreferrer"
      className={styles.logoWrap}
    >
      <img
        src="/images/image_logo_tex_axes.png"
        alt="Tex Axes"
        className={styles.logo}
      />
    </a>

    <div className={styles.heroActions}>
                <button
                  onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
                  className={styles.secondaryButton}
                  disabled={!selectedDate}
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
                  disabled={!selectedDate}
                >
                  Next →
                </button>

                <button
                  onClick={() => loadBoard(selectedDate)}
                  className={styles.secondaryButton}
                  disabled={!selectedDate}
                >
                  Refresh Board
                </button>

                <button onClick={openCreateModal} className={styles.primaryButton}>
                  + New Booking
                </button>

                <button
                  onClick={() => createStandaloneTab("walk_in")}
                  disabled={tabBusyId === "new-walk_in"}
                  className={styles.secondaryButton}
                >
                  + Walk-In Tab
                </button>

                <button
                  onClick={() => createStandaloneTab("spectator")}
                  disabled={tabBusyId === "new-spectator"}
                  className={styles.secondaryButton}
                >
                  + Spectator Tab
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
                    <span className={styles.attentionPill}>
                      Tax forms pending: {derived.taxFormsPending}
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
                <StatCard label="Tax Exempt" value={String(derived.taxExemptCount)} />
              </section>

              <section className={styles.filterBar}>
                {FILTER_OPTIONS.map(([key, label]) => {
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
                  filteredBookings.map((row) => (
                    <BookingRow
                      key={row.booking_id}
                      row={row}
                      expanded={expanded === row.booking_id}
                      toggleExpand={() =>
                        setExpanded(expanded === row.booking_id ? null : row.booking_id)
                      }
                      busy={busyId === row.booking_id}
                      tabBusy={tabBusyId === row.booking_id}
                      bookingTab={tabDetailsByBooking[row.booking_id]}
                      boardDate={data?.date || selectedDate}
                      onMarkPaid={() =>
                        applyUpdate(row.booking_id, {
                          payment_status: "paid",
                          booking_status:
                            row.booking_status === "awaiting_payment"
                              ? "paid"
                              : row.booking_status,
                          amount_paid: row.total_amount,
                        })
                      }
                      onMarkUnpaid={() =>
                        applyUpdate(row.booking_id, {
                          payment_status: "pending",
                          amount_paid: 0,
                        })
                      }
                      onCheckIn={() =>
                        applyUpdate(row.booking_id, {
                          booking_status: "checked_in",
                        })
                      }
                      onComplete={() =>
                        applyUpdate(row.booking_id, {
                          booking_status: "completed",
                        })
                      }
                      onNoShow={() =>
                        applyUpdate(row.booking_id, {
                          booking_status: "no_show",
                        })
                      }
                      onOpenWaiver={() => handleOpenWaiver(row)}
                      onCopyWaiver={() => handleCopyWaiverLink(row)}
                      onEnsureTab={() => ensureBookingTab(row)}
                      onAddItem={() => openAddItemModalForBooking(row)}
                      onPayment={() => openPaymentModalForBooking(row)}
                      onEditPartySize={() => handleEditPartySize(row)}
                      onEditNotes={() => handleEditNotes(row)}
                      onMarkTaxCollected={() => handleMarkTaxFormCollected(row)}
                      onRefreshTab={() => refreshExistingTab(row.booking_id)}
                      onAddPresetItem={(preset) => openAddItemModalForBooking(row, preset)}
                      onAddCustomItem={() => openAddItemModalForBooking(row)}
                      onRecordPayment={() => openPaymentModalForBooking(row)}
                      onCloseTab={() => updateTabStatusPrompt(row.booking_id, "closed")}
                      onVoidTab={() => updateTabStatusPrompt(row.booking_id, "void")}
                      onVoidLineItem={(lineItemId) =>
                        voidLineItem(row.booking_id, lineItemId)
                      }
                      onVoidPayment={(paymentId) => voidPayment(row.booking_id, paymentId)}
                    />
                  ))
                )}
              </section>

              <OpenTabsSnapshot
                openTabsSummary={openTabsSummary}
                openTabsLoading={openTabsLoading}
                tabDetailsByBooking={tabDetailsByBooking}
                tabBusyId={tabBusyId}
                onRefreshOpenTabs={() => loadOpenTabs("open")}
                onOpenTab={async (tabId, bookingKey) => {
                  try {
                    setTabBusyId(bookingKey);
                    await loadTab(tabId, bookingKey);
                    setExpanded(bookingKey);
                    setToast("Tab loaded");
                  } catch (err: any) {
                    alert(err?.message || "Failed to load tab");
                  } finally {
                    setTabBusyId(null);
                  }
                }}
                onAddItem={async (tabId, bookingKey) => {
                  try {
                    setTabBusyId(bookingKey);
                    const tabDetail =
                      tabDetailsByBooking[bookingKey] || (await loadTab(tabId, bookingKey));
                    setAddItemError("");
                    setAddItemForm(
                      buildAddItemForm(bookingKey, tabDetail.tab.id, ITEM_PRESETS[0])
                    );
                    setShowAddItemModal(true);
                  } catch (err: any) {
                    alert(err?.message || "Failed to open item modal");
                  } finally {
                    setTabBusyId(null);
                  }
                }}
                onPayment={async (tabId, bookingKey) => {
                  try {
                    setTabBusyId(bookingKey);
                    const tabDetail =
                      tabDetailsByBooking[bookingKey] || (await loadTab(tabId, bookingKey));
                    setPaymentError("");
                    setPaymentForm(
                      buildPaymentForm(
                        bookingKey,
                        tabDetail.tab.id,
                        tabDetail.tab.balance_due
                      )
                    );
                    setShowPaymentModal(true);
                  } catch (err: any) {
                    alert(err?.message || "Failed to open payment modal");
                  } finally {
                    setTabBusyId(null);
                  }
                }}
                onCloseTab={(bookingKey) => updateTabStatusPrompt(bookingKey, "closed")}
              />
            </>
          )}
        </div>
      </main>

      <CreateBookingModal
        open={showCreateModal}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        form={createForm}
        onUpdateField={updateCreateField}
        availability={availability}
        availabilityLoading={availabilityLoading}
        busy={createBusy}
        error={createError}
        onClose={closeCreateModal}
        onSubmit={submitCreateBooking}
      />

      <AddItemModal
        open={showAddItemModal}
        form={addItemForm}
        busy={addItemBusy}
        error={addItemError}
        onClose={closeAddItemModal}
        onSubmit={submitAddItemModal}
        onUpdateField={updateAddItemField}
        onApplyPreset={applyAddItemPreset}
      />

      <PaymentModal
        open={showPaymentModal}
        form={paymentForm}
        busy={paymentBusy}
        error={paymentError}
        onClose={closePaymentModal}
        onSubmit={submitPaymentModal}
        onUpdateField={updatePaymentField}
      />
    </>
  );
}
