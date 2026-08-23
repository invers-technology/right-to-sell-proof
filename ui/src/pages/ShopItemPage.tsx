import React from "react";
import type { CSSProperties } from "react";
import {
  BASE,
  categoryLabels,
  getShopItemName,
  shopListings,
} from "../constants";

interface ShopItemPageProps {
  shopId: string;
  itemId: string;
  locale: string;
  category: string;
}

const getProductTitle = (locale: string, category: string) => {
  if (!locale || !category) {
    return "Unknown Product";
  }

  return getShopItemName(locale, category);
};

const getProductDescription = (locale: string, category: string) => {
  const title = getProductTitle(locale, category);
  return `${title} is a sample listing for the right-to-sell verification flow. It is connected to a registered shop and item pair, and the attached proof confirms that the seller is authorized to present this listing. The details stay simple so the verification path is clear.`;
};

const ProductImage = ({ category }: { category: string }) => {
  const categoryLabel = categoryLabels[category] || category;

  return (
    <div style={styles.imageFrame} aria-label={`${categoryLabel} image`}>
      <svg viewBox="0 12 180 116" role="img" style={styles.productSvg}>
        <rect x="18" y="18" width="144" height="104" rx="10" fill="#f7f8fb" />
        <rect
          x="18"
          y="18"
          width="144"
          height="104"
          rx="10"
          fill="none"
          stroke="#c8d3e2"
        />
        {category === "0001" && (
          <>
            <rect
              x="74"
              y="45"
              width="32"
              height="54"
              rx="8"
              fill="#e9eef8"
              stroke="#173a6a"
            />
            <rect x="79" y="34" width="22" height="14" rx="4" fill="#173a6a" />
            <circle cx="90" cy="71" r="10" fill="#89b4ff" />
          </>
        )}
        {category === "0011" && (
          <>
            <path
              d="M47 86c22 4 37-18 47-4 8 11 25 14 43 17 7 1 10 12 2 15H48c-15 0-19-22-1-28z"
              fill="#e9eef8"
              stroke="#173a6a"
            />
            <path
              d="M62 84l17 17M80 80l18 20"
              stroke="#173a6a"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </>
        )}
        {category === "0111" && (
          <>
            <path
              d="M62 43l18-10h20l18 10 20 25-20 12v35H62V80L42 68z"
              fill="#e9eef8"
              stroke="#173a6a"
              strokeLinejoin="round"
            />
            <path
              d="M80 34c4 10 16 10 20 0"
              fill="none"
              stroke="#173a6a"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </>
        )}
        {category === "1111" && (
          <>
            <rect
              x="48"
              y="59"
              width="84"
              height="55"
              rx="9"
              fill="#e9eef8"
              stroke="#173a6a"
            />
            <path
              d="M70 62c0-28 40-28 40 0"
              fill="none"
              stroke="#173a6a"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <circle cx="70" cy="75" r="4" fill="#173a6a" />
            <circle cx="110" cy="75" r="4" fill="#173a6a" />
          </>
        )}
        {!categoryLabels[category || ""] && (
          <circle cx="90" cy="70" r="28" fill="#e9eef8" stroke="#173a6a" />
        )}
      </svg>
    </div>
  );
};

function ShopItemPage({ shopId, itemId, locale, category }: ShopItemPageProps) {
  const productTitle = getProductTitle(locale, category);
  const description = getProductDescription(locale, category);
  const route = shopListings.find(
    (route) => route.shopId === shopId && route.itemId === itemId,
  );
  const proof = route?.proof || "";
  const verifyHref = `${BASE}/verify?proof=${encodeURIComponent(proof)}`;

  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <div style={styles.header}>
          <p style={styles.kicker}>Shop Item</p>
          <h1 style={styles.title}>{productTitle}</h1>
        </div>

        <ProductImage category={category} />

        <section style={styles.descriptionBlock}>
          <h2 style={styles.descriptionTitle}>Description</h2>
          <p style={styles.description}>{description}</p>
          <p style={styles.description}>The right to sell proof is below.</p>
          <a href={verifyHref} style={styles.proofLink}>
            {proof}
          </a>
        </section>

        <dl style={styles.details}>
          <div style={styles.detailRow}>
            <dt style={styles.label}>Shop ID</dt>
            <dd style={styles.value}>{shopId}</dd>
          </div>
          <div style={styles.detailRow}>
            <dt style={styles.label}>Item ID</dt>
            <dd style={styles.value}>{itemId}</dd>
          </div>
          <div style={styles.detailRow}>
            <dt style={styles.label}>Locale</dt>
            <dd style={styles.value}>{locale}</dd>
          </div>
          <div style={styles.detailRow}>
            <dt style={styles.label}>Category</dt>
            <dd style={styles.value}>{category}</dd>
          </div>
        </dl>
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
    display: "grid",
    gap: "22px",
    padding: "24px",
  },
  header: {
    display: "grid",
    gap: "4px",
  },
  kicker: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
    margin: 0,
  },
  title: {
    fontSize: "28px",
    lineHeight: 1.2,
    margin: 0,
  },
  details: {
    display: "grid",
    gap: "12px",
    margin: 0,
  },
  detailRow: {
    borderTop: "1px solid #edf1f6",
    display: "grid",
    gap: "6px",
    paddingTop: "12px",
  },
  label: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
  },
  value: {
    color: "#172033",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize: "14px",
    lineHeight: 1.5,
    margin: 0,
    overflowWrap: "anywhere",
  },
  imageFrame: {
    alignItems: "center",
    background: "#f7f8fb",
    border: "1px solid #dde2eb",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "center",
    padding: "10px 18px",
  },
  productSvg: {
    display: "block",
    height: "auto",
    maxWidth: "100%",
    width: "280px",
  },
  descriptionBlock: {
    borderTop: "1px solid #edf1f6",
    display: "grid",
    gap: "8px",
    paddingTop: "16px",
  },
  descriptionTitle: {
    fontSize: "18px",
    lineHeight: 1.3,
    margin: 0,
  },
  description: {
    color: "#526172",
    fontSize: "14px",
    lineHeight: 1.6,
    margin: 0,
  },
  proofLink: {
    overflowWrap: "anywhere",
  },
};

export default ShopItemPage;
