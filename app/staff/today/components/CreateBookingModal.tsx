"use client";

import styles from "../page.module.css";
import type { AvailabilitySlot, CreateFormState } from "../types";
import { formatTime } from "../lib/format";
import { slotToneClass } from "../lib/booking-logic";

type Props = {
  open: boolean;
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  form: CreateFormState;
  onUpdateField: <K extends keyof CreateFormState>(
    key: K,
    value: CreateFormState[K]
  ) => void;
  availability: AvailabilitySlot[];
  availabilityLoading: boolean;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (paymentStatus: "pending" | "paid") => void;
};

export function CreateBookingModal({
  open,
  selectedDate,
  setSelectedDate,
  form,
  onUpdateField,
  availability,
  availabilityLoading,
  busy,
  error,
  onClose,
  onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalKicker}>Staff Booking Entry</div>
            <h2 className={styles.modalTitle}>Create Booking</h2>
            <p className={styles.modalText}>
              Add walk-ins, phone bookings, admin holds, and future reservations.
            </p>
          </div>

          <button onClick={onClose} className={styles.modalCloseButton}>
            ✕
          </button>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Party Size</label>
            <input
              type="number"
              min={1}
              max={24}
              value={form.throwers}
              onChange={(e) =>
                onUpdateField("throwers", Math.max(1, Number(e.target.value || 1)))
              }
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>First Name</label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => onUpdateField("first_name", e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Last Name</label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => onUpdateField("last_name", e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => onUpdateField("phone", e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => onUpdateField("email", e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Booking Source</label>
            <select
              value={form.booking_source}
              onChange={(e) =>
                onUpdateField(
                  "booking_source",
                  e.target.value as CreateFormState["booking_source"]
                )
              }
              className={styles.input}
            >
              <option value="walk_in">Walk-In</option>
              <option value="admin">Admin</option>
              <option value="phone">Phone</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Booking Type</label>
            <select
              value={form.booking_type}
              onChange={(e) =>
                onUpdateField(
                  "booking_type",
                  e.target.value as CreateFormState["booking_type"]
                )
              }
              className={styles.input}
            >
              <option value="open">Open</option>
              <option value="corporate">Corporate</option>
              <option value="league">League</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tax Handling</label>

          <div className={styles.taxPanel}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.tax_exempt}
                onChange={(e) => onUpdateField("tax_exempt", e.target.checked)}
              />
              <span>Tax Exempt</span>
            </label>

            {form.tax_exempt ? (
              <div className={styles.taxGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Tax Exempt Reason</label>
                  <select
                    value={form.tax_exempt_reason}
                    onChange={(e) => onUpdateField("tax_exempt_reason", e.target.value)}
                    className={styles.input}
                  >
                    <option value="">Select reason</option>
                    <option value="nonprofit">Nonprofit</option>
                    <option value="school_government">School / Government</option>
                    <option value="resale">Resale</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Tax Exempt Note</label>
                  <input
                    type="text"
                    value={form.tax_exempt_note}
                    onChange={(e) => onUpdateField("tax_exempt_note", e.target.value)}
                    className={styles.input}
                    placeholder="Optional certificate or note"
                  />
                </div>

                <div className={styles.taxChecklist}>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={form.tax_exempt_form_collected}
                      onChange={(e) =>
                        onUpdateField("tax_exempt_form_collected", e.target.checked)
                      }
                    />
                    <span>Form collected</span>
                  </label>

                  {!form.tax_exempt_form_collected ? (
                    <div className={styles.taxWarning}>
                      Tax exempt form must be collected and tracked on this booking.
                    </div>
                  ) : (
                    <div className={styles.taxVerified}>
                      Tax exempt form marked as collected.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Available Time Slots</label>
          <div className={styles.slotGrid}>
            {availabilityLoading ? (
              <div className={styles.slotLoading}>Checking availability...</div>
            ) : availability.length === 0 ? (
              <div className={styles.slotLoading}>No available slots found for this date.</div>
            ) : (
              availability.map((slot) => {
                const slotTime = slot.display_time || slot.start;
                const selected = form.time === slotTime;
                const disabled = slot.state === "full";
                const className = [
                  styles.slotButton,
                  slotToneClass(slot.state),
                  selected ? styles.slotSelected : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={`${slot.time_block_id}-${slot.start}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => onUpdateField("time", slotTime)}
                    className={className}
                  >
                    <span className={styles.slotTime}>{formatTime(`${slotTime}:00`)}</span>
                    <span className={styles.slotMeta}>
                    {slot.state} · bays open {slot.open_bays}
                    {slot.derived_half_hour ? " · :30" : ""}
                  </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className={styles.formGridSingle}>
          <div className={styles.field}>
            <label className={styles.label}>Customer Notes</label>
            <textarea
              value={form.customer_notes}
              onChange={(e) => onUpdateField("customer_notes", e.target.value)}
              className={styles.textarea}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Internal Notes</label>
            <textarea
              value={form.internal_notes}
              onChange={(e) => onUpdateField("internal_notes", e.target.value)}
              className={styles.textarea}
            />
          </div>
        </div>

        {error ? <div className={styles.createError}>{error}</div> : null}

        <div className={styles.modalActions}>
          <button
            type="button"
            onClick={() => onSubmit("pending")}
            disabled={busy}
            className={styles.warnButton}
          >
            Create Unpaid
          </button>

          <button
            type="button"
            onClick={() => onSubmit("paid")}
            disabled={busy}
            className={styles.successButton}
          >
            Create + Mark Paid
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
