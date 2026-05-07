/**
 * LID is encoded into 29 fields.
 * Each field has 36 utf8 characters.
 */

import { LidCircuitInputs, padLid, MAX_LID_LENGTH } from "rts-core";

export const lidToCircuitInputs = (lid: string): LidCircuitInputs => {
  return Array.from(
    padLid(lid).subarray(0, MAX_LID_LENGTH),
  ) as unknown as LidCircuitInputs;
};
