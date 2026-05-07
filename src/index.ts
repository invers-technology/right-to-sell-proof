import { readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { MerkleTree } from "merkle-t";
import { Provider, Prover, RtsLeafInputs } from "./circuit";
import {
  providerEmail,
  initLid,
  poseidonInputsLength,
  merkleTreeDepth,
  identifiers,
} from "./brand";
import {
  platformUrl,
  shopIds,
  itemIds,
  locales,
  category,
  resellerEmail,
} from "./reseller";

export const calculateLeaves = () => {
  const provider = new Provider(
    providerEmail,
    initLid,
    poseidonInputsLength,
    merkleTreeDepth,
    [],
  );
  provider.generateIds(100);
  for (let i = 0; i < 10; i++) {
    const resellerLid = `${platformUrl}/shop/${shopIds[i]}/item/${itemIds[i]}?localte=${locales[i]}&category=${category[i % 4]}`;
    provider.insertLeaf(identifiers[i]);
    provider.transferOwnership(identifiers[i], resellerEmail);
    provider.setLid(identifiers[i], resellerEmail, resellerLid);
  }
  return provider.publishLeaves();
};

export const calculateRoot = async (index: number) => {
  const leaves = calculateLeaves();
  // setup groth16 prover
  const compiledCircuitPath = `wasms/rts${merkleTreeDepth}.wasm`;
  const zkeyPath = `setup_params/rts${merkleTreeDepth}.zkey`;
  const prover = new Prover(compiledCircuitPath, zkeyPath);

  const merkleTree = new MerkleTree(leaves, poseidonInputsLength, {
    depth: merkleTreeDepth,
  });

  const identifierHex = identifiers[index].toString(16).padStart(64, "0");
  const resellerLid = `${platformUrl}/shop/${shopIds[index]}/item/${itemIds[index]}?localte=${locales[index]}&category=${category[index % 4]}`;
  const productLeaf = new RtsLeafInputs(
    identifiers[index],
    resellerEmail,
    resellerLid,
  );
  const emailRaw = readFileSync(`tests/emails/${identifierHex}.eml`, "utf8");
  const filePath = `${identifierHex}.json`;
  const rtsCircuitInputs = await Prover.generateRtsCircuitInputs(
    emailRaw,
    productLeaf,
    merkleTree,
  );
  const proofOutput = await prover.prove(rtsCircuitInputs);
  await writeFile(filePath, JSON.stringify(proofOutput), "utf8");

  return merkleTree.root();
};

export * from "./brand";
export * from "./reseller";
