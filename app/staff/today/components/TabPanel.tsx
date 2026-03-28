"use client";

import styles from "../page.module.css";
import { toneClass } from "../lib/booking-logic";
import { formatDateTime, formatLabel, formatMoney } from "../lib/format";
import { ITEM_PRESETS } from "../constants";
import { StatusPill } from "./StatusPill";
import type { BookingRow, TabDetailResponse } from "../types";

type Props = {
  row: BookingRow;
  bookingTab: TabDetailResponse;
  tabBusy: boolean;
  onRefreshTab: () => void;
  onAddPresetItem: (preset: (typeof ITEM_PRESETS)[number]) => void;
  onAddCustomItem: () => void;
  onRecordPayment: () => void;
  onCloseTab: () => void;
  onVoidTab: () => void;
  onVoidLineItem: (lineItemId: string) => void;
  onVoidPayment: (paymentId: string) => void;
};

export function TabPanel({
  row,
  bookingTab,
  tabBusy,
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
            onClick={onRefreshTab}
          >
            Refresh Tab
          </button>

          <button
            className={styles.secondaryButton}
            disabled={tabBusy}
            onClick={() => onAddPresetItem(ITEM_PRESETS[0])}
          >
            + Coke
          </button>

          <button
            className={styles.secondaryButton}
            disabled={tabBusy}
            onClick={() => onAddPresetItem(ITEM_PRESETS[1])}
          >
            + Water
          </button>

          <button
            className={styles.secondaryButton}
            disabled={tabBusy}
            onClick={() => onAddPresetItem(ITEM_PRESETS[2])}
          >
            + Shirt
          </button>

          <button
            className={styles.secondaryButton}
            disabled={tabBusy}
            onClick={() => onAddPresetItem(ITEM_PRESETS[3])}
          >
            + Axe
          </button>

          <button
            className={styles.primaryButton}
            disabled={tabBusy}
            onClick={onAddCustomItem}
          >
            + Custom Item
          </button>

          <button
            className={styles.successButton}
            disabled={tabBusy}
            onClick={onRecordPayment}
          >
            Record Payment
          </button>

          <button
            className={styles.infoButton}
            disabled={tabBusy || bookingTab.tab.status !== "open"}
            onClick={onCloseTab}
          >
            Close Tab
          </button>

          <button
            className={styles.dangerButton}
            disabled={tabBusy || bookingTab.tab.status === "void"}
            onClick={onVoidTab}
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
            <div className={styles.emptyMini}>No line items on this tab yet.</div>
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
                      <div className={styles.tabItemName}>{item.description}</div>
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
                        onClick={() => onVoidLineItem(item.id)}
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
            <div className={styles.emptyMini}>No payments recorded on this tab yet.</div>
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
                    payment.status === "void" ? styles.tabRowVoided : ""
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
                      onClick={() => onVoidPayment(payment.id)}
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
  );
}
