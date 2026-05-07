// lid is encoded into 29 fields
export type LidFields = [
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
  AsciiField,
];

export type LidCircuitInputs = FixedSizeArray<1024, number>;

// LID fields
export type LidHashInputs = [
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
];

export type FixedSizeArray<N extends number, T, M extends string = "0"> = {
  readonly [k in M]: T;
} & { length: N } & ReadonlyArray<T>;

// field consists of 36 ascii characters
export type AsciiField = FixedSizeArray<36, number>;

export interface CompactVerificationKey {
  vk_alpha_1: bigint[];
  vk_beta_2: bigint[][];
  vk_gamma_2: bigint[][];
  vk_delta_2: bigint[][];
  vk_alphabeta_12: bigint[][][];
  IC: bigint[][];
}

export interface VerificationKey extends CompactVerificationKey {
  protocol: string;
  curve: string;
  nPublic: number | string;
}

export interface Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export interface ProofArtifacts {
  proof: Proof;
  publicSignals: string[];
}

export interface Root {
  root: string;
  version: bigint;
  timestamp: bigint;
}
