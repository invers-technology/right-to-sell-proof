#! /bin/bash

# Remove cache and recreate params directories
rm -rf setup_params *_js *.r1cs && mkdir setup_params

# Powers of Tau
yarn snarkjs powersoftau new bn128 21 setup_params/pot21_0000.ptau -v
yarn snarkjs powersoftau contribute setup_params/pot21_0000.ptau setup_params/pot21_0001.ptau -v -e='test'
yarn snarkjs powersoftau prepare phase2 setup_params/pot21_0001.ptau setup_params/pot21_final.ptau -v

max=20
for (( i=10; i <= $max; ++i ))
do
    # Compile the Circuit
    circom circuits/rts$i.circom --r1cs --wasm -l node_modules

    # Trusted Setup
    yarn snarkjs groth16 setup rts$i.r1cs setup_params/pot21_final.ptau setup_params/rts$i_0000.zkey
    yarn snarkjs zkey contribute setup_params/rts$i_0000.zkey setup_params/rts$i_0001.zkey -v -e='test'
    yarn snarkjs zkey export verificationkey setup_params/rts$i_0001.zkey setup_params/verification$i.json
done
