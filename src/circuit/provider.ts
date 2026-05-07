import { Leaf } from "merkle-t";
import { randomFieldElement } from "poseidon-h";
import { MembershipProof } from "./tree";
import { RtsLeafInputs } from "./leaf";

export class Provider {
  private email: string;
  private initLid: string;
  private merkleTree: MembershipProof;

  constructor(
    email: string,
    initLid: string,
    poseidonInputsLength: number,
    depth: number,
    inputs: RtsLeafInputs[],
  ) {
    this.email = email;
    this.initLid = initLid;
    this.merkleTree = new MembershipProof(inputs, poseidonInputsLength, {
      depth,
    });
  }

  generateIds(count: number): void {
    for (let i = 0; i < count; i++) {
      const id = randomFieldElement();
      this.merkleTree.insert(id, this.email, this.initLid);
    }
  }

  insertLeaf(id: bigint): void {
    this.merkleTree.insert(id, this.email, this.initLid);
  }

  transferOwnership(id: bigint, email: string): void {
    this.merkleTree.update(id, email, this.initLid);
  }

  setLid(id: bigint, email: string, lid: string): void {
    this.merkleTree.update(id, email, lid);
  }

  publishLeaves(): Leaf[] {
    return this.merkleTree.getLeaves();
  }

  getRoot(): `0x${string}` {
    return `0x${this.merkleTree.root().toString(16).padStart(64, "0")}`;
  }
}
