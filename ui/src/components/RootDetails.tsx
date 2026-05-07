import React from "react";
import type { CSSProperties } from "react";
import type { Root } from "rts-core";

interface RootDetailsProps {
  root: Root;
}

const toText = (value: bigint | string | number) => value.toString();

const formatTimestamp = (timestamp: bigint | string | number) => {
  const seconds = Number(timestamp.toString());
  if (!Number.isFinite(seconds)) {
    return null;
  }

  return new Date(seconds * 1000).toLocaleString();
};

function RootDetails({ root }: RootDetailsProps) {
  const timestampText = toText(root.timestamp);
  const formattedTimestamp = formatTimestamp(root.timestamp);
  const rows = [
    ["Root", root.root],
    ["Version", toText(root.version)],
    [
      "Timestamp",
      formattedTimestamp
        ? `${timestampText} (${formattedTimestamp})`
        : timestampText,
    ],
  ];

  return (
    <dl style={styles.list}>
      {rows.map(([label, value]) => (
        <div key={label} style={styles.row}>
          <dt style={styles.term}>{label}</dt>
          <dd style={styles.value}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const styles: Record<string, CSSProperties> = {
  list: {
    display: "grid",
    gap: "8px",
    margin: 0,
  },
  row: {
    display: "grid",
    gap: "3px",
  },
  term: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
  },
  value: {
    color: "#172033",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize: "12px",
    lineBreak: "anywhere",
    margin: 0,
  },
};

export default RootDetails;
