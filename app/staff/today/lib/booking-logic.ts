import styles from "../page.module.css";
import type {
  AddItemFormState,
  AvailabilitySlot,
  BookingRow,
  CreateFormState,
  DerivedMetrics,
  PaymentFormState,
  TaxExemptStatus,
  TodayResponse,
} from "../types";
import { formatLabel, getLocalDateInputValue } from "./format";

export function normalizeTaxExemptStatus(
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

export function toneClass(status: string) {
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

export function slotToneClass(state: AvailabilitySlot["state"]) {
  if (state === "available") return styles.slotAvailable;
  if (state === "limited") return styles.slotLimited;
  return styles.slotFull;
}

export function isAttentionBooking(row: BookingRow) {
  const taxStatus = normalizeTaxExemptStatus(row);

  return (
    row.payment_status !== "paid" ||
    row.waiver_status !== "complete" ||
    row.booking_status === "awaiting_payment" ||
    taxStatus === "pending_form"
  );
}

export function getPriorityScore(row: BookingRow) {
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

export function defaultCreateForm(): CreateFormState {
  return {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    time: "",
    throwers: 2,
    duration_hours: 1,
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

export function buildTaxInternalNotes(form: CreateFormState) {
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

export function buildAddItemForm(
  bookingKey: string,
  tabId: string,
  preset?: {
    item_type: AddItemFormState["item_type"];
    description: string;
    unit_price: number;
    taxable: boolean;
    defaultQuantity?: number;
  }
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

export function buildPaymentForm(
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

export function deriveMetrics(data: TodayResponse | null): DerivedMetrics {
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
        Math.max(0, (row.waiver_required ?? row.party_size) - (row.waiver_signed ?? 0)),
      0
    ),
    unpaidCount: bookings.filter((row) => row.payment_status !== "paid").length,
    taxExemptCount: bookings.filter((row) => !!row.tax_exempt).length,
    taxFormsPending: bookings.filter(
      (row) => normalizeTaxExemptStatus(row) === "pending_form"
    ).length,
  };
}

export function getBookingTimingState(
  row: BookingRow,
  boardDate: string
): {
  urgent: boolean;
  late: boolean;
  isSelectedDateToday: boolean;
} {
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

  return {
    urgent,
    late,
    isSelectedDateToday,
  };
}
