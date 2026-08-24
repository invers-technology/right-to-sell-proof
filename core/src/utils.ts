import {
  MAX_LID_LENGTH,
  MAX_PADDED_LID_LENGTH,
  curve,
  protocol,
} from "./constants";
import { AsciiField, LidFields, LidHashInputs, Proof } from "./type";

export const bytesToBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const base64UrlToBytes = (base64url: string): Uint8Array => {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// ─── LID helpers ─────────────────────────────────────────────────────────────

export const padLid = (lid: string): Uint8Array => {
  if (lid.length > MAX_LID_LENGTH) {
    throw new Error("LID is too long");
  }
  const lower = lid.toLowerCase();
  const result = new Uint8Array(MAX_PADDED_LID_LENGTH);
  for (let i = 0; i < lower.length; i++) {
    result[i] = lower.charCodeAt(i);
  }
  return result;
};

export const asciiFieldToField = (asciiField: AsciiField): bigint => {
  return asciiField.reduce((acc, field) => {
    return (acc << 7n) | BigInt(field);
  }, 0n);
};

const lidToAsciiFields = (lid: string): LidFields => {
  const padded = padLid(lid);
  const lidFields = [...Array(29)].map((_, i) => {
    const subarray = padded.subarray(i * 36, (i + 1) * 36);
    const field = Array.from(
      { length: 36 },
      (_, j) => subarray[j],
    ) as unknown as AsciiField;
    return field;
  }) as LidFields;
  return lidFields;
};

export const lidToHashInputs = (lid: string): LidHashInputs => {
  const fields = lidToAsciiFields(lid).map(asciiFieldToField) as LidHashInputs;
  return fields;
};

export const encodeProof = async (proof: Proof): Promise<string> => {
  const { curves } = (await import("snarkjs")) as any;
  const bn128 = await curves.getCurveFromName("bn128");
  const { pi_a, pi_b, pi_c } = proof;

  // G1 pi_a → 32 bytes
  const pA = bn128.G1.fromObject(pi_a.map(BigInt));
  const aComp = new Uint8Array(32);
  bn128.G1.toRprCompressed(aComp, 0, pA);

  // G2 pi_b → 64 bytes
  const pB = bn128.G2.fromObject([
    pi_b[0].map(BigInt),
    pi_b[1].map(BigInt),
    pi_b[2].map(BigInt),
  ]);
  const bComp = new Uint8Array(64);
  bn128.G2.toRprCompressed(bComp, 0, pB);

  // G1 pi_c → 32 bytes
  const pC = bn128.G1.fromObject(pi_c.map(BigInt));
  const cComp = new Uint8Array(32);
  bn128.G1.toRprCompressed(cComp, 0, pC);

  // Pack: 32 + 64 + 32 = 128 bytes
  const buf = new Uint8Array(128);
  buf.set(aComp, 0);
  buf.set(bComp, 32);
  buf.set(cComp, 96);

  return bytesToBase64Url(buf);
};

export const decodeProof = async (encodedProof: string): Promise<Proof> => {
  const { curves } = (await import("snarkjs")) as any;
  const bn128 = await curves.getCurveFromName("bn128");

  const buf = base64UrlToBytes(encodedProof);

  // G1 pi_a: bytes 0–31
  const objA = bn128.G1.toObject(bn128.G1.fromRprCompressed(buf, 0));

  // G2 pi_b: bytes 32–95
  const objB = bn128.G2.toObject(bn128.G2.fromRprCompressed(buf, 32));

  // G1 pi_c: bytes 96–127
  const objC = bn128.G1.toObject(bn128.G1.fromRprCompressed(buf, 96));

  return {
    pi_a: [objA[0].toString(), objA[1].toString(), "1"],
    pi_b: [
      [objB[0][0].toString(), objB[0][1].toString()],
      [objB[1][0].toString(), objB[1][1].toString()],
      ["1", "0"],
    ],
    pi_c: [objC[0].toString(), objC[1].toString(), "1"],
    curve,
    protocol,
  };
};
