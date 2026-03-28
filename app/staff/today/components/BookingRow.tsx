"use client";

import styles from "../page.module.css";
import { formatLabel, formatMoney } from "../lib/format";
import { DetailBox } from "./DetailBox";
import { TabPanel } from "./TabPanel";
import { ITEM_PRESETS } from "../constants";
import type { BookingRow, TabDetailResponse } from "../types";

type Props = {
  row: BookingRow;
  taxStatus: string | null;
  bookingTab: TabDetailResponse | null | undefined;
  tabBusy: boolean;
  onOpenWaiver: () => void;
  onCopyWaiver: () => void;
  onEditPartySize: () => void;
  onEditNotes: () => void;
  onEnsureTab: () => void;
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

export function BookingExpandedPanel({
  row,
  taxStatus,
  bookingTab,
  tabBusy,
  onOpenWaiver,
  onCopyWaiver,
  onEditPartySize,
  onEditNotes,
  onEnsureTab,
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
  return (
    <div className={styles.expandPanel}>
      <div className={styles.expandGrid}>
        <DetailBox title="Customer Notes" value={row.customer_notes || "None"} />
        <DetailBox title="Internal Notes" value={row.internal_notes || "None"} />
        <DetailBox
          title="Payment Snapshot"
          value={`Status: ${row.payment_status}\nDue: ${formatMoney(
            row.total_amount
          )}\nPaid: ${formatMoney(row.amount_paid)}\nOutstanding: ${formatMoney(
            Math.max(0, Number(row.total_amount || 0) - Number(row.amount_paid || 0))
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
                )}\nCollected At: ${row.tax_exempt_form_collected_at || "Not recorded"}`
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
                {row.waiver_signed ?? 0} / {row.waiver_required ?? row.party_size}
              </span>
            </div>
            <div>
              Booking ID: <span className={styles.codeText}>{row.booking_id}</span>
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
            <button onClick={onOpenWaiver} className={styles.waiverButton}>
              Open Waiver
            </button>
            <button onClick={onCopyWaiver} className={styles.ghostButton}>
              Copy Waiver Link
            </button>
            <button onClick={onEditPartySize} className={styles.ghostButton}>
              Edit Party Size
            </button>
            <button onClick={onEditNotes} className={styles.ghostButton}>
              Edit Notes
            </button>
            <button
              onClick={onEnsureTab}
              disabled={tabBusy}
              className={styles.primaryButton}
            >
              {bookingTab ? "Refresh Tab" : "Open Tab"}
            </button>
            {row.tax_exempt && taxStatus === "pending_form" ? (
              <button onClick={onMarkTaxCollected} className={styles.taxButton}>
                Mark Form Collected
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {bookingTab ? (
        <TabPanel
          row={row}
          bookingTab={bookingTab}
          tabBusy={tabBusy}
          onRefreshTab={onRefreshTab || (() => {})}
          onAddPresetItem={onAddPresetItem || (() => {})}
          onAddCustomItem={onAddCustomItem || (() => {})}
          onRecordPayment={onRecordPayment || (() => {})}
          onCloseTab={onCloseTab || (() => {})}
          onVoidTab={onVoidTab || (() => {})}
          onVoidLineItem={onVoidLineItem || (() => {})}
          onVoidPayment={onVoidPayment || (() => {})}
        />
      ) : (
        <div className={styles.tabPanelPlaceholder}>
          <div className={styles.detailTitle}>Tab / Invoice</div>
          <p className={styles.emptyText}>
            Open a tab to add drinks, retail, custom charges, and in-store payments
            against this booking.
          </p>
          <button
            className={styles.primaryButton}
            disabled={tabBusy}
            onClick={onEnsureTab}
          >
            Open Tab
          </button>
        </div>
      )}
    </div>
  );
}
