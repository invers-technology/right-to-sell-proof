import { readFileSync } from "fs";
import {
  curve,
  decodeProof,
  encodeProof,
  nPublic,
  protocol,
  PROOF_CURVE_POINTS_LENGTH,
} from "rts-core";
import type { ProofArtifacts, Proof } from "rts-core";
import { Verifier } from "../../ui/src/verifier";
import { Prover } from "../../src/circuit";
import {
  platformUrl,
  shopIds,
  itemIds,
  locales,
  category,
} from "../../src/reseller";
import {
  identifiers,
  verificationKey,
  initialPublicKeys,
} from "../../src/brand";

describe("consumer getVerificationKey", () => {
  jest.setTimeout(60_000);

  it("should match the verification key", async () => {
    const fetchedVerificationKey = await Verifier.getVerificationKey();
    const fullVerifictionKey = {
      curve,
      nPublic,
      protocol,
      ...verificationKey,
    };

    expect(fetchedVerificationKey).toEqual(fullVerifictionKey);
  });

  it("should match the public key", async () => {
    for (let i = 0; i < initialPublicKeys.length; i++) {
      const publicKey = await Verifier.getPublicKey(i);
      expect(publicKey).toEqual(initialPublicKeys[i]);
    }
  });

  it("should encode and decode proof", async () => {
    for (let i = 0; i < 10; i++) {
      const identifierHex = identifiers[i].toString(16).padStart(64, "0");
      const parsedProof: { proof: Proof } = JSON.parse(
        readFileSync(`tests/proofs/${identifierHex}.json`, "utf-8"),
      );
      const { proof } = parsedProof;
      const encoded = await encodeProof(proof);
      const decoded = await decodeProof(encoded);

      expect(encoded).toHaveLength(PROOF_CURVE_POINTS_LENGTH);
      expect(decoded).toEqual(proof);
    }
  });

  it("should encode and decode proof artifacts", async () => {
    for (let i = 0; i < 10; i++) {
      const resellerLid = `${platformUrl}/shop/${shopIds[i]}/item/${itemIds[i]}?localte=${locales[i]}&category=${category[i % 4]}`;
      const identifierHex = identifiers[i].toString(16).padStart(64, "0");
      const proofArtifacts: ProofArtifacts = JSON.parse(
        readFileSync(`tests/proofs/${identifierHex}.json`, "utf-8"),
      );
      const encoded = await Prover.encodeProof(proofArtifacts);
      const { publicKey, proof, root } = await Verifier.decodeProof(encoded);

      const publicInputs = Verifier.encodePublicInputs(
        BigInt(root.root),
        resellerLid,
        publicKey,
      );

      expect(proof).toEqual(proofArtifacts.proof);
      expect(publicInputs).toEqual(proofArtifacts.publicSignals);
    }
  });

  it("shuld verify proof", async () => {
    for (let i = 0; i < 10; i++) {
      const resellerLid = `${platformUrl}/shop/${shopIds[i]}/item/${itemIds[i]}?localte=${locales[i]}&category=${category[i % 4]}`;
      const identifierHex = identifiers[i].toString(16).padStart(64, "0");
      const { proof, publicSignals } = JSON.parse(
        readFileSync(`tests/proofs/${identifierHex}.json`, "utf-8"),
      );
      const fethcedVerifictionKey = await Verifier.getVerificationKey();
      const verifier = new Verifier(fethcedVerifictionKey);
      const verified = await verifier.verify(proof, publicSignals);
      expect(verified).toBe(true);
    }
  });
});
