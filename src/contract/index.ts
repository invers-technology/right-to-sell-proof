import Web3 from "web3";
import { abi } from "rts-core";

const sepoliaRpcUrl = "https://ethereum-sepolia-rpc.publicnode.com";
const sepoliaContractAddress = "0x304289aC0A87846C9F4B949dffBf493b7686E54e";
const rpcUrl = process.env.RPC_URL;

export const network = rpcUrl ?? sepoliaRpcUrl;
export const contractAddress =
  rpcUrl !== undefined
    ? (process.env.CONTRACT_ADDRESS ?? sepoliaContractAddress)
    : sepoliaContractAddress;
export const web3 = new Web3(new Web3.providers.HttpProvider(network));
export const contract = new web3.eth.Contract(abi, contractAddress);
