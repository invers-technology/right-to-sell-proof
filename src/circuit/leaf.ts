import { LeafInputs } from "merkle-t";
import { poseidon } from "poseidon-h";
import { emailToHashInputs } from "./email";
import { lidToHashInputs } from "rts-core";

type Inputs = [
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

export interface OrderedLeavesInputs {
  index: number;
  leaf: RtsLeafInputs;
}

export class RtsLeafInputs implements LeafInputs {
  identifier: bigint;
  email: string;
  lid: string;
  zeroHash: bigint;

  constructor(identifier: bigint, email: string, lid: string) {
    this.identifier = identifier;
    this.email = email;
    this.lid = lid;
    this.zeroHash = poseidon(this.toInputs().map(() => 0n));
  }

  hash(): bigint {
    return poseidon(this.toInputs());
  }

  toInputs(): Inputs {
    const emailFields = emailToHashInputs(this.email);
    const lidFields = lidToHashInputs(this.lid);
    const inputs = [this.identifier].concat(emailFields).concat(lidFields);
    return inputs as Inputs;
  }
}
