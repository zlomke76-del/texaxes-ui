"use client";

import styles from "../page.module.css";
import {
  getBookingTimingState,
  isAttentionBooking,
  normalizeTaxExemptStatus,
  toneClass,
} from "../lib/booking-logic";
import { formatLabel, formatMoney, formatTime } from "../lib/format";
import { BookingExpandedPanel } from "./BookingExpandedPanel";
import { StatusPill } from "./StatusPill";
import { ITEM_PRESETS } from "../constants";
import type { BookingRow as BookingRowType, TabDetailResponse } from "../types";

type Props = {
  row: BookingRowType;
  expanded: boolean;
  toggleExpand: () => void;
  busy: boolean;
  tabBusy: boolean;
  bookingTab: TabDetailResponse | null | undefined;
  boardDate: string;
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
  onRefreshTab?: () => void;
  onAddPresetItem?: (preset: (typeof ITEM_PRESETS)[number]) => void;
  onAddCustomItem?: () => void;
  onRecordPayment?: () => void;
  onCloseTab?: () => void;
  onVoidTab?: () => void;
  onVoidLineItem?: (lineItemId: string) => void;
  onVoidPayment?: (paymentId: string) => void;
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
  onRefreshTab,
  onAddPresetItem,
  onAddCustomItem,
  onRecordPayment,
  onCloseTab,
  onVoidTab,
  onVoidLineItem,
  onVoidPayment,
}: Props) {
  const taxStatus = normalizeTaxExemptStatus(row);
  const { urgent, late } = getBookingTimingState(row, boardDate);
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
    <div className={rowClassName}>
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
            Waivers: {row.waiver_signed ?? 0} / {row.waiver_required ?? row.party_size}
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
          <div className={styles.paymentStrong}>Due: {formatMoney(row.total_amount)}</div>
          <div className={styles.paymentMuted}>Paid: {formatMoney(row.amount_paid)}</div>
          <div className={styles.paymentStrong}>
            Outstanding:{" "}
            {formatMoney(
              Math.max(0, Number(row.total_amount || 0) - Number(row.amount_paid || 0))
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
            <StatusPill label="tax_exempt" className={styles.taxExemptPill} />
          ) : null}
          {taxStatus ? (
            <StatusPill
              label={taxStatus === "pending_form" ? "form_required" : "form_verified"}
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
            <button disabled={busy} onClick={onMarkPaid} className={styles.successButton}>
              Mark Paid
            </button>

            <button disabled={busy} onClick={onMarkUnpaid} className={styles.warnButton}>
              Mark Unpaid
            </button>
          </div>

          <div className={styles.actionGroup}>
            <button disabled={busy} onClick={onCheckIn} className={styles.infoButton}>
              Check In
            </button>

            <button disabled={busy} onClick={onComplete} className={styles.ghostButton}>
              Complete
            </button>

            <button disabled={busy} onClick={onNoShow} className={styles.dangerButton}>
              No Show
            </button>

            <button
              disabled={busy}
              onClick={toggleExpand}
              className={styles.secondaryButton}
            >
              {expanded ? "Hide" : "Details"}
            </button>
          </div>

          <div className={styles.actionGroup}>
            <button type="button" onClick={onOpenWaiver} className={styles.waiverButton}>
              Open Waiver
            </button>
            <button
              type="button"
              onClick={onCopyWaiver}
              className={styles.secondaryButton}
            >
              Copy Link
            </button>
            <button
              type="button"
              disabled={tabBusy}
              onClick={onEnsureTab}
              className={styles.primaryButton}
            >
              {bookingTab ? "Refresh Tab" : "Open Tab"}
            </button>
            <button
              type="button"
              disabled={tabBusy}
              onClick={onAddItem}
              className={styles.secondaryButton}
            >
              + Item
            </button>
            <button
              type="button"
              disabled={tabBusy}
              onClick={onPayment}
              className={styles.successButton}
            >
              Payment
            </button>
            {row.tax_exempt && taxStatus === "pending_form" ? (
              <button
                type="button"
                disabled={busy}
                onClick={onMarkTaxCollected}
                className={styles.taxButton}
              >
                Mark Form Collected
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {expanded ? (
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
          onRefreshTab={onRefreshTab}
          onAddPresetItem={onAddPresetItem}
          onAddCustomItem={onAddCustomItem}
          onRecordPayment={onRecordPayment}
          onCloseTab={onCloseTab}
          onVoidTab={onVoidTab}
          onVoidLineItem={onVoidLineItem}
          onVoidPayment={onVoidPayment}
        />
      ) : null}
    </div>
  );
}
