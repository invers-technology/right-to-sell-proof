import { RtsLeafInputs, OrderedLeavesInputs } from "./leaf";
import { lidToCircuitInputs } from "./lid";
import { MerkleTree } from "merkle-t";
import { lidToHashInputs } from "rts-core";

export class MembershipProof extends MerkleTree {
  private count: number;
  private orderedLeavesInputs: OrderedLeavesInputs[];

  constructor(
    leafInputs: RtsLeafInputs[],
    poseidonInputsLength: number,
    options?: { depth: number },
  ) {
    const orderedLeavesInputs: OrderedLeavesInputs[] = leafInputs.map(
      (leaf, index) => ({
        leaf,
        index,
      }),
    );
    const leaves = orderedLeavesInputs
      .sort((a, b) => a.index - b.index)
      .map(({ leaf }) => leaf.hash());
    super(leaves, poseidonInputsLength, options);
    this.orderedLeavesInputs = orderedLeavesInputs;
    this.count = leafInputs.length;
  }

  insert(identifier: bigint, email: string, lid: string) {
    if (this.count >= Math.pow(2, this.depth)) {
      throw new Error("Cannot insert more leaves");
    }
    const leaf = new RtsLeafInputs(identifier, email, lid);
    this.orderedLeavesInputs.push({
      leaf,
      index: this.orderedLeavesInputs.length,
    });
    this.count++;
    this.updateMerkleLeaves();
  }

  update(identifier: bigint, email: string, lid: string) {
    const index = this.searchIndex(identifier);
    const leaf = new RtsLeafInputs(identifier, email, lid);
    this.orderedLeavesInputs[index] = { leaf, index };
    this.updateMerkleLeaves();
  }

  get(identifier: bigint) {
    const index = this.searchIndex(identifier);
    return this.orderedLeavesInputs[index];
  }

  getRoot() {
    this.updateMerkleLeaves();
    return this.root();
  }

  private updateMerkleLeaves() {
    const leaves = this.orderedLeavesInputs
      .sort((a, b) => a.index - b.index)
      .map(({ leaf }, index) => ({ leaf: leaf.hash(), index }));
    this.orderedLeaves = leaves;
  }

  private searchIndex(identifier: bigint) {
    const index = this.orderedLeavesInputs.findIndex(
      ({ leaf }) => leaf.identifier === identifier,
    );
    if (index === -1) {
      throw new Error("Leaf not found");
    }
    return index;
  }
}

export const rtsMembershipCircuitInputs = (
  leaf: RtsLeafInputs,
  merkleTree: MerkleTree,
) => {
  const leafProof = merkleTree.prove(leaf.hash());
  const { merklePath: path, merkleWitness: witness } = leafProof;

  return {
    path,
    witness,
    lid: Array.from(lidToCircuitInputs(leaf.lid), (value) => value.toString()),
    lidFields: lidToHashInputs(leaf.lid).map((value) => value.toString()),
  };
};
