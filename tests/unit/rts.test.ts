import path from "path";
import { readFileSync } from "fs";
import { Leaf, MerkleTree } from "merkle-t";
import { lidToHashInputs } from "rts-core";
import { Provider, Prover, RtsLeafInputs } from "../../src/circuit";
const wasm = require("circom_tester").wasm;

describe("Rts", () => {
  const identifier = BigInt(
    "0x11cc2c7efd180a75ab2f7a0f90af758c1acc7a4235783d7e2823720fb1dd4f58",
  );
  const poseidonInputsLength = 39;
  const merkleTreeDepth = 7;
  const resellerEmail = "boa.authapp@gmail.com";
  const resellerLid =
    "https://example.com/shop/148733c4-ffe9-476e-8f49-c4ced51ca5d2/item/dbf46592-9e7e-4c48-bea7-6cf1e643ccfe?location=us&category=0001";
  const productLeaf = new RtsLeafInputs(identifier, resellerEmail, resellerLid);
  const emailRaw = readFileSync(
    "tests/emails/11cc2c7efd180a75ab2f7a0f90af758c1acc7a4235783d7e2823720fb1dd4f58.eml",
    "utf8",
  );
  let leaves: Leaf[];
  const providerEmail = "phantomofrotten@gmail.com";
  const initLid = "";
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
    provider.transferOwnership(identifier, resellerEmail);
    provider.setLid(identifier, resellerEmail, resellerLid);
    leaves = provider.publishLeaves();
  }, 1000000);

  it("computes the same Merkle root as MerkleTree.root()", async () => {
    const circuit = await getCircuit("rts");
    const merkleTree = new MerkleTree(leaves, poseidonInputsLength, {
      depth: merkleTreeDepth,
    });
    const expectedRoot = merkleTree.root();
    const rtsCircuitInputs = await Prover.generateRtsCircuitInputs(
      emailRaw,
      productLeaf,
      merkleTree,
      true,
    );

    expect(rtsCircuitInputs.lidFields).toEqual(
      lidToHashInputs(resellerLid).map((value: bigint) => value.toString()),
    );

    const witness = await circuit.calculateWitness(rtsCircuitInputs);

    await circuit.checkConstraints(witness);
    await circuit.assertOut(witness, { root: expectedRoot.toString() });
  }, 1000000);

  it("rejects lidFields that do not match the private LID bytes", async () => {
    const circuit = await getCircuit("rts");
    const merkleTree = new MerkleTree(leaves, poseidonInputsLength, {
      depth: merkleTreeDepth,
    });
    const rtsCircuitInputs = await Prover.generateRtsCircuitInputs(
      emailRaw,
      productLeaf,
      merkleTree,
      true,
    );
    const tamperedInputs = {
      ...rtsCircuitInputs,
      lidFields: [...rtsCircuitInputs.lidFields],
    };
    tamperedInputs.lidFields[0] = (
      BigInt(tamperedInputs.lidFields[0]) + 1n
    ).toString();

    await expect(circuit.calculateWitness(tamperedInputs)).rejects.toThrow(
      "Assert Failed",
    );
  }, 1000000);
});
