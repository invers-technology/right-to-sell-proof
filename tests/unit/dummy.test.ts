import path from "path";
import { readFileSync } from "fs";
import { MerkleTree } from "merkle-t";
import { lidToHashInputs } from "rts-core";
import { Prover, RtsLeafInputs } from "../../src/circuit";
import { calculateLeaves } from "../../src";
import { identifiers } from "../../src/brand";
import {
  resellerEmail,
  platformUrl,
  shopIds,
  itemIds,
  locales,
  category,
} from "../../src/reseller";
const wasm = require("circom_tester").wasm;

describe("dummy", () => {
  const poseidonInputsLength = 39;
  const merkleTreeDepth = 7;

  const getCircuit = async (name: string) =>
    await wasm(
      path.join(__dirname, "..", "circuits", `${name}.test.circom`),
      circomOption,
    );
  const circomOption = {
    include: path.join("node_modules"),
  };

  it("should verify DKIM", async () => {
    const leaves = await calculateLeaves();
    const circuit = await getCircuit("rts");
    const merkleTree = new MerkleTree(leaves, poseidonInputsLength, {
      depth: merkleTreeDepth,
    });
    const expectedRoot = merkleTree.root();

    const leafIndex = 1;
    const identifierHex = identifiers[leafIndex].toString(16).padStart(64, "0");
    const emailRaw = readFileSync(`tests/emails/${identifierHex}.eml`, "utf8");
    const resellerLid = `${platformUrl}/shop/${shopIds[leafIndex]}/item/${itemIds[leafIndex]}?localte=${locales[leafIndex]}&category=${category[leafIndex % 4]}`;
    const productLeaf = new RtsLeafInputs(
      identifiers[leafIndex],
      resellerEmail,
      resellerLid,
    );
    const rtsCircuitInputs = await Prover.generateRtsCircuitInputs(
      emailRaw,
      productLeaf,
      merkleTree,
    );

    expect(rtsCircuitInputs.lidFields).toEqual(
      lidToHashInputs(resellerLid).map((value: bigint) => value.toString()),
    );

    const witness = await circuit.calculateWitness(rtsCircuitInputs);

    await circuit.checkConstraints(witness);
    await circuit.assertOut(witness, { root: expectedRoot.toString() });
  }, 1000000);
});
