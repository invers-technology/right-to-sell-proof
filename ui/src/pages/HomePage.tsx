import React, { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Root } from "rts-core";
import RootDetails from "../components/RootDetails";
import { BASE, getShopItemName, shopListings } from "../constants";
import { Verifier } from "../verifier";

type LatestRootState =
  | { status: "loading" }
  | { status: "success"; root: Root }
  | { status: "empty" }
  | { status: "failed" };

function HomePage() {
  const [latestRoot, setLatestRoot] = useState<LatestRootState>({
    status: "loading",
  });

  useEffect(() => {
    let isMounted = true;
    const loadLatestRoot = async () => {
      try {
        const root = await Verifier.getLatestRoot();
        if (isMounted) {
          setLatestRoot(
            root ? { status: "success", root } : { status: "empty" },
          );
        }
      } catch {
        if (isMounted) {
          setLatestRoot({ status: "failed" });
        }
      }
    };
    void loadLatestRoot();
    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Right to Sell Demo</h1>
        <div style={styles.columns}>
          <section style={styles.panel}>
            <p style={styles.kicker}>Listings</p>
            <div style={styles.list}>
              {shopListings.map((route) => {
                const href = `${BASE}/shop/${route.shopId}/item/${route.itemId}?localte=${route.locale}&category=${route.category}`;

                return (
                  <a key={href} href={href} style={styles.itemLink}>
                    {getShopItemName(route.locale, route.category)}
                  </a>
                );
              })}
            </div>
          </section>
          <section style={styles.panel}>
            <p style={styles.kicker}>Verify</p>
            <a href={BASE + "/verify"} style={styles.verifyLink}>
              Verify Proof
            </a>
            <div style={styles.latestRootBlock}>
              <p style={styles.latestRootLabel}>Latest Root</p>
              {latestRoot.status === "success" && (
                <RootDetails root={latestRoot.root} />
              )}
              {latestRoot.status !== "success" && (
                <p style={styles.latestRootValue}>
                  {latestRoot.status === "loading" && "Loading..."}
                  {latestRoot.status === "empty" && "Not found"}
                  {latestRoot.status === "failed" && "Failed to load"}
                </p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    margin: "0 auto",
    maxWidth: "960px",
    padding: "40px 24px",
  },
  hero: {
    display: "grid",
    gap: "20px",
  },
  columns: {
    alignItems: "start",
    display: "grid",
    gap: "16px",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #dde2eb",
    borderRadius: "8px",
    display: "grid",
    gap: "14px",
    padding: "18px",
  },
  kicker: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
    margin: 0,
  },
  title: {
    fontSize: "34px",
    lineHeight: 1.2,
    margin: 0,
  },
  list: {
    display: "grid",
    gap: "8px",
  },
  itemLink: {
    background: "#f7f8fb",
    border: "1px solid #edf1f6",
    borderRadius: "6px",
    color: "#172033",
    fontSize: "14px",
    fontWeight: 700,
    padding: "10px 12px",
    textDecoration: "none",
  },
  verifyLink: {
    background: "#e9eef8",
    borderRadius: "6px",
    color: "#173a6a",
    display: "block",
    fontSize: "16px",
    fontWeight: 700,
    padding: "14px 16px",
    textAlign: "center",
    textDecoration: "none",
  },
  latestRootBlock: {
    background: "#f7f8fb",
    border: "1px solid #edf1f6",
    borderRadius: "6px",
    display: "grid",
    gap: "6px",
    padding: "10px 12px",
  },
  latestRootLabel: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
    margin: 0,
  },
  latestRootValue: {
    color: "#172033",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize: "12px",
    lineBreak: "anywhere",
    margin: 0,
  },
};

export default HomePage;
