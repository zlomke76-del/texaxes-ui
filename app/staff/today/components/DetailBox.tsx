import styles from "../page.module.css";

export function DetailBox({ title, value }: { title: string; value: string }) {
  return (
    <div className={styles.detailBox}>
      <div className={styles.detailTitle}>{title}</div>
      <pre className={styles.detailValue}>{value}</pre>
    </div>
  );
}
