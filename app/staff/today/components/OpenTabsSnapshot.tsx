"use client";

import styles from "../page.module.css";
import { formatDateTime, formatLabel, formatMoney } from "../lib/format";
import { toneClass } from "../lib/booking-logic";
import { StatusPill } from "./StatusPill";
import type { ListOpenTabsResponse, TabDetailResponse } from "../types";

type Props = {
  openTabsLoading: boolean;
  openTabsSummary: ListOpenTabsResponse | null;
  tabDetailsByBooking: Record<string, TabDetailResponse | null>;
  tabBusyId: string | null;
  onRefreshOpenTabs: () => void;
  onOpenTab: (tabId: string, bookingKey: string) => Promise<void>;
  onAddItem: (tabId: string, bookingKey: string) => Promise<void>;
  onPayment: (tabId: string, bookingKey: string) => Promise<void>;
  onCloseTab: (bookingKey: string) => void;
};

export function OpenTabsSnapshot({
  openTabsLoading,
  openTabsSummary,
  tabDetailsByBooking,
  tabBusyId,
  onRefreshOpenTabs,
  onOpenTab,
  onAddItem,
  onPayment,
  onCloseTab,
}: Props) {
  return (
    <section className={styles.openTabsPanel}>
      <div className={styles.openTabsHeader}>
        <div>
          <div className={styles.detailTitle}>Open Tabs Snapshot</div>
          <h2 className={styles.openTabsTitle}>Floor Commerce</h2>
        </div>
        <div className={styles.openTabsActions}>
          <button
            className={styles.secondaryButton}
            onClick={onRefreshOpenTabs}
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
            {openTabsSummary.tabs.map((tab) => {
              const bookingKey = tab.booking_id || tab.id;
              const tabDetail = tabDetailsByBooking[bookingKey];
              const tabBusy = tabBusyId === bookingKey;

              return (
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
                      <span className={styles.codeText}>Booking: {tab.booking_id}</span>
                    ) : (
                      <span className={styles.codeText}>Standalone tab</span>
                    )}
                  </div>

                  <div className={styles.actionGroup}>
                    <button
                      type="button"
                      disabled={tabBusy}
                      onClick={() => onOpenTab(tab.id, bookingKey)}
                      className={styles.primaryButton}
                    >
                      {tabDetail ? "Refresh Tab" : "Open Tab"}
                    </button>

                    <button
                      type="button"
                      disabled={tabBusy}
                      onClick={() => onAddItem(tab.id, bookingKey)}
                      className={styles.secondaryButton}
                    >
                      + Item
                    </button>

                    <button
                      type="button"
                      disabled={tabBusy}
                      onClick={() => onPayment(tab.id, bookingKey)}
                      className={styles.successButton}
                    >
                      Payment
                    </button>

                    <button
                      type="button"
                      disabled={tabBusy || tab.status !== "open"}
                      onClick={() => onCloseTab(bookingKey)}
                      className={styles.infoButton}
                    >
                      Close Tab
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
