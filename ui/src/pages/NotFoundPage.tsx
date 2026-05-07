import React from "react";
import type { CSSProperties } from "react";

function NotFoundPage() {
  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <p style={styles.kicker}>404</p>
        <h1 style={styles.title}>Not Found</h1>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    margin: "0 auto",
    maxWidth: "960px",
    padding: "32px 24px",
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #dde2eb",
    borderRadius: "8px",
    padding: "24px",
  },
  kicker: {
    color: "#b42318",
    fontSize: "13px",
    fontWeight: 700,
    margin: "0 0 4px",
  },
  title: {
    fontSize: "28px",
    lineHeight: 1.2,
    margin: 0,
  },
};

export default NotFoundPage;
