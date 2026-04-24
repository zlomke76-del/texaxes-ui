export type PaymentStatus = "paid" | "pending" | "failed" | "void" | "unknown";

export type BookingStatus =
  | "pending"
  | "awaiting_payment"
  | "confirmed"
  | "paid"
  | "checked_in"
  | "completed"
  | "expired"
  | "no_show"
  | "unknown";

export type WaiverStatus =
  | "complete"
  | "partial"
  | "missing"
  | "guardian_required"
  | "expired"
  | "unknown";

export type TaxExemptStatus = "pending_form" | "verified" | "unknown";

export type TabType = "booking" | "walk_in" | "spectator" | "retail_only";
export type TabStatus = "open" | "closed" | "void";
export type ItemType =
  | "booking"
  | "drink"
  | "snack"
  | "retail"
  | "axe"
  | "custom";

export type TabPaymentMethod =
  | "online_stripe"
  | "in_store_terminal"
  | "cash"
  | "comp"
  | "manual_adjustment";

export type BookingRow = {
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
  waiver_checked_in?: number;
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

export type Summary = {
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

export type TodayResponse = {
  date: string;
  summary: Summary;
  bookings: BookingRow[];
};

export type FilterKey =
  | "all"
  | "attention"
  | "upcoming"
  | "unpaid"
  | "checked_in"
  | "completed"
  | "no_show"
  | "tax_exempt";

export type AvailabilitySlot = {
  time_block_id: string;
  start: string;
  end: string;
  open_bays: number;
  total_bays: number;
  preferred_bays_required?: number;
  minimum_bays_required?: number;
  state: "available" | "limited" | "full";
  display_time?: string;
  capacity_window?: string;
  derived_half_hour?: boolean;
};

export type AvailabilityResponse = {
  date: string;
  throwers: number | null;
  slots: AvailabilitySlot[];
};

export type CreateBookingPayload = {
  date: string;
  time: string;
  throwers: number;
  duration_hours: number;
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

export type CreateBookingResponse = {
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

export type CreateFormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  time: string;
  throwers: number;
  duration_hours: 1 | 2 | 3;
  booking_source: "admin" | "walk_in" | "phone" | "corporate";
  booking_type: "open" | "league" | "corporate";
  customer_notes: string;
  internal_notes: string;
  tax_exempt: boolean;
  tax_exempt_reason: string;
  tax_exempt_form_collected: boolean;
  tax_exempt_note: string;
};

export type TabSummaryRow = {
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

export type ListOpenTabsResponse = {
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

export type TabLineItem = {
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

export type TabPayment = {
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

export type TabDetailResponse = {
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
      customer_notes?: string | null;
      internal_notes?: string | null;
    } | null;
  };
  line_items: TabLineItem[];
  payments: TabPayment[];
};

export type CreateTabResponse = {
  success: boolean;
  tab: TabSummaryRow;
};

export type AddItemFormState = {
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

export type PaymentFormState = {
  bookingKey: string;
  tabId: string;
  amount: string;
  payment_method: TabPaymentMethod;
  reference: string;
  note: string;
  collected_by: string;
};

export type DerivedMetrics = {
  outstanding: number;
  percentCollected: number;
  attentionCount: number;
  missingWaivers: number;
  unpaidCount: number;
  taxExemptCount: number;
  taxFormsPending: number;
};

export type WaiverSearchResult = {
  id: string;
  customer_id: string | null;
  booking_id: string | null;
  customer_name: string;
  email: string | null;
  phone: string | null;
  signed_at: string | null;
  expires_at: string | null;
  checked_in_at: string | null;
  checked_in_by: string | null;
  is_minor: boolean;
  guardian_customer_id: string | null;
  status: "signed" | "checked_in";
};

export type WaiverSearchResponse = {
  success: boolean;
  waivers: WaiverSearchResult[];
};

export type WaiverCheckInPayload = {
  waiver_id: string;
  booking_id?: string | null;
  checked_in_by?: string | null;
};

export type WaiverCheckInResponse = {
  success: boolean;
  waiver: {
    id: string;
    customer_id: string | null;
    booking_id: string | null;
    checked_in_at: string | null;
    checked_in_by: string | null;
  };
};
