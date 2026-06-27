import React from "react";
import { IconButton } from "./IconButton";
import { CrosslogIcon, crosslogIconNames, type CrosslogIconName } from "./icons";

export function IconPreview() {
  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Crosslog UI</p>
          <h1 style={styles.title}>Icon Preview</h1>
        </div>
        <p style={styles.meta}>{crosslogIconNames.length} icons from the local UI module</p>
      </header>
      <section style={styles.grid} aria-label="Crosslog icon gallery">
        {crosslogIconNames.map((name) => (
          <IconPreviewCard key={name} name={name} />
        ))}
      </section>
    </main>
  );
}

function IconPreviewCard({ name }: { readonly name: CrosslogIconName }) {
  const label = formatIconLabel(name);

  return (
    <article style={styles.card}>
      <div style={styles.iconRow}>
        <div style={styles.iconCell}>
          <CrosslogIcon name={name} title={`${label} icon`} />
        </div>
        <div style={{ ...styles.iconCell, ...styles.accentIconCell }}>
          <CrosslogIcon name={name} title={`${label} accent icon`} />
        </div>
        <div style={styles.iconButtonCell}>
          <IconButton icon={name} label={label} />
        </div>
      </div>
      <div style={styles.cardFooter}>
        <strong style={styles.label}>{label}</strong>
        <code style={styles.code}>{name}</code>
      </div>
    </article>
  );
}

function formatIconLabel(name: CrosslogIconName): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const styles = {
  page: {
    minHeight: "100vh",
    boxSizing: "border-box",
    padding: "32px",
    background: "#f5f5f7",
    color: "#1d1d1f",
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
    alignItems: "end",
    maxWidth: "1120px",
    margin: "0 auto 24px",
  },
  eyebrow: {
    margin: "0 0 6px",
    color: "#6e6e73",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
  },
  meta: {
    margin: 0,
    color: "#6e6e73",
    fontSize: "13px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "12px",
    maxWidth: "1120px",
    margin: "0 auto",
  },
  card: {
    border: "1px solid #d9d9df",
    borderRadius: "8px",
    background: "#ffffff",
    overflow: "hidden",
  },
  iconRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    minHeight: "82px",
  },
  iconCell: {
    display: "grid",
    placeItems: "center",
    borderInlineEnd: "1px solid #eeeeef",
    color: "#1d1d1f",
  },
  accentIconCell: {
    background: "#d9ebff",
    color: "#007aff",
  },
  iconButtonCell: {
    display: "grid",
    placeItems: "center",
    color: "#6e6e73",
  },
  cardFooter: {
    display: "grid",
    gap: "6px",
    padding: "12px",
    borderBlockStart: "1px solid #eeeeef",
  },
  label: {
    fontSize: "13px",
  },
  code: {
    width: "fit-content",
    borderRadius: "6px",
    padding: "2px 6px",
    background: "#f0f0f3",
    color: "#6e6e73",
    fontSize: "12px",
  },
} satisfies Record<string, React.CSSProperties>;
