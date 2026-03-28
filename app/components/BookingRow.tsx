"use client";

import styles from "../page.module.css";
import {
  formatMoney,
  formatTime,
  formatLabel,
} from "../lib/format";
import {
  isAttentionBooking,
  normalizeTaxExemptStatus,
  toneClass,
  getBookingTimingState,
} from "../lib/booking-logic";
import { StatusPill } from "./StatusPill";
import { BookingExpandedPanel } from "./BookingExpandedPanel";
import type { BookingRow as BookingRowType } from "../types";

type Props = {
  row: BookingRowType;
  expanded: boolean;
  toggleExpand: () => void;

  busy: boolean;
  tabBusy: boolean;

  bookingTab: any;
  boardDate: string;

  // actions
  onMarkPaid: () => void;
  onMarkUnpaid: () => void;
  onCheckIn: () => void;
  onComplete: () => void;
  onNoShow: () => void;

  onOpenWaiver: () => void;
  onCopyWaiver: () => void;
  onEnsureTab: () => void;
  onAddItem: () => void;
  onPayment: () => void;

  onEditPartySize: () => void;
  onEditNotes: () => void;
  onMarkTaxCollected: () => void;
};

export function BookingRow({
  row,
  expanded,
  toggleExpand,
  busy,
  tabBusy,
  bookingTab,
  boardDate,

  onMarkPaid,
  onMarkUnpaid,
  onCheckIn,
  onComplete,
  onNoShow,

  onOpenWaiver,
  onCopyWaiver,
  onEnsureTab,
  onAddItem,
  onPayment,

  onEditPartySize,
  onEditNotes,
  onMarkTaxCollected,
}: Props) {
  const taxStatus = normalizeTaxExemptStatus(row);
  const attention = isAttentionBooking(row);
  const { urgent, late } = getBookingTimingState(row, boardDate);

  const rowClass = [
    styles.row,
    late ? styles.rowLate : "",
    urgent ? styles.rowUrgent : "",
    attention ? styles.rowAttention : "",
  ].join(" ");

  return (
    <div className={rowClass}>
      <div className={styles.rowGrid}>
        {/* TIME */}
        <div>
          <div className={styles.timePrimary}>{formatTime(row.start_time)}</div>
          <div className={styles.timeSecondary}>{formatTime(row.end_time)}</div>
        </div>

        {/* CUSTOMER */}
        <div>
          <div className={styles.customerRow}>
            <div className={styles.customerName}>{row.customer_name}</div>
            {attention && (
              <span className={styles.attentionTag}>Needs attention</span>
            )}
          </div>

          <div className={styles.contactBlock}>
            {row.email || "No email"}
            <br />
            {row.phone || "No phone"}
          </div>
        </div>

        {/* DETAILS */}
        <div>
          <div className={styles.detailStrong}>Party of {row.party_size}</div>
          <div className={styles.detailMuted}>
            Waivers: {row.waiver_signed ?? 0} /{" "}
            {row.waiver_required ?? row.party_size}
          </div>

          <div className={styles.detailMuted}>
            {formatLabel(row.booking_type)} · {formatLabel(row.booking_source)}
          </div>

          {bookingTab && (
            <div className={styles.detailMuted}>
              Tab: {formatMoney(bookingTab.tab.grand_total)} · Balance{" "}
              {formatMoney(bookingTab.tab.balance_due)}
            </div>
          )}
        </div>

        {/* PAYMENT */}
        <div>
          <StatusPill
            label={row.payment_status}
            className={toneClass(row.payment_status)}
          />
          <div>Due: {formatMoney(row.total_amount)}</div>
          <div>Paid: {formatMoney(row.amount_paid)}</div>
        </div>

        {/* STATUS */}
        <div className={styles.statusGroup}>
          <StatusPill
            label={row.booking_status}
            className={toneClass(row.booking_status)}
          />
          <StatusPill
            label={row.waiver_status}
            className={toneClass(row.waiver_status)}
          />

          {taxStatus && (
            <StatusPill
              label={taxStatus}
              className={toneClass(taxStatus)}
            />
          )}
        </div>

        {/* ACTIONS */}
        <div className={styles.actionStack}>
          <button onClick={onMarkPaid} disabled={busy}>
            Mark Paid
          </button>
          <button onClick={onCheckIn} disabled={busy}>
            Check In
          </button>
          <button onClick={onEnsureTab} disabled={tabBusy}>
            Open Tab
          </button>
          <button onClick={onPayment} disabled={tabBusy}>
            Payment
          </button>
          <button onClick={toggleExpand}>
            {expanded ? "Hide" : "Details"}
          </button>
        </div>
      </div>

      {expanded && (
        <BookingExpandedPanel
          row={row}
          taxStatus={taxStatus}
          bookingTab={bookingTab}
          tabBusy={tabBusy}
          onOpenWaiver={onOpenWaiver}
          onCopyWaiver={onCopyWaiver}
          onEditPartySize={onEditPartySize}
          onEditNotes={onEditNotes}
          onEnsureTab={onEnsureTab}
          onMarkTaxCollected={onMarkTaxCollected}
        />
      )}
    </div>
  );
}
