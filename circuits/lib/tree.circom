pragma circom 2.1.6;

include "leaf.circom";
include "merkle-t/circuit/merkle.circom";

template Tree(nDepth) {
    // Leaf inputs (mirror RtsLeafInputs.toInputs()).
    signal input identifier;
    signal input emailFields[9];
    signal input lidFields[29];

    // Merkle membership proof.
    signal input path[nDepth];
    signal input witness[nDepth];

    signal output root;

    // Recompute the leaf hash from the raw inputs.
    component leaf = Leaf();
    leaf.identifier <== identifier;
    leaf.emailFields <== emailFields;
    leaf.lidFields <== lidFields;

    // Verify membership against the Merkle tree.
    component merkle = MerkleTree(nDepth);
    merkle.leaf <== leaf.out;
    merkle.path <== path;
    merkle.witness <== witness;

    root <== merkle.root;
}
