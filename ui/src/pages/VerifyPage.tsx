import React, { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Root, VerificationKey } from "rts-core";
import RootDetails from "../components/RootDetails";
import { Verifier } from "../verifier";

enum VerificationStatus {
  Idle = "idle",
  Success = "success",
  DecodeError = "decode-error",
  RootNotFound = "root-not-found",
  NetworkError = "network-error",
  VerifyError = "verify-error",
}

const normalizeEncodedProof = (value: string) => {
  if (!value.includes("%")) {
    return value;
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value
      .replace(/%2F/gi, "/")
      .replace(/%2B/gi, "+")
      .replace(/%3D/gi, "=");
  }
};

function VerifyPage() {
  const [status, setStatus] = useState<VerificationStatus>(
    VerificationStatus.Idle,
  );
  const [validRoot, setValidRoot] = useState<Root | null>(null);
  const [verifyDurationMs, setVerifyDurationMs] = useState<number | null>(null);
  const [verificationKey, setVerificationKey] =
    useState<VerificationKey | null>(null);
  const [validRoots, setValidRoots] = useState<Root[] | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [encodedProof, setEncodedProof] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const proofFromParams =
      new URLSearchParams(window.location.search).get("proof") || "";
    setEncodedProof(normalizeEncodedProof(proofFromParams));

    (async () => {
      try {
        const [fetchedVerificationKey, fetchedValidRoots] = await Promise.all([
          Verifier.getVerificationKey(),
          Verifier.getValidRoots(),
        ]);
        setVerificationKey(fetchedVerificationKey);
        setValidRoots(fetchedValidRoots);
      } catch {
        setVerificationKey(null);
        setValidRoots(null);
      }
    })();
  }, []);

  const verify = async () => {
    setIsVerifying(true);
    setStatus(VerificationStatus.Idle);
    setVerifyDurationMs(null);

    if (!verificationKey || !validRoots) {
      setStatus(VerificationStatus.NetworkError);
      setIsVerifying(false);
      return;
    }

    let decodedProof: Awaited<ReturnType<typeof Verifier.decodeProofIndexes>>;
    try {
      decodedProof = await Verifier.decodeProofIndexes(encodedProof);
    } catch {
      setStatus(VerificationStatus.DecodeError);
      setIsVerifying(false);
      return;
    }

    let root: Root;
    try {
      root = Verifier.getRootFromVersionInRoots(
        decodedProof.rootVersion,
        validRoots,
      );
    } catch {
      setStatus(VerificationStatus.RootNotFound);
      setIsVerifying(false);
      return;
    }

    let publicKey: bigint[];
    let verifier: Verifier;
    try {
      publicKey = await Verifier.getPublicKey(decodedProof.keyIndex);
      verifier = new Verifier(verificationKey);
    } catch {
      setStatus(VerificationStatus.NetworkError);
      setIsVerifying(false);
      return;
    }

    try {
      const publicSignals = Verifier.encodePublicInputs(
        BigInt(root.root),
        url,
        publicKey,
      );
      const verifyStart = performance.now();
      const isVerified = await verifier.verify(
        decodedProof.proof,
        publicSignals,
      );
      const verifyDuration = performance.now() - verifyStart;
      if (isVerified) {
        setValidRoot(root);
        setVerifyDurationMs(verifyDuration);
        setStatus(VerificationStatus.Success);
      } else {
        setStatus(VerificationStatus.VerifyError);
      }
    } catch {
      setStatus(VerificationStatus.VerifyError);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <h1 style={styles.title}>Proof Verification</h1>
        <form style={styles.form}>
          <label style={styles.field}>
            <span style={styles.label}>Proof</span>
            <textarea
              value={encodedProof}
              onChange={(event) =>
                setEncodedProof(normalizeEncodedProof(event.target.value))
              }
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
          {!isVerifying &&
            status === VerificationStatus.Success &&
            validRoot && (
              <section style={styles.successResult}>
                <p style={styles.resultTitle}>Verification succeeded</p>
                <p style={styles.resultMessage}>
                  The proof verification returned true.
                  {verifyDurationMs !== null &&
                    ` (took ${verifyDurationMs.toFixed(2)} ms)`}
                </p>
                <div style={styles.rootResult}>
                  <RootDetails root={validRoot} />
                </div>
              </section>
            )}
          {!isVerifying && status === VerificationStatus.DecodeError && (
            <section style={styles.failureResult}>
              <p style={styles.resultTitle}>Proof decode failed</p>
              <p style={styles.resultMessage}>
                The proof could not be decoded. isValid: false.
              </p>
            </section>
          )}
          {!isVerifying && status === VerificationStatus.RootNotFound && (
            <section style={styles.failureResult}>
              <p style={styles.resultTitle}>Invalid proof</p>
              <p style={styles.resultMessage}>
                The proof is invalid or has been revoked.
              </p>
            </section>
          )}
          {!isVerifying && status === VerificationStatus.NetworkError && (
            <section style={styles.failureResult}>
              <p style={styles.resultTitle}>Network access failed</p>
              <p style={styles.resultMessage}>
                Failed to fetch contract information from the network.
              </p>
            </section>
          )}
          {!isVerifying && status === VerificationStatus.VerifyError && (
            <section style={styles.failureResult}>
              <p style={styles.resultTitle}>Verification failed</p>
              <p style={styles.resultMessage}>
                The proof verification returned false.
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
    padding: "32px 24px 100vh",
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
    minHeight: "135px",
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
