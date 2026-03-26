export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0f1a",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Tex Axes UI</h1>
        <p style={{ opacity: 0.8 }}>Frontend is live.</p>
        <p style={{ opacity: 0.8 }}>/staff/today for the staff dashboard.</p>
      </div>
    </main>
  );
}
