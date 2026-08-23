import { readFileSync } from "fs";
import { MerkleTree, Leaf } from "merkle-t";
import { randomFieldElement } from "poseidon-h";
import { Prover, Provider, RtsLeafInputs } from "../../src/circuit";
import Web3 from "web3";
import type { ContractAbi } from "web3-types";
import { abi, bytecode } from "rts-core";
import { initialDuration, initialPublicKeys, verificationKey } from "../../src";
import { Verifier } from "../../ui/src/verifier";

describe("Integration", () => {
  const duration = initialDuration;
  const web3 = new Web3(
    new Web3.providers.HttpProvider("http://127.0.0.1:8545"),
  );
  /// provider generates private ids and reseller want to prove that he knows one of the ids and has ownership of the id

  // product id
  const productId =
    "11cc2c7efd180a75ab2f7a0f90af758c1acc7a4235783d7e2823720fb1dd4f58";
  const productIdBigint = BigInt(`0x${productId}`);

  // provider info
  const providerEmail = "phantomofrotten@gmail.com";
  const initLid = "";
  const poseidonInputsLength = 39;
  const merkleTreeDepth = 10;
  const numberOfLeaves = 2 ** merkleTreeDepth - 2;
  const inputs = Array.from(
    { length: numberOfLeaves },
    () => new RtsLeafInputs(randomFieldElement(), providerEmail, initLid),
  );
  const initialVerificationKey = {
    vk_alpha_1: verificationKey.vk_alpha_1,
    vk_beta_2: verificationKey.vk_beta_2,
    vk_gamma_2: verificationKey.vk_gamma_2,
    vk_delta_2: verificationKey.vk_delta_2,
    vk_alphabeta_12: verificationKey.vk_alphabeta_12,
    IC: verificationKey.IC,
  };
  const provider = new Provider(
    providerEmail,
    initLid,
    poseidonInputsLength,
    merkleTreeDepth,
    inputs,
  );
  let leaves: Leaf[];
  let rt: bigint;

  // ownership transfer email
  const resellerEmail = "boa.authapp@gmail.com";
  const resellerLid =
    "https://example.com/shop/148733c4-ffe9-476e-8f49-c4ced51ca5d2/item/dbf46592-9e7e-4c48-bea7-6cf1e643ccfe?location=us&category=0001";
  const productLeaf = new RtsLeafInputs(
    productIdBigint,
    resellerEmail,
    resellerLid,
  );
  const emailRaw = readFileSync(
    "tests/emails/11cc2c7efd180a75ab2f7a0f90af758c1acc7a4235783d7e2823720fb1dd4f58.eml",
    "utf8",
  );

  // setup groth16 prover
  const compiledCircuitPath = `wasms/rts${merkleTreeDepth}.wasm`;
  const zkeyPath = `setup_params/rts${merkleTreeDepth}.zkey`;
  const prover = new Prover(compiledCircuitPath, zkeyPath);
  let deployedContract: any;

  const rpc = async (method: string, params: unknown[] = []) => {
    const response = await fetch("http://127.0.0.1:8545", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
    });
    const payload = await response.json();
    if (payload.error) {
      throw new Error(payload.error.message);
    }
    return payload.result;
  };

  beforeAll(async () => {
    await rpc("hardhat_reset");
    // insert product leaf and transfer ownership
    provider.insertLeaf(productIdBigint);
    provider.transferOwnership(productIdBigint, resellerEmail);
    provider.setLid(productIdBigint, resellerEmail, resellerLid);
    // construct merkle tree
    const root = provider.getRoot();
    // deploy contract with initial root
    const [senderAddress] = await web3.eth.getAccounts();
    const deployment = new web3.eth.Contract(abi as ContractAbi).deploy({
      data: bytecode,
      arguments: [root, duration, initialPublicKeys, initialVerificationKey],
    });
    const gasEstimate = await deployment.estimateGas({ from: senderAddress });
    deployedContract = await deployment.send({
      from: senderAddress,
      gas: Math.ceil(Number(gasEstimate) * 1.2).toString(),
    });
    // publish leaves
    leaves = provider.publishLeaves();
  }, 1000000);

  it("should set correct merkle root and leaves", async () => {
    const merkleTree = new MerkleTree(leaves, poseidonInputsLength, {
      depth: merkleTreeDepth,
    });
    const root = merkleTree.root();
    rt = root;
    const contractRoots: {
      root: string;
    }[] = await deployedContract.methods.getValidRoots().call();
    const latestRoot = contractRoots[contractRoots.length - 1];

    expect(leaves.length).toBe(2 ** merkleTreeDepth);
    expect(leaves.includes(productLeaf.hash())).toBe(true);
    expect(latestRoot.root).toBe(`0x${root.toString(16).padStart(64, "0")}`);
  });

  it("should prove ownership and authentication", async () => {
    const merkleTree = new MerkleTree(leaves, poseidonInputsLength, {
      depth: merkleTreeDepth,
    });
    const rtsCircuitInputs = await Prover.generateRtsCircuitInputs(
      emailRaw,
      productLeaf,
      merkleTree,
      true,
    );
    const { proof } = await prover.prove(rtsCircuitInputs);
    const verifictionKey = await Verifier.getVerificationKey();
    const publicInputs = Verifier.encodePublicInputs(
      rt,
      resellerLid,
      rtsCircuitInputs.pubkey,
    );
    const verifier = new Verifier(verifictionKey);
    const verified = await verifier.verify(proof, publicInputs);

    expect(publicInputs).toHaveLength(47);
    expect(verified).toBe(true);
  }, 1000000);
});
