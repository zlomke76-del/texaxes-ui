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

type WaiverStatus =
  | "complete"
  | "partial"
  | "missing"
  | "guardian_required"
  | "expired"
  | "unknown";

type TaxExemptStatus = "pending_form" | "verified" | "unknown";
type TabType = "booking" | "walk_in" | "spectator" | "retail_only";
type TabStatus = "open" | "closed" | "void";
type ItemType = "booking" | "drink" | "snack" | "retail" | "axe" | "custom";
type TabPaymentMethod =
  | "online_stripe"
  | "in_store_terminal"
  | "cash"
  | "comp"
  | "manual_adjustment";

type BookingRow = {
  booking_id: string;
  customer_id: string;
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
  waiver_required?: number;
  waiver_signed?: number;
  waiver_url: string;
  total_amount: number;
  amount_paid: number;
  customer_notes: string | null;
  internal_notes: string | null;
  allocation_mode: string | null;
  bays_allocated: number | null;
  created_at: string | null;
  tax_exempt?: boolean | null;
  tax_exempt_reason?: string | null;
  tax_exempt_status?: TaxExemptStatus | null;
  tax_exempt_form_collected_at?: string | null;
};

type Summary = {
  booking_count: number;
  paid_count: number;
  unpaid_count: number;
  checked_in_count: number;
  completed_count: number;
  expected_revenue: number;
  collected_revenue: number;
  waiver_complete_count?: number;
  waiver_partial_count?: number;
  waiver_missing_count?: number;
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
  | "no_show"
  | "tax_exempt";

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
  tax_exempt?: boolean;
  tax_exempt_reason?: string | null;
  tax_exempt_status?: TaxExemptStatus | null;
};

type CreateBookingResponse = {
  success: true;
  booking_id: string;
  customer_id: string;
  booking_status: string;
  payment_status: string;
  waiver_url: string;
  waiver_email_sent?: boolean;
  waiver_email_error?: string | null;
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
  tax_exempt: boolean;
  tax_exempt_reason: string;
  tax_exempt_form_collected: boolean;
  tax_exempt_note: string;
};

type TabSummaryRow = {
  id: string;
  booking_id: string | null;
  customer_id: string | null;
  tab_type: TabType;
  status: TabStatus;
  party_name: string | null;
  party_size: number;
  notes: string | null;
  subtotal: number;
  tax_total: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  customer?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  booking?: {
    id?: string;
    booking_type?: string | null;
    booking_source?: string | null;
    status?: string | null;
    party_size?: number | null;
  } | null;
};

type ListOpenTabsResponse = {
  success: boolean;
  summary: {
    count: number;
    open_count: number;
    total_balance_due: number;
    total_grand_total: number;
    total_amount_paid: number;
  };
  tabs: TabSummaryRow[];
};

type TabLineItem = {
  id: string;
  tab_id: string;
  item_type: ItemType;
  description: string;
  quantity: number;
  unit_price: number;
  taxable: boolean;
  tax_rate: number;
  tax_exempt_override: boolean;
  tax_exempt_reason: string | null;
  line_subtotal: number;
  line_tax: number;
  line_total: number;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type TabPayment = {
  id: string;
  tab_id: string;
  payment_method: TabPaymentMethod;
  status: "pending" | "completed" | "void";
  amount: number;
  reference: string | null;
  note: string | null;
  collected_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type TabDetailResponse = {
  success: boolean;
  tab: {
    id: string;
    booking_id: string | null;
    customer_id: string | null;
    tab_type: TabType;
    status: TabStatus;
    party_name: string | null;
    party_size: number;
    notes: string | null;
    subtotal: number;
    tax_total: number;
    grand_total: number;
    amount_paid: number;
    balance_due: number;
    opened_at: string | null;
    closed_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    customers?: {
      id?: string;
      first_name?: string;
      last_name?: string;
      email?: string | null;
      phone?: string | null;
    } | null;
    bookings?: {
      id?: string;
      booking_type?: string | null;
      booking_source?: string | null;
      status?: string | null;
      party_size?: number | null;
      total_amount?: number | null;
      amount_paid?: number | null;
      tax_exempt?: boolean | null;
      tax_exempt_reason?: string | null;
      tax_exempt_status?: string | null;
      customer_notes?: string | null;
      internal_notes?: string | null;
    } | null;
  };
  line_items: TabLineItem[];
  payments: TabPayment[];
};

type CreateTabResponse = {
  success: boolean;
  tab: TabSummaryRow;
};

type AddItemFormState = {
  bookingKey: string;
  tabId: string;
  item_type: ItemType;
  description: string;
  quantity: number;
  unit_price: string;
  taxable: boolean;
  tax_exempt_override: boolean;
  tax_exempt_reason: string;
  note: string;
  size: string;
};

type PaymentFormState = {
  bookingKey: string;
  tabId: string;
  amount: string;
  payment_method: TabPaymentMethod;
  reference: string;
  note: string;
  collected_by: string;
};

const OPS_API_BASE =
  process.env.NEXT_PUBLIC_TEXAXES_OPS_URL?.replace(/\/+$/, "") ||
  "https://texaxes-ops.vercel.app";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const ITEM_PRESETS: Array<{
  key: string;
  label: string;
  item_type: ItemType;
  description: string;
  unit_price: number;
  taxable: boolean;
  defaultQuantity?: number;
  requiresSize?: boolean;
}> = [
  {
    key: "coke",
    label: "Coke",
    item_type: "drink",
    description: "Coke",
    unit_price: 3.5,
    taxable: true,
    defaultQuantity: 1,
  },
  {
    key: "water",
    label: "Water",
    item_type: "drink",
    description: "Water",
    unit_price: 3.0,
    taxable: false,
    defaultQuantity: 1,
  },
  {
    key: "shirt",
    label: "Shirt",
    item_type: "retail",
    description: "Tex Axes Shirt",
    unit_price: 35,
    taxable: true,
    defaultQuantity: 1,
    requiresSize: true,
  },
  {
    key: "axe",
    label: "Retail Axe",
    item_type: "axe",
    description: "Retail Axe",
    unit_price: 125,
    taxable: true,
    defaultQuantity: 1,
  },
];

function formatMoney(value: number) {
  return money.format(Number(value || 0));
}

function formatTime(value: string) {
  const [hour, minute] = String(value || "00:00:00")
    .split(":")
    .map(Number);
  const date = new Date();
  date.setHours(hour || 0, minute || 0, 0, 0);
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTime(value?: string | null) {
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

function getLocalDateInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function shiftDate(dateString: string, days: number) {
  const d = new Date(`${dateString}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function normalizeTaxExemptStatus(
  row: Pick<BookingRow, "tax_exempt" | "tax_exempt_status" | "internal_notes">
): TaxExemptStatus | null {
  if (!row.tax_exempt) return null;
  if (
    row.tax_exempt_status === "pending_form" ||
    row.tax_exempt_status === "verified"
  ) {
    return row.tax_exempt_status;
  }

  const notes = (row.internal_notes || "").toLowerCase();
  if (notes.includes("tax exempt") && notes.includes("collect tax exempt form")) {
    return "pending_form";
  }
  if (notes.includes("tax exempt") && notes.includes("form collected")) {
    return "verified";
  }

  return "unknown";
}

function formatLabel(value: string | null | undefined) {
  return String(value || "unknown").replaceAll("_", " ");
}

function toneClass(status: string) {
  switch (status) {
    case "paid":
    case "checked_in":
    case "completed":
    case "complete":
    case "verified":
    case "open":
      return styles.toneGood;
    case "pending":
    case "awaiting_payment":
    case "missing":
    case "partial":
    case "guardian_required":
    case "confirmed":
    case "pending_form":
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
  const taxStatus = normalizeTaxExemptStatus(row);

  return (
    row.payment_status !== "paid" ||
    row.waiver_status !== "complete" ||
    row.booking_status === "awaiting_payment" ||
    taxStatus === "pending_form"
  );
}

function getPriorityScore(row: BookingRow) {
  const taxStatus = normalizeTaxExemptStatus(row);

  if (row.booking_status === "awaiting_payment") return 0;
  if (row.payment_status !== "paid") return 1;
  if (row.waiver_status !== "complete") return 2;
  if (taxStatus === "pending_form") return 3;
  if (row.booking_status === "checked_in") return 4;
  if (row.booking_status === "completed") return 6;
  if (row.booking_status === "no_show") return 7;
  return 5;
}

function defaultCreateForm(): CreateFormState {
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
    tax_exempt: false,
    tax_exempt_reason: "",
    tax_exempt_form_collected: false,
    tax_exempt_note: "",
  };
}

function buildTaxInternalNotes(form: CreateFormState) {
  if (!form.tax_exempt) {
    return form.internal_notes.trim();
  }

  const lines = [
    "[TAX EXEMPT]",
    form.tax_exempt_reason
      ? `Reason: ${formatLabel(form.tax_exempt_reason)}`
      : "Reason: not specified",
    form.tax_exempt_form_collected
      ? "Tax exempt form collected."
      : "Collect tax exempt form.",
  ];

  if (form.tax_exempt_note.trim()) {
    lines.push(`Tax note: ${form.tax_exempt_note.trim()}`);
  }

  if (form.internal_notes.trim()) {
    lines.push(form.internal_notes.trim());
  }

  return lines.join("\n");
}

function buildAddItemForm(
  bookingKey: string,
  tabId: string,
  preset?: (typeof ITEM_PRESETS)[number]
): AddItemFormState {
  return {
    bookingKey,
    tabId,
    item_type: preset?.item_type || "custom",
    description: preset?.description || "",
    quantity: preset?.defaultQuantity || 1,
    unit_price: String(preset?.unit_price ?? ""),
    taxable: preset?.taxable ?? true,
    tax_exempt_override: false,
    tax_exempt_reason: "",
    note: "",
    size: "",
  };
}

function buildPaymentForm(
  bookingKey: string,
  tabId: string,
  balanceDue = 0
): PaymentFormState {
  return {
    bookingKey,
    tabId,
    amount: balanceDue > 0 ? balanceDue.toFixed(2) : "",
    payment_method: "in_store_terminal",
    reference: "",
    note: "",
    collected_by: "",
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
  const [toast, setToast] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(() =>
    defaultCreateForm()
  );
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);

  const [tabBusyId, setTabBusyId] = useState<string | null>(null);
  const [tabDetailsByBooking, setTabDetailsByBooking] = useState<
    Record<string, TabDetailResponse | null>
  >({});
  const [openTabsSummary, setOpenTabsSummary] = useState<ListOpenTabsResponse | null>(
    null
  );
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
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

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

  async function loadOpenTabs(status: TabStatus = "open") {
    try {
      setOpenTabsLoading(true);
      const response = await opsFetch<ListOpenTabsResponse>(
        `/api/admin/list-open-tabs?status=${encodeURIComponent(status)}`
      );
      setOpenTabsSummary(response);
    } catch (err) {
      console.error("Failed to load open tabs", err);
    } finally {
      setOpenTabsLoading(false);
    }
  }

  useEffect(() => {
    loadBoard(selectedDate);
    setExpanded(null);
  }, [selectedDate]);

  useEffect(() => {
    loadOpenTabs("open");
  }, []);

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
        taxExemptCount: 0,
        taxFormsPending: 0,
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
      missingWaivers: bookings.reduce(
        (sum, row) =>
          sum +
          Math.max(
            0,
            (row.waiver_required ?? row.party_size) - (row.waiver_signed ?? 0)
          ),
        0
      ),
      unpaidCount: bookings.filter((row) => row.payment_status !== "paid").length,
      taxExemptCount: bookings.filter((row) => !!row.tax_exempt).length,
      taxFormsPending: bookings.filter(
        (row) => normalizeTaxExemptStatus(row) === "pending_form"
      ).length,
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
    if (filter === "tax_exempt") {
      return rows.filter((row) => !!row.tax_exempt);
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
      setToast("Booking updated");
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

  async function handleCopyWaiverLink(row: BookingRow) {
    try {
      await navigator.clipboard.writeText(row.waiver_url);
      setToast("Waiver link copied");
    } catch {
      window.prompt("Copy waiver link", row.waiver_url);
    }
  }

  async function handleMarkTaxFormCollected(row: BookingRow) {
    const currentNotes = row.internal_notes?.trim() || "";
    const collectLine = "Collect tax exempt form.";
    const verifiedLine = "Tax exempt form collected.";
    const nextNotes = currentNotes.replace(collectLine, verifiedLine).trim();

    await applyUpdate(row.booking_id, {
      tax_exempt_status: "verified",
      internal_notes: nextNotes,
    });
  }

  function handleOpenWaiver(row: BookingRow) {
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
        tax_exempt_reason: createForm.tax_exempt
          ? createForm.tax_exempt_reason
          : null,
        tax_exempt_status: createForm.tax_exempt
          ? createForm.tax_exempt_form_collected
            ? "verified"
            : "pending_form"
          : null,
      };

      const created = await opsFetch<CreateBookingResponse>(
        "/api/admin/create-booking",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

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
    const response = await opsFetch<ListOpenTabsResponse>(
      `/api/admin/list-open-tabs?status=open&search=${encodeURIComponent(bookingId)}`
    );

    return response.tabs.find((tab) => tab.booking_id === bookingId) || null;
  }

  async function loadTab(tabId: string, bookingIdForStore?: string) {
    const detail = await opsFetch<TabDetailResponse>(
      `/api/admin/get-tab?tab_id=${encodeURIComponent(tabId)}`
    );

    const bookingKey = bookingIdForStore || detail.tab.booking_id || detail.tab.id;

    setTabDetailsByBooking((prev) => ({
      ...prev,
      [bookingKey]: detail,
    }));

    return detail;
  }

  async function ensureBookingTab(row: BookingRow) {
    try {
      setTabBusyId(row.booking_id);

      let found = await findOpenTabForBooking(row.booking_id);

      if (!found) {
        const created = await opsFetch<CreateTabResponse>("/api/admin/create-tab", {
          method: "POST",
          body: JSON.stringify({
            booking_id: row.booking_id,
            customer_id: row.customer_id,
            tab_type: "booking",
            party_name: row.customer_name,
            party_size: row.party_size,
            notes: `Auto-created from booking ${row.booking_id}`,
          }),
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

  async function createStandaloneTab(tabType: Exclude<TabType, "booking">) {
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

      const created = await opsFetch<CreateTabResponse>("/api/admin/create-tab", {
        method: "POST",
        body: JSON.stringify({
          tab_type: tabType,
          party_name: partyName.trim() || null,
          party_size: partySize,
        }),
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
    row: BookingRow,
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

      const description =
        addItemForm.size.trim()
          ? `${addItemForm.description.trim()} - ${addItemForm.size.trim()}`
          : addItemForm.description.trim();

      await opsFetch("/api/admin/add-line-item", {
        method: "POST",
        body: JSON.stringify({
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
        }),
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

  async function openPaymentModalForBooking(row: BookingRow) {
    let detail = tabDetailsByBooking[row.booking_id];
    if (!detail) {
      detail = await ensureBookingTab(row);
    }
    if (!detail?.tab?.id) return;

    setPaymentError("");
    setPaymentForm(
      buildPaymentForm(row.booking_id, detail.tab.id, detail.tab.balance_due)
    );
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

      await opsFetch("/api/admin/add-payment", {
        method: "POST",
        body: JSON.stringify({
          tab_id: paymentForm.tabId,
          amount,
          payment_method: paymentForm.payment_method,
          reference: paymentForm.reference.trim() || null,
          note: paymentForm.note.trim() || null,
          collected_by: paymentForm.collected_by.trim() || null,
        }),
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

      await opsFetch("/api/admin/update-tab-status", {
        method: "POST",
        body: JSON.stringify({
          tab_id: detail.tab.id,
          status,
          note: note.trim() || null,
        }),
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

      await opsFetch("/api/admin/void-line-item", {
        method: "POST",
        body: JSON.stringify({
          line_item_id: lineItemId,
          note: note.trim() || null,
        }),
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

      await opsFetch("/api/admin/void-payment", {
        method: "POST",
        body: JSON.stringify({
          payment_id: paymentId,
          note: note.trim() || null,
        }),
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
                    Selected Date: {data?.date || selectedDate}
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

                <button
                  onClick={() => loadBoard(selectedDate)}
                  className={styles.secondaryButton}
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
                {(
                  [
                    ["all", "All"],
                    ["attention", "Attention"],
                    ["upcoming", "Upcoming"],
                    ["unpaid", "Unpaid"],
                    ["checked_in", "Checked In"],
                    ["completed", "Completed"],
                    ["no_show", "No Show"],
                    ["tax_exempt", "Tax Exempt"],
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
                    const tabBusy = tabBusyId === row.booking_id;
                    const taxStatus = normalizeTaxExemptStatus(row);
                    const bookingTab = tabDetailsByBooking[row.booking_id];

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
                              Waivers: {row.waiver_signed ?? 0} /{" "}
                              {row.waiver_required ?? row.party_size}
                            </div>
                            <div className={styles.detailMuted}>
                              {(row.booking_type || "open").replaceAll("_", " ")} ·{" "}
                              {(row.booking_source || "unknown").replaceAll("_", " ")}
                            </div>
                            <div className={styles.detailMuted}>
                              Bays: {row.bays_allocated ?? "-"} ·{" "}
                              {(row.allocation_mode || "-").replaceAll("_", " ")}
                            </div>
                            {row.tax_exempt ? (
                              <div className={styles.detailMuted}>
                                Tax reason: {formatLabel(row.tax_exempt_reason)}
                              </div>
                            ) : null}
                            {bookingTab ? (
                              <div className={styles.detailMuted}>
                                Tab: {formatMoney(bookingTab.tab.grand_total)} · Balance{" "}
                                {formatMoney(bookingTab.tab.balance_due)}
                              </div>
                            ) : null}
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
                            {row.tax_exempt ? (
                              <StatusPill
                                label="tax_exempt"
                                className={styles.taxExemptPill}
                              />
                            ) : null}
                            {taxStatus ? (
                              <StatusPill
                                label={
                                  taxStatus === "pending_form"
                                    ? "form_required"
                                    : "form_verified"
                                }
                                className={toneClass(taxStatus)}
                              />
                            ) : null}
                            {bookingTab ? (
                              <StatusPill
                                label={`tab_${bookingTab.tab.status}`}
                                className={toneClass(bookingTab.tab.status)}
                              />
                            ) : null}
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

                            <div className={styles.actionGroup}>
                              <button
                                type="button"
                                onClick={() => handleOpenWaiver(row)}
                                className={styles.waiverButton}
                              >
                                Open Waiver
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyWaiverLink(row)}
                                className={styles.secondaryButton}
                              >
                                Copy Link
                              </button>
                              <button
                                type="button"
                                disabled={tabBusy}
                                onClick={() => ensureBookingTab(row)}
                                className={styles.primaryButton}
                              >
                                {bookingTab ? "Refresh Tab" : "Open Tab"}
                              </button>
                              <button
                                type="button"
                                disabled={tabBusy}
                                onClick={() => openAddItemModalForBooking(row, ITEM_PRESETS[0])}
                                className={styles.secondaryButton}
                              >
                                + Item
                              </button>
                              <button
                                type="button"
                                disabled={tabBusy}
                                onClick={() => openPaymentModalForBooking(row)}
                                className={styles.successButton}
                              >
                                Payment
                              </button>
                              {row.tax_exempt && taxStatus === "pending_form" ? (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleMarkTaxFormCollected(row)}
                                  className={styles.taxButton}
                                >
                                  Mark Form Collected
                                </button>
                              ) : null}
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
                              <DetailBox
                                title="Tax Handling"
                                value={
                                  row.tax_exempt
                                    ? `Tax Exempt: Yes\nReason: ${formatLabel(
                                        row.tax_exempt_reason
                                      )}\nForm Status: ${formatLabel(
                                        taxStatus || "unknown"
                                      )}\nCollected At: ${
                                        row.tax_exempt_form_collected_at || "Not recorded"
                                      }`
                                    : "Tax Exempt: No"
                                }
                              />
                              <div className={styles.detailBox}>
                                <div className={styles.detailTitle}>Waiver + Quick Adjust</div>

                                <div className={styles.quickInfo}>
                                  <div>
                                    Waiver:{" "}
                                    <span className={styles.quickStrong}>
                                      {row.waiver_status.replaceAll("_", " ")}
                                    </span>
                                  </div>
                                  <div>
                                    Signed:{" "}
                                    <span className={styles.quickStrong}>
                                      {row.waiver_signed ?? 0} /{" "}
                                      {row.waiver_required ?? row.party_size}
                                    </span>
                                  </div>
                                  <div>
                                    Booking ID:{" "}
                                    <span className={styles.codeText}>{row.booking_id}</span>
                                  </div>
                                  <div className={styles.waiverUrlBlock}>
                                    <span className={styles.quickStrong}>Waiver URL:</span>
                                    <a
                                      href={row.waiver_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={styles.waiverLink}
                                    >
                                      {row.waiver_url}
                                    </a>
                                  </div>
                                </div>

                                <div className={styles.quickActions}>
                                  <button
                                    onClick={() => handleOpenWaiver(row)}
                                    className={styles.waiverButton}
                                  >
                                    Open Waiver
                                  </button>
                                  <button
                                    onClick={() => handleCopyWaiverLink(row)}
                                    className={styles.ghostButton}
                                  >
                                    Copy Waiver Link
                                  </button>
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
                                  <button
                                    onClick={() => ensureBookingTab(row)}
                                    disabled={tabBusy}
                                    className={styles.primaryButton}
                                  >
                                    {bookingTab ? "Refresh Tab" : "Open Tab"}
                                  </button>
                                  {row.tax_exempt && taxStatus === "pending_form" ? (
                                    <button
                                      onClick={() => handleMarkTaxFormCollected(row)}
                                      className={styles.taxButton}
                                    >
                                      Mark Form Collected
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {bookingTab ? (
                              <div className={styles.tabPanel}>
                                <div className={styles.tabHeader}>
                                  <div>
                                    <div className={styles.detailTitle}>Live Tab / Invoice</div>
                                    <div className={styles.tabTitleRow}>
                                      <h3 className={styles.tabTitle}>
                                        {bookingTab.tab.party_name || row.customer_name || "Open Tab"}
                                      </h3>
                                      <div className={styles.statusGroup}>
                                        <StatusPill
                                          label={bookingTab.tab.tab_type}
                                          className={styles.toneNeutral}
                                        />
                                        <StatusPill
                                          label={bookingTab.tab.status}
                                          className={toneClass(bookingTab.tab.status)}
                                        />
                                      </div>
                                    </div>
                                    <div className={styles.tabMeta}>
                                      Opened {formatDateTime(bookingTab.tab.opened_at)} · Tab ID{" "}
                                      <span className={styles.codeText}>{bookingTab.tab.id}</span>
                                    </div>
                                  </div>

                                  <div className={styles.tabActions}>
                                    <button
                                      className={styles.secondaryButton}
                                      disabled={tabBusy}
                                      onClick={() => refreshExistingTab(row.booking_id)}
                                    >
                                      Refresh Tab
                                    </button>
                                    <button
                                      className={styles.secondaryButton}
                                      disabled={tabBusy}
                                      onClick={() =>
                                        openAddItemModalForBooking(row, ITEM_PRESETS[0])
                                      }
                                    >
                                      + Coke
                                    </button>
                                    <button
                                      className={styles.secondaryButton}
                                      disabled={tabBusy}
                                      onClick={() =>
                                        openAddItemModalForBooking(row, ITEM_PRESETS[1])
                                      }
                                    >
                                      + Water
                                    </button>
                                    <button
                                      className={styles.secondaryButton}
                                      disabled={tabBusy}
                                      onClick={() =>
                                        openAddItemModalForBooking(row, ITEM_PRESETS[2])
                                      }
                                    >
                                      + Shirt
                                    </button>
                                    <button
                                      className={styles.secondaryButton}
                                      disabled={tabBusy}
                                      onClick={() =>
                                        openAddItemModalForBooking(row, ITEM_PRESETS[3])
                                      }
                                    >
                                      + Axe
                                    </button>
                                    <button
                                      className={styles.primaryButton}
                                      disabled={tabBusy}
                                      onClick={() => openAddItemModalForBooking(row)}
                                    >
                                      + Custom Item
                                    </button>
                                    <button
                                      className={styles.successButton}
                                      disabled={tabBusy}
                                      onClick={() => openPaymentModalForBooking(row)}
                                    >
                                      Record Payment
                                    </button>
                                    <button
                                      className={styles.infoButton}
                                      disabled={tabBusy || bookingTab.tab.status !== "open"}
                                      onClick={() =>
                                        updateTabStatusPrompt(row.booking_id, "closed")
                                      }
                                    >
                                      Close Tab
                                    </button>
                                    <button
                                      className={styles.dangerButton}
                                      disabled={tabBusy || bookingTab.tab.status === "void"}
                                      onClick={() =>
                                        updateTabStatusPrompt(row.booking_id, "void")
                                      }
                                    >
                                      Void Tab
                                    </button>
                                  </div>
                                </div>

                                <div className={styles.tabSummaryGrid}>
                                  <div className={styles.tabMetricCard}>
                                    <div className={styles.statLabel}>Subtotal</div>
                                    <div className={styles.tabMetricValue}>
                                      {formatMoney(bookingTab.tab.subtotal)}
                                    </div>
                                  </div>
                                  <div className={styles.tabMetricCard}>
                                    <div className={styles.statLabel}>Tax</div>
                                    <div className={styles.tabMetricValue}>
                                      {formatMoney(bookingTab.tab.tax_total)}
                                    </div>
                                  </div>
                                  <div className={styles.tabMetricCard}>
                                    <div className={styles.statLabel}>Grand Total</div>
                                    <div className={styles.tabMetricValue}>
                                      {formatMoney(bookingTab.tab.grand_total)}
                                    </div>
                                  </div>
                                  <div className={styles.tabMetricCard}>
                                    <div className={styles.statLabel}>Paid</div>
                                    <div className={styles.tabMetricValue}>
                                      {formatMoney(bookingTab.tab.amount_paid)}
                                    </div>
                                  </div>
                                  <div className={styles.tabMetricCard}>
                                    <div className={styles.statLabel}>Balance Due</div>
                                    <div className={styles.tabMetricValue}>
                                      {formatMoney(bookingTab.tab.balance_due)}
                                    </div>
                                  </div>
                                </div>

                                <div className={styles.tabBodyGrid}>
                                  <div className={styles.tabTableCard}>
                                    <div className={styles.detailTitle}>Line Items</div>
                                    {bookingTab.line_items.length === 0 ? (
                                      <div className={styles.emptyMini}>
                                        No line items on this tab yet.
                                      </div>
                                    ) : (
                                      <div className={styles.tabTable}>
                                        <div className={styles.tabTableHead}>
                                          <div>Item</div>
                                          <div>Qty</div>
                                          <div>Tax</div>
                                          <div>Total</div>
                                          <div>Action</div>
                                        </div>
                                        {bookingTab.line_items.map((item) => {
                                          const isVoided =
                                            (item.note || "").includes("[VOID LINE ITEM]") ||
                                            item.line_total === 0;
                                          return (
                                            <div
                                              key={item.id}
                                              className={`${styles.tabTableRow} ${
                                                isVoided ? styles.tabRowVoided : ""
                                              }`}
                                            >
                                              <div>
                                                <div className={styles.tabItemName}>
                                                  {item.description}
                                                </div>
                                                <div className={styles.tabItemMeta}>
                                                  {formatLabel(item.item_type)} ·{" "}
                                                  {item.tax_exempt_override
                                                    ? "tax exempt override"
                                                    : item.taxable
                                                    ? "taxable"
                                                    : "non-taxable"}
                                                </div>
                                              </div>
                                              <div>{item.quantity}</div>
                                              <div>{formatMoney(item.line_tax)}</div>
                                              <div>{formatMoney(item.line_total)}</div>
                                              <div>
                                                <button
                                                  className={styles.ghostButton}
                                                  disabled={tabBusy || isVoided}
                                                  onClick={() =>
                                                    voidLineItem(row.booking_id, item.id)
                                                  }
                                                >
                                                  Void
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  <div className={styles.tabTableCard}>
                                    <div className={styles.detailTitle}>Payments</div>
                                    {bookingTab.payments.length === 0 ? (
                                      <div className={styles.emptyMini}>
                                        No payments recorded on this tab yet.
                                      </div>
                                    ) : (
                                      <div className={styles.tabTable}>
                                        <div className={styles.tabTableHead}>
                                          <div>Method</div>
                                          <div>Amount</div>
                                          <div>Status</div>
                                          <div>When</div>
                                          <div>Action</div>
                                        </div>
                                        {bookingTab.payments.map((payment) => (
                                          <div
                                            key={payment.id}
                                            className={`${styles.tabTableRow} ${
                                              payment.status === "void"
                                                ? styles.tabRowVoided
                                                : ""
                                            }`}
                                          >
                                            <div>
                                              <div className={styles.tabItemName}>
                                                {formatLabel(payment.payment_method)}
                                              </div>
                                              <div className={styles.tabItemMeta}>
                                                {payment.reference || payment.note || "—"}
                                              </div>
                                            </div>
                                            <div>{formatMoney(payment.amount)}</div>
                                            <div>
                                              <StatusPill
                                                label={payment.status}
                                                className={toneClass(payment.status)}
                                              />
                                            </div>
                                            <div>{formatDateTime(payment.created_at)}</div>
                                            <div>
                                              <button
                                                className={styles.ghostButton}
                                                disabled={tabBusy || payment.status === "void"}
                                                onClick={() =>
                                                  voidPayment(row.booking_id, payment.id)
                                                }
                                              >
                                                Void
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className={styles.tabPanelPlaceholder}>
                                <div className={styles.detailTitle}>Tab / Invoice</div>
                                <p className={styles.emptyText}>
                                  Open a tab to add drinks, retail, custom charges, and
                                  in-store payments against this booking.
                                </p>
                                <button
                                  className={styles.primaryButton}
                                  disabled={tabBusy}
                                  onClick={() => ensureBookingTab(row)}
                                >
                                  Open Tab
                                </button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </section>

              <section className={styles.openTabsPanel}>
                <div className={styles.openTabsHeader}>
                  <div>
                    <div className={styles.detailTitle}>Open Tabs Snapshot</div>
                    <h2 className={styles.openTabsTitle}>Floor Commerce</h2>
                  </div>
                  <div className={styles.openTabsActions}>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => loadOpenTabs("open")}
                      disabled={openTabsLoading}
                    >
                      Refresh Open Tabs
                    </button>
                  </div>
                </div>

                {openTabsLoading ? (
                  <div className={styles.messageCard}>Loading open tabs...</div>
                ) : !openTabsSummary || openTabsSummary.tabs.length === 0 ? (
                  <div className={styles.emptyMini}>No open tabs right now.</div>
                ) : (
                  <>
                    <div className={styles.openTabsStats}>
                      <div className={styles.tabMetricCard}>
                        <div className={styles.statLabel}>Open Tabs</div>
                        <div className={styles.tabMetricValue}>
                          {openTabsSummary.summary.open_count}
                        </div>
                      </div>
                      <div className={styles.tabMetricCard}>
                        <div className={styles.statLabel}>Open Tab Total</div>
                        <div className={styles.tabMetricValue}>
                          {formatMoney(openTabsSummary.summary.total_grand_total)}
                        </div>
                      </div>
                      <div className={styles.tabMetricCard}>
                        <div className={styles.statLabel}>Collected</div>
                        <div className={styles.tabMetricValue}>
                          {formatMoney(openTabsSummary.summary.total_amount_paid)}
                        </div>
                      </div>
                      <div className={styles.tabMetricCard}>
                        <div className={styles.statLabel}>Balance Due</div>
                        <div className={styles.tabMetricValue}>
                          {formatMoney(openTabsSummary.summary.total_balance_due)}
                        </div>
                      </div>
                    </div>

                    <div className={styles.openTabsList}>
                      {openTabsSummary.tabs.map((tab) => (
                        <div key={tab.id} className={styles.openTabCard}>
                          <div className={styles.openTabTop}>
                            <div>
                              <div className={styles.customerName}>
                                {tab.party_name ||
                                  tab.customer?.full_name ||
                                  `${formatLabel(tab.tab_type)} tab`}
                              </div>
                              <div className={styles.detailMuted}>
                                {formatLabel(tab.tab_type)} · party of {tab.party_size}
                              </div>
                              <div className={styles.detailMuted}>
                                Opened {formatDateTime(tab.opened_at)}
                              </div>
                            </div>
                            <div className={styles.statusGroup}>
                              <StatusPill
                                label={tab.status}
                                className={toneClass(tab.status)}
                              />
                            </div>
                          </div>

                          <div className={styles.openTabMetrics}>
                            <span className={styles.attentionPill}>
                              Total {formatMoney(tab.grand_total)}
                            </span>
                            <span className={styles.attentionPill}>
                              Paid {formatMoney(tab.amount_paid)}
                            </span>
                            <span className={styles.attentionPill}>
                              Balance {formatMoney(tab.balance_due)}
                            </span>
                          </div>

                          <div className={styles.openTabMeta}>
                            {tab.booking_id ? (
                              <span className={styles.codeText}>
                                Booking: {tab.booking_id}
                              </span>
                            ) : (
                              <span className={styles.codeText}>Standalone tab</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
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
              <label className={styles.label}>Tax Handling</label>

              <div className={styles.taxPanel}>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={createForm.tax_exempt}
                    onChange={(e) =>
                      updateCreateField("tax_exempt", e.target.checked)
                    }
                  />
                  <span>Tax Exempt</span>
                </label>

                {createForm.tax_exempt ? (
                  <div className={styles.taxGrid}>
                    <div className={styles.field}>
                      <label className={styles.label}>Tax Exempt Reason</label>
                      <select
                        value={createForm.tax_exempt_reason}
                        onChange={(e) =>
                          updateCreateField("tax_exempt_reason", e.target.value)
                        }
                        className={styles.input}
                      >
                        <option value="">Select reason</option>
                        <option value="nonprofit">Nonprofit</option>
                        <option value="school_government">School / Government</option>
                        <option value="resale">Resale</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Tax Exempt Note</label>
                      <input
                        type="text"
                        value={createForm.tax_exempt_note}
                        onChange={(e) =>
                          updateCreateField("tax_exempt_note", e.target.value)
                        }
                        className={styles.input}
                        placeholder="Optional certificate or note"
                      />
                    </div>

                    <div className={styles.taxChecklist}>
                      <label className={styles.checkboxRow}>
                        <input
                          type="checkbox"
                          checked={createForm.tax_exempt_form_collected}
                          onChange={(e) =>
                            updateCreateField(
                              "tax_exempt_form_collected",
                              e.target.checked
                            )
                          }
                        />
                        <span>Form collected</span>
                      </label>

                      {!createForm.tax_exempt_form_collected ? (
                        <div className={styles.taxWarning}>
                          Tax exempt form must be collected and tracked on this booking.
                        </div>
                      ) : (
                        <div className={styles.taxVerified}>
                          Tax exempt form marked as collected.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Available Time Slots</label>
              <div className={styles.slotGrid}>
                {availabilityLoading ? (
                  <div className={styles.slotLoading}>Checking availability...</div>
                ) : availability.length === 0 ? (
                  <div className={styles.slotLoading}>
                    No available slots found for this date.
                  </div>
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

      {showAddItemModal && addItemForm ? (
        <div className={styles.modalOverlay} onClick={closeAddItemModal}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalKicker}>Tab Line Item</div>
                <h2 className={styles.modalTitle}>Add Item</h2>
                <p className={styles.modalText}>
                  Quick-add concessions, retail, and custom charges to the live tab.
                </p>
              </div>

              <button onClick={closeAddItemModal} className={styles.modalCloseButton}>
                ✕
              </button>
            </div>

            <div className={styles.filterBar}>
              {ITEM_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  className={styles.filterButton}
                  onClick={() =>
                    setAddItemForm(
                      buildAddItemForm(addItemForm.bookingKey, addItemForm.tabId, preset)
                    )
                  }
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Item Type</label>
                <select
                  value={addItemForm.item_type}
                  onChange={(e) =>
                    updateAddItemField("item_type", e.target.value as ItemType)
                  }
                  className={styles.input}
                >
                  <option value="drink">Drink</option>
                  <option value="snack">Snack</option>
                  <option value="retail">Retail</option>
                  <option value="axe">Axe</option>
                  <option value="custom">Custom</option>
                  <option value="booking">Booking</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <input
                  type="text"
                  value={addItemForm.description}
                  onChange={(e) => updateAddItemField("description", e.target.value)}
                  className={styles.input}
                  placeholder="Coke, Tex Axes Shirt, Retail Axe..."
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={addItemForm.quantity}
                  onChange={(e) =>
                    updateAddItemField(
                      "quantity",
                      Math.max(1, Number(e.target.value || 1))
                    )
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Unit Price</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={addItemForm.unit_price}
                  onChange={(e) => updateAddItemField("unit_price", e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Size / Variant</label>
                <select
                  value={addItemForm.size}
                  onChange={(e) => updateAddItemField("size", e.target.value)}
                  className={styles.input}
                >
                  <option value="">None</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="2XL">2XL</option>
                  <option value="3XL">3XL</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Note</label>
                <input
                  type="text"
                  value={addItemForm.note}
                  onChange={(e) => updateAddItemField("note", e.target.value)}
                  className={styles.input}
                  placeholder="Optional note"
                />
              </div>
            </div>

            <div className={styles.taxPanel}>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={addItemForm.taxable}
                  onChange={(e) => updateAddItemField("taxable", e.target.checked)}
                />
                <span>Taxable item</span>
              </label>

              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={addItemForm.tax_exempt_override}
                  onChange={(e) =>
                    updateAddItemField("tax_exempt_override", e.target.checked)
                  }
                />
                <span>Tax exempt override for this line</span>
              </label>

              {addItemForm.tax_exempt_override ? (
                <div className={styles.field}>
                  <label className={styles.label}>Tax Exempt Reason</label>
                  <input
                    type="text"
                    value={addItemForm.tax_exempt_reason}
                    onChange={(e) =>
                      updateAddItemField("tax_exempt_reason", e.target.value)
                    }
                    className={styles.input}
                    placeholder="Reason for item-level exemption"
                  />
                </div>
              ) : null}
            </div>

            {addItemError ? <div className={styles.createError}>{addItemError}</div> : null}

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={submitAddItemModal}
                disabled={addItemBusy}
                className={styles.primaryButton}
              >
                Add Item
              </button>

              <button
                type="button"
                onClick={closeAddItemModal}
                disabled={addItemBusy}
                className={styles.secondaryButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPaymentModal && paymentForm ? (
        <div className={styles.modalOverlay} onClick={closePaymentModal}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalKicker}>Tab Payment</div>
                <h2 className={styles.modalTitle}>Record Payment</h2>
                <p className={styles.modalText}>
                  Record card terminal, cash, comp, or manual adjustment payments.
                </p>
              </div>

              <button onClick={closePaymentModal} className={styles.modalCloseButton}>
                ✕
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Amount</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => updatePaymentField("amount", e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Payment Method</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) =>
                    updatePaymentField(
                      "payment_method",
                      e.target.value as TabPaymentMethod
                    )
                  }
                  className={styles.input}
                >
                  <option value="in_store_terminal">In-Store Terminal</option>
                  <option value="cash">Cash</option>
                  <option value="online_stripe">Online Stripe</option>
                  <option value="comp">Comp</option>
                  <option value="manual_adjustment">Manual Adjustment</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Reference</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => updatePaymentField("reference", e.target.value)}
                  className={styles.input}
                  placeholder="Receipt / last4 / terminal ref"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Collected By</label>
                <input
                  type="text"
                  value={paymentForm.collected_by}
                  onChange={(e) => updatePaymentField("collected_by", e.target.value)}
                  className={styles.input}
                  placeholder="Staff name"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Note</label>
              <textarea
                value={paymentForm.note}
                onChange={(e) => updatePaymentField("note", e.target.value)}
                className={styles.textarea}
              />
            </div>

            {paymentError ? <div className={styles.createError}>{paymentError}</div> : null}

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={submitPaymentModal}
                disabled={paymentBusy}
                className={styles.successButton}
              >
                Record Payment
              </button>

              <button
                type="button"
                onClick={closePaymentModal}
                disabled={paymentBusy}
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
  return (
    <span className={`${styles.pill} ${className}`}>
      {label.replaceAll("_", " ")}
    </span>
  );
}

function DetailBox({ title, value }: { title: string; value: string }) {
  return (
    <div className={styles.detailBox}>
      <div className={styles.detailTitle}>{title}</div>
      <pre className={styles.detailValue}>{value}</pre>
    </div>
  );
}
