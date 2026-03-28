"use client";

import styles from "../page.module.css";
import { ITEM_PRESETS } from "../constants";
import type { AddItemFormState, ItemType } from "../types";

type Props = {
  open: boolean;
  form: AddItemFormState | null;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: () => void;
  onUpdateField: <K extends keyof AddItemFormState>(
    key: K,
    value: AddItemFormState[K]
  ) => void;
  onApplyPreset: (presetKey: string) => void;
};

export function AddItemModal({
  open,
  form,
  busy,
  error,
  onClose,
  onSubmit,
  onUpdateField,
  onApplyPreset,
}: Props) {
  if (!open || !form) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalKicker}>Tab Line Item</div>
            <h2 className={styles.modalTitle}>Add Item</h2>
            <p className={styles.modalText}>
              Quick-add concessions, retail, and custom charges to the live tab.
            </p>
          </div>

          <button onClick={onClose} className={styles.modalCloseButton}>
            ✕
          </button>
        </div>

        <div className={styles.filterBar}>
          {ITEM_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={styles.filterButton}
              onClick={() => onApplyPreset(preset.key)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Item Type</label>
            <select
              value={form.item_type}
              onChange={(e) => onUpdateField("item_type", e.target.value as ItemType)}
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
              value={form.description}
              onChange={(e) => onUpdateField("description", e.target.value)}
              className={styles.input}
              placeholder="Coke, Tex Axes Shirt, Retail Axe..."
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Quantity</label>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) =>
                onUpdateField("quantity", Math.max(1, Number(e.target.value || 1)))
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
              value={form.unit_price}
              onChange={(e) => onUpdateField("unit_price", e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Size / Variant</label>
            <select
              value={form.size}
              onChange={(e) => onUpdateField("size", e.target.value)}
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
              value={form.note}
              onChange={(e) => onUpdateField("note", e.target.value)}
              className={styles.input}
              placeholder="Optional note"
            />
          </div>
        </div>

        <div className={styles.taxPanel}>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={form.taxable}
              onChange={(e) => onUpdateField("taxable", e.target.checked)}
            />
            <span>Taxable item</span>
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={form.tax_exempt_override}
              onChange={(e) => onUpdateField("tax_exempt_override", e.target.checked)}
            />
            <span>Tax exempt override for this line</span>
          </label>

          {form.tax_exempt_override ? (
            <div className={styles.field}>
              <label className={styles.label}>Tax Exempt Reason</label>
              <input
                type="text"
                value={form.tax_exempt_reason}
                onChange={(e) => onUpdateField("tax_exempt_reason", e.target.value)}
                className={styles.input}
                placeholder="Reason for item-level exemption"
              />
            </div>
          ) : null}
        </div>

        {error ? <div className={styles.createError}>{error}</div> : null}

        <div className={styles.modalActions}>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy}
            className={styles.primaryButton}
          >
            Add Item
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
