"use client";

import styles from "../page.module.css";
import type { PaymentFormState, TabPaymentMethod } from "../types";

type Props = {
  open: boolean;
  form: PaymentFormState | null;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: () => void;
  onUpdateField: <K extends keyof PaymentFormState>(
    key: K,
    value: PaymentFormState[K]
  ) => void;
};

export function PaymentModal({
  open,
  form,
  busy,
  error,
  onClose,
  onSubmit,
  onUpdateField,
}: Props) {
  if (!open || !form) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalKicker}>Tab Payment</div>
            <h2 className={styles.modalTitle}>Record Payment</h2>
            <p className={styles.modalText}>
              Record card terminal, cash, comp, or manual adjustment payments.
            </p>
          </div>

          <button onClick={onClose} className={styles.modalCloseButton}>
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
              value={form.amount}
              onChange={(e) => onUpdateField("amount", e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Payment Method</label>
            <select
              value={form.payment_method}
              onChange={(e) =>
                onUpdateField("payment_method", e.target.value as TabPaymentMethod)
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
              value={form.reference}
              onChange={(e) => onUpdateField("reference", e.target.value)}
              className={styles.input}
              placeholder="Receipt / last4 / terminal ref"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Collected By</label>
            <input
              type="text"
              value={form.collected_by}
              onChange={(e) => onUpdateField("collected_by", e.target.value)}
              className={styles.input}
              placeholder="Staff name"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Note</label>
          <textarea
            value={form.note}
            onChange={(e) => onUpdateField("note", e.target.value)}
            className={styles.textarea}
          />
        </div>

        {error ? <div className={styles.createError}>{error}</div> : null}

        <div className={styles.modalActions}>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy}
            className={styles.successButton}
          >
            Record Payment
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={styles.secondaryButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
