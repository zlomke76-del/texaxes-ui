"use client";

import styles from "../page.module.css";
import { formatMoney, formatDateTime, formatLabel } from "../lib/format";
import { StatusPill } from "./StatusPill";
import { DetailBox } from "./DetailBox";
import { toneClass } from "../lib/booking-logic";
import type { BookingRow } from "../types";

type Props = {
  row: BookingRow;
  taxStatus: string | null;
  bookingTab: any;
  tabBusy: boolean;

  onOpenWaiver: () => void;
  onCopyWaiver: () => void;
  onEditPartySize: () => void;
  onEditNotes: () => void;
  onEnsureTab: () => void;
  onMarkTaxCollected: () => void;
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
}: Props) {
  return (
    <div className={styles.expandPanel}>
      <div className={styles.expandGrid}>
        <DetailBox title="Customer Notes" value={row.customer_notes || "None"} />
        <DetailBox title="Internal Notes" value={row.internal_notes || "None"} />

        <DetailBox
          title="Payment Snapshot"
          value={`Status: ${row.payment_status}
Due: ${formatMoney(row.total_amount)}
Paid: ${formatMoney(row.amount_paid)}
Outstanding: ${formatMoney(
            Math.max(0, row.total_amount - row.amount_paid)
          )}`}
        />

        <DetailBox
          title="Tax Handling"
          value={
            row.tax_exempt
              ? `Tax Exempt: Yes
Reason: ${formatLabel(row.tax_exempt_reason)}
Form Status: ${formatLabel(taxStatus || "unknown")}
Collected At: ${row.tax_exempt_form_collected_at || "Not recorded"}`
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
            <button onClick={onOpenWaiver} className={styles.waiverButton}>
              Open Waiver
            </button>

            <button onClick={onCopyWaiver} className={styles.ghostButton}>
              Copy Link
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

            {row.tax_exempt && taxStatus === "pending_form" && (
              <button
                onClick={onMarkTaxCollected}
                className={styles.taxButton}
              >
                Mark Form Collected
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
