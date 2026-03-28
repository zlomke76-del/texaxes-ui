import styles from "../page.module.css";

export function StatusPill({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className={`${styles.pill} ${className}`}>
      {label.replaceAll("_", " ")}
    </span>
  );
}
