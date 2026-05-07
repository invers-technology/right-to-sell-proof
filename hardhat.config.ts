import picocolors from "picocolors";
import { normalizeHardhatNetworkAccountsConfig } from "hardhat/internal/core/providers/util";
import {
  TASK_NODE,
  TASK_NODE_SERVER_READY,
} from "hardhat/builtin-tasks/task-names";
import { HardhatUserConfig, subtask, task, types } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

task(TASK_NODE)
  .addOptionalParam(
    "mnemonic",
    "Mnemonic used to derive the accounts shown by `hardhat node`",
    undefined,
    types.string,
  )
  .setAction(async (taskArgs, hre, runSuper) => {
    if (taskArgs.mnemonic !== undefined) {
      const hardhatAccounts = hre.config.networks.hardhat.accounts;

      if (Array.isArray(hardhatAccounts)) {
        throw new Error(
          "The hardhat network is configured with explicit private keys, so --mnemonic cannot be applied.",
        );
      }

      hre.config.networks.hardhat.accounts = {
        ...hardhatAccounts,
        mnemonic: taskArgs.mnemonic,
      };
    }

    return runSuper(taskArgs);
  });

subtask(TASK_NODE_SERVER_READY).setAction(
  async ({ address, port }, { config }) => {
    const { bytesToHex, privateToAddress, toBytes, toChecksumAddress } =
      require("@ethereumjs/util") as typeof import("@ethereumjs/util");

    console.log(
      picocolors.green(
        `Started HTTP and WebSocket JSON-RPC server at http://${address}:${port}/`,
      ),
    );

    console.log();
    console.log("Accounts");
    console.log("========");
    console.log();

    const accounts = normalizeHardhatNetworkAccountsConfig(
      config.networks.hardhat.accounts,
    );

    for (const [index, account] of accounts.entries()) {
      const balance = (BigInt(account.balance) / 10n ** 18n).toString(10);
      const accountAddress = toChecksumAddress(
        bytesToHex(privateToAddress(toBytes(account.privateKey))),
      );

      console.log(`Account #${index}: ${accountAddress} (${balance} ETH)`);
      console.log(`Private Key: ${account.privateKey}`);
      console.log();
    }
  },
);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      accounts: [
        {
          privateKey:
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
          balance: "10000000000000000000000",
        },
      ],
    },
    local: {
      url: "http://127.0.0.1:8545",
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      ],
    },
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      ],
      gasMultiplier: 1.2,
    },
  },
};

export default config;
