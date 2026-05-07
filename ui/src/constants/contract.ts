import Web3 from "web3";
import { abi } from "rts-core";

export const network = "https://ethereum-sepolia-rpc.publicnode.com";
export const contractAddress = "0x304289aC0A87846C9F4B949dffBf493b7686E54e";
export const web3 = new Web3(new Web3.providers.HttpProvider(network));
export const contract = new web3.eth.Contract(abi, contractAddress);
