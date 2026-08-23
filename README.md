# Right-to-Sell Proof ![Node.js](https://img.shields.io/badge/Node.js-v23.7.0-5FA04E?logo=node.js&logoColor=white) [![Integration Test](https://github.com/invers-technology/right-to-sell-proof/actions/workflows/integration.yml/badge.svg)](https://github.com/invers-technology/right-to-sell-proof/actions/workflows/integration.yml)

Implementation of [Right-to-Sell Verification for Industrial Supply Chains via DKIM and Zero-Knowledge Proof on a Public Blockchain]()

## Demo App

https://invers-technology.github.io/right-to-sell-proof/

![Diagram](https://github.com/user-attachments/assets/55c28c2c-0ce0-41d8-9d68-fc5d5595b742)

## Sepolia Contract

https://sepolia.etherscan.io/address/0x304289ac0a87846c9f4b949dffbf493b7686e54e

## Setup

```
$ yarn
$ yarn --cwd core build
$ mkdir -p node_modules/rts-core/dist
$ cp -R core/dist/. node_modules/rts-core/dist
```

## Directory Structure

- `circuits`: Right-to-sell proof circuits written in Circom.
- `contracts`: Right-to-sell proof smart contracts written in Solidity.
- `core`: Constants, type definitions, and contract artifacts.
- `scripts`: Setup commands for the right-to-sell proof circuits.
- `src`: Right-to-sell proof libraries for brands and resellers.
- `tests`: Unit tests for the libraries and smart contracts, plus integration tests.
- `ui`: Demo app for the right-to-sell proof.

## Testing

```bash
npm run test
```
