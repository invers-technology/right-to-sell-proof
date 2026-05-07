#! /bin/bash
set -euo pipefail

node_pid=""
cleanup() {
    if [ -n "$node_pid" ]; then
        kill "$node_pid" 2>/dev/null || true
    fi
}
trap cleanup EXIT

cp .env.local .env
npm ci --prefix core
npm run build --prefix core
npm ci
npm run compile
npm exec -- hardhat node &
node_pid=$!

if [ "${1:-}" = "integration" ]; then
    mkdir -p verification_keys wasms setup_params &&
    wget -q "https://trusted-setup-params.s3.us-east-1.amazonaws.com/verification_keys/verification10.json" \
        -O "verification_keys/verification10.json"
    wget -q "https://trusted-setup-params.s3.us-east-1.amazonaws.com/setup_params/rts10.zkey" \
        -O "setup_params/rts10.zkey"

    circom circuits/rts10.circom --r1cs --wasm -l ./node_modules
    cp rts10_js/rts10.wasm wasms/

    npm run test:integration
else
    npm run build
    npm run fmt:check
    npm run lint
    npm test
fi
