import { abi, bytecode } from "rts-core";
import type { ContractAbi } from "web3-types";
import { CompactVerificationKey } from "rts-core";
import { web3 } from ".";
import { verificationKey } from "../brand";
import { estimateGasWithBuffer } from "./transaction";

export const deployContractTx = async (
  merkleRoot: string,
  initialDuration: number | bigint = 259200,
  publicKeys: bigint[][] = [],
  vKey: CompactVerificationKey = {
    vk_alpha_1: verificationKey.vk_alpha_1,
    vk_beta_2: verificationKey.vk_beta_2,
    vk_gamma_2: verificationKey.vk_gamma_2,
    vk_delta_2: verificationKey.vk_delta_2,
    vk_alphabeta_12: verificationKey.vk_alphabeta_12,
    IC: verificationKey.IC,
  },
  deployerAddress?: string,
) => {
  const deployTx = new web3.eth.Contract(abi as ContractAbi).deploy({
    data: bytecode,
    arguments: [merkleRoot, initialDuration, publicKeys, vKey],
  });
  let gas = 8000000;
  try {
    gas = Number(
      await estimateGasWithBuffer(
        deployTx.estimateGas(
          deployerAddress ? { from: deployerAddress } : undefined,
        ),
      ),
    );
  } catch {
    // Keep a safe fallback when remote estimation is unavailable.
  }
  const data = deployTx.encodeABI();

  return { gas, data };
};
