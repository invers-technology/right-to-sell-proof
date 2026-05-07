import path from "path";
import { Leaf, MerkleTree } from "merkle-t";
import { Provider, RtsLeafInputs } from "../../src/circuit";
const wasm = require("circom_tester").wasm;

describe("Tree and Leaf circuits", () => {
  const identifier = BigInt(
    "0x11cc2c7efd180a75ab2f7a0f90af758c1acc7a4235783d7e2823720fb1dd4f58",
  );
  const email = "boa.authapp@gmail.com";
  const lid =
    "https://example.com/shop/148733c4-ffe9-476e-8f49-c4ced51ca5d2/item/dbf46592-9e7e-4c48-bea7-6cf1e643ccfe?location=us&category=0001";
  const poseidonInputsLength = 39;
  const merkleTreeDepth = 7;
  const providerEmail = "phantomofrotten@gmail.com";
  const initLid = "";
  const productLeaf = new RtsLeafInputs(identifier, email, lid);
  let leaves: Leaf[];

  const generateLeafCircuitInputs = (leaf: RtsLeafInputs) => {
    const inputs = leaf.toInputs();
    return {
      identifier: inputs[0].toString(),
      emailFields: inputs.slice(1, 10).map((value: bigint) => value.toString()),
      lidFields: inputs.slice(10).map((value: bigint) => value.toString()),
    };
  };

  const membershipProofCircuitInputs = (
    leaf: bigint,
    merkleTree: MerkleTree,
  ) => {
    const leafProof = merkleTree.prove(leaf);
    const { merklePath: path, merkleWitness: witness } = leafProof;
    const membershipProofInputs = {
      leaf,
      path,
      witness,
    };
    return membershipProofInputs;
  };

  const getCircuit = async (name: string) =>
    await wasm(
      path.join(__dirname, "..", "circuits", `${name}.test.circom`),
      circomOption,
    );
  const circomOption = {
    include: path.join("node_modules"),
  };

  beforeAll(async () => {
    const provider = new Provider(
      providerEmail,
      initLid,
      poseidonInputsLength,
      merkleTreeDepth,
      [],
    );
    provider.generateIds(100);
    provider.insertLeaf(identifier);
    provider.transferOwnership(identifier, email);
    provider.setLid(identifier, email, lid);
    leaves = provider.publishLeaves();
  }, 1000000);

  const merkleProofFixture = () => {
    const merkleTree = new MerkleTree(leaves, poseidonInputsLength, {
      depth: merkleTreeDepth,
    });
    const leaf = productLeaf.hash();
    const { path: proofPath, witness: proofWitness } =
      membershipProofCircuitInputs(leaf, merkleTree);

    return {
      proofPath,
      proofWitness,
      expectedRoot: merkleTree.root(),
    };
  };

  it("computes the same Poseidon hash as RtsLeafInputs.hash()", async () => {
    const circuit = await getCircuit("leaf");
    const expected = productLeaf.hash();

    const witness = await circuit.calculateWitness(
      generateLeafCircuitInputs(productLeaf),
    );

    await circuit.checkConstraints(witness);
    await circuit.assertOut(witness, { out: expected.toString() });
  }, 1000000);

  it("matches RtsLeafInputs.zeroHash for an all-zero input", async () => {
    const circuit = await getCircuit("leaf");
    const expected = productLeaf.zeroHash;

    const witness = await circuit.calculateWitness({
      identifier: "0",
      emailFields: Array.from({ length: 9 }, () => "0"),
      lidFields: Array.from({ length: 29 }, () => "0"),
    });

    await circuit.checkConstraints(witness);
    await circuit.assertOut(witness, { out: expected.toString() });
  }, 1000000);

  it("produces different hashes for different identifiers", async () => {
    const circuit = await getCircuit("leaf");
    const otherIdentifier = identifier + 1n;
    const leafA = new RtsLeafInputs(identifier, email, lid);
    const leafB = new RtsLeafInputs(otherIdentifier, email, lid);

    const witnessA = await circuit.calculateWitness(
      generateLeafCircuitInputs(leafA),
    );
    const witnessB = await circuit.calculateWitness(
      generateLeafCircuitInputs(leafB),
    );

    await circuit.checkConstraints(witnessA);
    await circuit.checkConstraints(witnessB);
    await circuit.assertOut(witnessA, { out: leafA.hash().toString() });
    await circuit.assertOut(witnessB, { out: leafB.hash().toString() });
    expect(leafA.hash()).not.toEqual(leafB.hash());
  }, 1000000);

  describe("Tree circuit", () => {
    it("computes the same Merkle root as MerkleTree.root()", async () => {
      const circuit = await getCircuit("tree");
      const { proofPath, proofWitness, expectedRoot } = merkleProofFixture();

      const witness = await circuit.calculateWitness({
        ...generateLeafCircuitInputs(productLeaf),
        path: proofPath,
        witness: proofWitness.map((value: bigint) => value.toString()),
      });

      await circuit.checkConstraints(witness);
      await circuit.assertOut(witness, { root: expectedRoot.toString() });
    }, 1000000);

    it("rejects a tampered witness", async () => {
      const circuit = await getCircuit("tree");
      const { proofPath, proofWitness, expectedRoot } = merkleProofFixture();

      // flip the lowest sibling so the recomputed root no longer matches
      const tamperedWitness = [...proofWitness];
      tamperedWitness[0] = tamperedWitness[0] + 1n;

      const witness = await circuit.calculateWitness({
        ...generateLeafCircuitInputs(productLeaf),
        path: proofPath,
        witness: tamperedWitness.map((value: bigint) => value.toString()),
      });

      await circuit.checkConstraints(witness);
      await expect(
        circuit.assertOut(witness, { root: expectedRoot.toString() }),
      ).rejects.toBeDefined();
    }, 1000000);
  });
});
