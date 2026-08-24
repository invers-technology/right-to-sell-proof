import { groth16, Groth16Proof, PublicSignals } from "snarkjs";
import { contract } from "../constants";
import {
  VerificationKey,
  CompactVerificationKey,
  protocol,
  curve,
  nPublic,
  lidToHashInputs,
  decodeProof,
  Root,
  PROOF_CURVE_POINTS_LENGTH,
  PROOF_PUBLIC_KEY_INDEX_LENGTH,
  PROOF_ROOT_VERSION_LENGTH,
  PROOF_MAX_LENGTH,
} from "rts-core";

const base64Alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export const fixedBase64ToNumber = (encoded: string) => {
  return [...encoded].reduce((acc, char) => {
    const value = base64Alphabet.indexOf(char);
    if (value < 0) {
      throw new Error(`Invalid base64 index character: ${char}`);
    }
    return acc * 64 + value;
  }, 0);
};

export class Verifier {
  vKey: VerificationKey;

  constructor(vKey: VerificationKey) {
    this.vKey = vKey;
  }

  async verify(proof: Groth16Proof, publicSignals: PublicSignals) {
    const verified = await groth16.verify(this.vKey, publicSignals, proof);
    return verified;
  }

  static async getVerificationKey(): Promise<VerificationKey> {
    const {
      vk_alpha_1,
      vk_beta_2,
      vk_gamma_2,
      vk_delta_2,
      vk_alphabeta_12,
      IC,
    } = (await contract.methods
      .getVerificationKey()
      .call()) as CompactVerificationKey;
    return {
      protocol,
      curve,
      nPublic,
      vk_alpha_1,
      vk_beta_2,
      vk_gamma_2,
      vk_delta_2,
      vk_alphabeta_12,
      IC,
    };
  }

  static async getPublicKey(keyIndex: number): Promise<bigint[]> {
    return (await contract.methods.getPublicKey(keyIndex).call()) as bigint[];
  }

  static async getValidRoots(): Promise<Root[]> {
    return await contract.methods.getValidRoots().call();
  }

  static getLatestRootFromRoots(roots: Root[]) {
    return roots[roots.length - 1];
  }

  static async getLatestRoot() {
    const roots = await this.getValidRoots();
    return this.getLatestRootFromRoots(roots);
  }

  static getRootFromVersionInRoots(targetVersion: bigint, roots: Root[]) {
    for (const root of roots) {
      if (targetVersion === BigInt(root.version.toString())) {
        return root;
      }
    }
    throw new Error(`Root not found: ${targetVersion}`);
  }

  static async getRootFromVersion(targetVersion: bigint) {
    const roots = await this.getValidRoots();
    return this.getRootFromVersionInRoots(targetVersion, roots);
  }

  static encodePublicInputs(rt: bigint, lid: string, pubkey: bigint[]) {
    return [rt, ...pubkey, ...lidToHashInputs(lid)].map((elm) =>
      elm.toString(),
    );
  }

  static async decodeProofIndexes(base64Proof: string) {
    const normalizedProof = base64Proof.trim();
    if (normalizedProof.length !== PROOF_MAX_LENGTH) {
      throw new Error(
        `Invalid proof length: expected ${PROOF_MAX_LENGTH}, received ${normalizedProof.length}`,
      );
    }

    let index = 0;
    const proofPart = normalizedProof.slice(
      index,
      index + PROOF_CURVE_POINTS_LENGTH,
    );
    const proof = await decodeProof(proofPart);
    index += PROOF_CURVE_POINTS_LENGTH;
    const publicKeyIndexPart = normalizedProof.slice(
      index,
      index + PROOF_PUBLIC_KEY_INDEX_LENGTH,
    );
    const keyIndex = fixedBase64ToNumber(publicKeyIndexPart);
    index += PROOF_PUBLIC_KEY_INDEX_LENGTH;
    const rootVersionPart = normalizedProof.slice(
      index,
      index + PROOF_ROOT_VERSION_LENGTH,
    );
    const rootVersion = BigInt(fixedBase64ToNumber(rootVersionPart));

    return { proof, keyIndex, rootVersion };
  }

  static async decodeProof(base64Proof: string) {
    const { proof, keyIndex, rootVersion } =
      await this.decodeProofIndexes(base64Proof);
    const publicKey = (await contract.methods
      .getPublicKey(keyIndex)
      .call()) as bigint[];
    const root = await this.getRootFromVersion(rootVersion);

    return { proof, publicKey, root };
  }
}
