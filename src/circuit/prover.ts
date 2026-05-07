import { MerkleTree } from "merkle-t";
import { CircuitSignals, groth16 } from "snarkjs";
import { dkimCircuitInputs, gmailDkimCircuitInputs } from "zk-email-light";
import {
  ProofArtifacts,
  encodeProof,
  Root,
  PROOF_PUBLIC_KEY_INDEX_LENGTH,
  PROOF_ROOT_VERSION_LENGTH,
} from "rts-core";
import { RtsLeafInputs } from "./leaf";
import { rtsMembershipCircuitInputs } from "./tree";
import { ownershipAndAuthCircuitInputs } from "./email";
import { Brand } from "../brand";
import { contract } from "../contract";

const normalizeRoot = (root: string | bigint) => {
  return `0x${BigInt(root.toString()).toString(16).padStart(64, "0")}`;
};

const base64Alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const numberToFixedBase64 = (value: number | bigint, length: number) => {
  const remaining = BigInt(value);
  const max = 1n << BigInt(length * 6);
  if (remaining < 0n || remaining >= max) {
    throw new Error(`Value ${value.toString()} exceeds ${length} base64 chars`);
  }

  let encoded = "";
  for (let i = 0; i < length; i++) {
    const shift = BigInt((length - i - 1) * 6);
    const index = Number((remaining >> shift) & 63n);
    encoded += base64Alphabet[index];
  }
  return encoded;
};

export class Prover {
  compiledCircuit: string;
  zkey: string;

  constructor(compiledCircuit: string, zkey: string) {
    this.compiledCircuit = compiledCircuit;
    this.zkey = zkey;
  }

  async prove(inputs: CircuitSignals) {
    const { proof, publicSignals } = await groth16.fullProve(
      inputs,
      this.compiledCircuit,
      this.zkey,
    );
    return { proof, publicSignals };
  }

  static async generateRtsCircuitInputs(
    emailRaw: string,
    leaf: RtsLeafInputs,
    merkleTree: MerkleTree,
    isGmail: boolean = false,
  ) {
    const dkimInputs = isGmail
      ? gmailDkimCircuitInputs(emailRaw)
      : await dkimCircuitInputs(emailRaw);
    const ownershipAndAuthInputs = ownershipAndAuthCircuitInputs(emailRaw);
    const membershipProofInputs = rtsMembershipCircuitInputs(leaf, merkleTree);
    return {
      ...ownershipAndAuthInputs,
      ...membershipProofInputs,
      ...dkimInputs,
    };
  }

  static async getRootVersion(targetRoot: string) {
    const roots = (await contract.methods.getValidRoots().call()) as Root[];
    const normalizedTargetRoot = normalizeRoot(targetRoot);
    for (const { root, version } of roots) {
      if (normalizedTargetRoot === normalizeRoot(root)) {
        return version;
      }
    }
    throw new Error(`Root not found: ${targetRoot}`);
  }

  static async encodeProof(proofArtifacts: ProofArtifacts) {
    const { proof, publicSignals } = proofArtifacts;
    let encodedProof = await encodeProof(proof);
    const publicKey = publicSignals.slice(1, 18).map(BigInt);
    const publicKeyIndex = Brand.getPublicKeyIndex(publicKey);
    const keyIndex = numberToFixedBase64(
      publicKeyIndex,
      PROOF_PUBLIC_KEY_INDEX_LENGTH,
    );
    const root = publicSignals[0];
    const rootIndex = await this.getRootVersion(root);
    const rtIndex = numberToFixedBase64(rootIndex, PROOF_ROOT_VERSION_LENGTH);
    encodedProof += keyIndex;
    encodedProof += rtIndex;
    return encodedProof;
  }
}
