import Web3 from "web3";
import type { ContractAbi } from "web3-types";
import { abi, bytecode } from "rts-core";
import { initialPublicKeys, verificationKey } from "../../src/brand";

const rtsVerificationKey = {
  vk_alpha_1: verificationKey.vk_alpha_1,
  vk_beta_2: verificationKey.vk_beta_2,
  vk_gamma_2: verificationKey.vk_gamma_2,
  vk_delta_2: verificationKey.vk_delta_2,
  vk_alphabeta_12: verificationKey.vk_alphabeta_12,
  IC: verificationKey.IC,
};

describe("Contract", () => {
  jest.setTimeout(60_000);

  const web3 = new Web3(
    new Web3.providers.HttpProvider("http://127.0.0.1:8545"),
  );
  const duration = 259200;
  const initialRoot =
    "0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234";
  const zeroPublicKey = Array(17).fill("0");
  let deployedContract: any;
  let senderAddress: string;

  const normalizePublicKey = (publicKey: Array<string | number | bigint>) =>
    publicKey.map((value) => value.toString());

  const getPublicKey = async (
    targetContract: any,
    keyIndex: number,
  ): Promise<Array<string | number | bigint>> => {
    if (targetContract.methods.getPublicKey !== undefined) {
      const publicKey: Array<string | number | bigint> =
        await targetContract.methods.getPublicKey(keyIndex).call();
      return publicKey;
    }

    return await Promise.all(
      Array.from({ length: 17 }, async (_, elementIndex) =>
        targetContract.methods.publicKeys(keyIndex, elementIndex).call(),
      ),
    );
  };

  const rpc = async (method: string, params: unknown[] = []) => {
    const provider = web3.currentProvider as {
      request?: (payload: {
        method: string;
        params: unknown[];
      }) => Promise<unknown>;
      send: (
        payload: {
          jsonrpc: string;
          id: number;
          method: string;
          params: unknown[];
        },
        callback: (
          error: Error | null,
          response?: { result?: unknown; error?: { message: string } },
        ) => void,
      ) => void;
    };

    if (provider.request) {
      return provider.request({ method, params });
    }

    return await new Promise((resolve, reject) => {
      provider.send(
        {
          jsonrpc: "2.0",
          id: Date.now(),
          method,
          params,
        },
        (error, response) => {
          if (error) {
            reject(error);
            return;
          }
          if (response?.error) {
            reject(new Error(response.error.message));
            return;
          }
          resolve(response?.result);
        },
      );
    });
  };

  beforeEach(async () => {
    await rpc("hardhat_reset");
    const accounts = await web3.eth.getAccounts();
    senderAddress = accounts[0];

    const contractFactory = new web3.eth.Contract(abi as ContractAbi);
    const deployment = contractFactory.deploy({
      data: bytecode,
      arguments: [initialRoot, duration, initialPublicKeys, rtsVerificationKey],
    });
    const gasEstimate = await deployment.estimateGas({ from: senderAddress });
    deployedContract = await deployment.send({
      from: senderAddress,
      gas: Math.ceil(Number(gasEstimate) * 1.2).toString(),
    });
  });

  it("should be able to deploy the contract", async () => {
    expect(deployedContract.options.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(await deployedContract.methods.duration().call()).toBe(
      BigInt(duration),
    );
  });

  it("should return initial public keys from tests/leaf", async () => {
    for (let i = 0; i < initialPublicKeys.length; i++) {
      const publicKey = await getPublicKey(deployedContract, i);

      expect(normalizePublicKey(publicKey)).toEqual(
        normalizePublicKey(initialPublicKeys[i]),
      );
    }
  });

  it("should be able to add a public key", async () => {
    const tx = await deployedContract.methods
      .addPublicKey(initialPublicKeys[0])
      .send({
        from: senderAddress,
        gas: "500000",
      });
    const publicKey = await getPublicKey(
      deployedContract,
      initialPublicKeys.length,
    );

    expect(tx.status).toBe(1n);
    expect(normalizePublicKey(publicKey)).toEqual(
      normalizePublicKey(initialPublicKeys[0]),
    );
  });

  it("should be able to abolish a public key", async () => {
    await deployedContract.methods.addPublicKey(initialPublicKeys[0]).send({
      from: senderAddress,
      gas: "500000",
    });
    const addedKeyIndex = initialPublicKeys.length;

    const tx = await deployedContract.methods
      .abolishPublicKey(addedKeyIndex)
      .send({
        from: senderAddress,
        gas: "500000",
      });
    const publicKey = await getPublicKey(deployedContract, addedKeyIndex);

    expect(tx.status).toBe(1n);
    expect(normalizePublicKey(publicKey)).toEqual(zeroPublicKey);
  });

  it("getValidRoots should return roots recorded within the configured duration", async () => {
    const root2 =
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const root3 =
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    const initialRootRecord = await deployedContract.methods.roots(0).call();
    const tx2 = await deployedContract.methods.updateRoot(root2).send({
      from: senderAddress,
      gas: "100000",
    });
    const tx3 = await deployedContract.methods.updateRoot(root3).send({
      from: senderAddress,
      gas: "100000",
    });
    const block2 = await web3.eth.getBlock(tx2.blockNumber);
    const block3 = await web3.eth.getBlock(tx3.blockNumber);

    const validRoots = await deployedContract.methods.getValidRoots().call();

    expect(tx2.status).toBe(1n);
    expect(validRoots).toHaveLength(3);
    expect(validRoots[0].root).toBe(initialRoot);
    expect(validRoots[0].version).toBe(1n);
    expect(validRoots[0].timestamp).toBe(initialRootRecord.timestamp);
    expect(validRoots[1].root).toBe(root2);
    expect(validRoots[1].version).toBe(2n);
    expect(validRoots[1].timestamp).toBe(block2.timestamp);
    expect(validRoots[2].root).toBe(root3);
    expect(validRoots[2].version).toBe(3n);
    expect(validRoots[2].timestamp).toBe(block3.timestamp);
  });

  it("getValidRoots should narrow to the latest root when duration includes only the latest timestamp", async () => {
    const root2 =
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const root3 =
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    await deployedContract.methods.updateRoot(root2).send({
      from: senderAddress,
      gas: "100000",
    });
    const tx3 = await deployedContract.methods.updateRoot(root3).send({
      from: senderAddress,
      gas: "100000",
    });
    const latestRoot = await deployedContract.methods.roots(2).call();
    const tx = await deployedContract.methods.updateDuration(1).send({
      from: senderAddress,
      gas: "100000",
    });
    const validRoots = await deployedContract.methods.getValidRoots().call();

    expect(tx3.status).toBe(1n);
    expect(tx.status).toBe(1n);
    expect(validRoots).toHaveLength(1);
    expect(validRoots[0].root).toBe(latestRoot.root);
    expect(validRoots[0].version).toBe(latestRoot.version);
    expect(validRoots[0].timestamp).toBe(latestRoot.timestamp);
  });
});
