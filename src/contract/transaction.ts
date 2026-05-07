import Web3 from "web3";
import { web3, network } from ".";

export const signTransaction = async (
  privateKey: string,
  gas: number | bigint,
  data: string,
) => {
  web3.eth.accounts.wallet.add(
    web3.eth.accounts.privateKeyToAccount(privateKey),
  );
  const from = web3.eth.accounts.privateKeyToAccount(privateKey).address;
  const nonce = await web3.eth.getTransactionCount(from, "pending");
  const chainId = await web3.eth.getChainId();
  const { rawTransaction } = await web3.eth.accounts.signTransaction(
    {
      from,
      data,
      gas: gas.toString(),
      chainId: Number(chainId),
      nonce,
      ...(await getFeeOverrides(web3)),
    },
    privateKey,
  );
  return rawTransaction;
};

export const sendTransaction = async (signedTx: string) => {
  const receipt = await web3.eth.sendSignedTransaction(signedTx);
  return receipt;
};

const GAS_BUFFER_NUMERATOR = 12n;
const GAS_BUFFER_DENOMINATOR = 10n;

export const estimateGasWithBuffer = async (
  estimatePromise: Promise<string | number | bigint>,
) => addGasBuffer(await estimatePromise).toString();

export const addGasBuffer = (gas: string | number | bigint) =>
  (BigInt(gas.toString()) * GAS_BUFFER_NUMERATOR +
    (GAS_BUFFER_DENOMINATOR - 1n)) /
  GAS_BUFFER_DENOMINATOR;

const DEFAULT_MAX_PRIORITY_FEE_PER_GAS_GWEI = "2";

const getMaxPriorityFeePerGasGwei = () =>
  process.env.MAX_PRIORITY_FEE_PER_GAS_GWEI ??
  (network.includes("127.0.0.1") || network.includes("localhost")
    ? "1"
    : DEFAULT_MAX_PRIORITY_FEE_PER_GAS_GWEI);

export const getFeeOverrides = async (web3: Web3) => {
  const pendingBlock = await web3.eth.getBlock("pending");
  if (pendingBlock.baseFeePerGas !== undefined) {
    const maxPriorityFeePerGas = BigInt(
      web3.utils.toWei(getMaxPriorityFeePerGasGwei(), "gwei"),
    );
    const baseFeePerGas = BigInt(pendingBlock.baseFeePerGas.toString());

    return {
      maxFeePerGas: (baseFeePerGas * 2n + maxPriorityFeePerGas).toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    };
  }

  const gasPrice = await web3.eth.getGasPrice();
  return {
    gasPrice: addGasBuffer(gasPrice).toString(),
  };
};
