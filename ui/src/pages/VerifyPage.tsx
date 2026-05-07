import React, { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Root } from "rts-core";
import RootDetails from "../components/RootDetails";
import { Verifier } from "../verifier";

type VerificationResult =
  | { status: "idle" }
  | { status: "success"; latestRoot: Root }
  | { status: "decode-error" }
  | { status: "network-error" }
  | { status: "verify-error" };

function VerifyPage() {
  const [result, setResult] = useState<VerificationResult>({
    status: "idle",
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [encodedProof, setEncodedProof] = useState("");
  const [url, setUrl] = useState("");

  const verify = async () => {
    setIsVerifying(true);
    setResult({ status: "idle" });

    let decodedProof: Awaited<ReturnType<typeof Verifier.decodeProofLocally>>;
    try {
      decodedProof = await Verifier.decodeProofLocally(encodedProof);
    } catch {
      setResult({ status: "decode-error" });
      setIsVerifying(false);
      return;
    }

    let latestRoot: Root | undefined;
    let root: string;
    let publicKey: bigint[];
    let verifier: Verifier;
    try {
      const [verificationKey, fetchedPublicKey, validRoots] = await Promise.all(
        [
          Verifier.getVerificationKey(),
          Verifier.getPublicKey(decodedProof.keyIndex),
          Verifier.getValidRoots(),
        ],
      );
      latestRoot = Verifier.getLatestRootFromRoots(validRoots);
      if (!latestRoot) {
        throw new Error("Latest root not found");
      }
      root = Verifier.getRootFromVersionInRoots(
        decodedProof.rootVersion,
        validRoots,
      );
      publicKey = fetchedPublicKey;
      verifier = new Verifier(verificationKey);
    } catch {
      setResult({ status: "network-error" });
      setIsVerifying(false);
      return;
    }

    try {
      const publicSignals = Verifier.encodePublicInputs(
        BigInt(root),
        url,
        publicKey,
      );
      const isVerified = await verifier.verify(
        decodedProof.proof,
        publicSignals,
      );
      setResult(
        isVerified
          ? { status: "success", latestRoot }
          : { status: "verify-error" },
      );
    } catch {
      setResult({ status: "verify-error" });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    const proofFromParams =
      new URLSearchParams(window.location.search).get("proof") || "";
    setEncodedProof(proofFromParams);
  }, []);

  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <h1 style={styles.title}>Proof Verification</h1>
        <form style={styles.form}>
          <label style={styles.field}>
            <span style={styles.label}>Proof</span>
            <textarea
              value={encodedProof}
              onChange={(event) => setEncodedProof(event.target.value)}
              placeholder="Paste proof"
              style={styles.textarea}
            />
          </label>
          <label style={styles.field}>
            <span style={styles.label}>URL</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://invers-technology.github.io/right-to-sell-proof/shop/.../item/..."
              style={styles.input}
              type="url"
            />
          </label>
          <button
            disabled={isVerifying}
            onClick={verify}
            style={{
              ...styles.button,
              ...(isVerifying ? styles.disabledButton : {}),
            }}
            type="button"
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </button>
          {isVerifying && (
            <section style={styles.pendingResult}>
              <p style={styles.resultTitle}>Verification in progress</p>
              <p style={styles.resultMessage}>
                Fetching contract data and checking the proof.
              </p>
            </section>
          )}
          {!isVerifying && result.status === "success" && (
            <section style={styles.successResult}>
              <p style={styles.resultTitle}>Verification succeeded</p>
              <p style={styles.resultMessage}>verifier.verify returned true.</p>
              <div style={styles.rootResult}>
                <p style={styles.rootResultLabel}>Latest Root</p>
                <RootDetails root={result.latestRoot} />
              </div>
            </section>
          )}
          {!isVerifying && result.status === "decode-error" && (
            <section style={styles.failureResult}>
              <p style={styles.resultTitle}>Proof decode failed</p>
              <p style={styles.resultMessage}>
                The proof could not be decoded. isValid: false.
              </p>
            </section>
          )}
          {!isVerifying && result.status === "network-error" && (
            <section style={styles.failureResult}>
              <p style={styles.resultTitle}>Network access failed</p>
              <p style={styles.resultMessage}>
                Failed to fetch contract information from the network.
              </p>
            </section>
          )}
          {!isVerifying && result.status === "verify-error" && (
            <section style={styles.failureResult}>
              <p style={styles.resultTitle}>Verification failed</p>
              <p style={styles.resultMessage}>
                verifier.verify returned false.
              </p>
            </section>
          )}
        </form>
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
    gap: "18px",
    padding: "24px",
  },
  title: {
    fontSize: "28px",
    lineHeight: 1.2,
    margin: 0,
  },
  form: {
    borderTop: "1px solid #edf1f6",
    display: "grid",
    gap: "16px",
    paddingTop: "16px",
  },
  field: {
    display: "grid",
    gap: "8px",
  },
  label: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
  },
  textarea: {
    background: "#f7f8fb",
    border: "1px solid #dde2eb",
    borderRadius: "6px",
    color: "#172033",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize: "13px",
    lineHeight: 1.5,
    minHeight: "180px",
    padding: "12px",
    resize: "vertical",
  },
  input: {
    background: "#f7f8fb",
    border: "1px solid #dde2eb",
    borderRadius: "6px",
    color: "#172033",
    fontSize: "14px",
    padding: "12px",
  },
  button: {
    background: "#173a6a",
    border: "1px solid #173a6a",
    borderRadius: "6px",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
    justifySelf: "start",
    padding: "10px 16px",
  },
  disabledButton: {
    cursor: "not-allowed",
    opacity: 0.7,
  },
  pendingResult: {
    background: "#f7f8fb",
    border: "1px solid #dde2eb",
    borderLeft: "4px solid #64748b",
    borderRadius: "6px",
    display: "grid",
    gap: "6px",
    padding: "12px 14px",
  },
  successResult: {
    background: "#f1f8f4",
    border: "1px solid #cfe8d7",
    borderLeft: "4px solid #237a3b",
    borderRadius: "6px",
    display: "grid",
    gap: "10px",
    padding: "12px 14px",
  },
  failureResult: {
    background: "#fff4f2",
    border: "1px solid #f2cbc5",
    borderLeft: "4px solid #b42318",
    borderRadius: "6px",
    display: "grid",
    gap: "6px",
    padding: "12px 14px",
  },
  resultTitle: {
    color: "#172033",
    fontSize: "14px",
    fontWeight: 700,
    margin: 0,
  },
  resultMessage: {
    color: "#42526b",
    fontSize: "13px",
    lineHeight: 1.5,
    margin: 0,
  },
  rootResult: {
    borderTop: "1px solid #cfe8d7",
    display: "grid",
    gap: "8px",
    paddingTop: "10px",
  },
  rootResultLabel: {
    color: "#237a3b",
    fontSize: "12px",
    fontWeight: 700,
    margin: 0,
  },
};

export default VerifyPage;
