export const MAX_EMAIL_LENGTH = 320;
export const MAX_PADDED_EMAIL_LENGTH = 324;
export const MAX_LID_LENGTH = 1024;
export const MAX_PADDED_LID_LENGTH = 1044;
export const HASH_INPUT_LENGTH = 39;

export const protocol = "groth16";
export const curve = "bn128";
export const nPublic = 47;

export const ELEMENT_BASE64_LENGTH = 43;

// Compressed proof: pi_a (G1, 32 B) + pi_b (G2, 64 B) + pi_c (G1, 32 B) = 128 bytes
export const PROOF_CURVE_POINTS_LENGTH = 171;
export const PROOF_PUBLIC_KEY_INDEX_LENGTH = 1;
export const PROOF_ROOT_VERSION_LENGTH = 2;
export const PROOF_MAX_LENGTH =
  PROOF_CURVE_POINTS_LENGTH +
  PROOF_PUBLIC_KEY_INDEX_LENGTH +
  PROOF_ROOT_VERSION_LENGTH;
