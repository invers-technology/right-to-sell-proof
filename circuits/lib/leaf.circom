pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";

template Leaf() {
    // 1 identifier + 9 email fields + 29 lid fields = 39 hash inputs.
    signal input identifier;
    signal input emailFields[9];
    signal input lidFields[29];
    signal output out;

    // Flatten inputs into a single 39 elements array in the same order
    var TOTAL = 39;
    signal flat[TOTAL];
    flat[0] <== identifier;
    for (var i = 0; i < 9; i++) {
        flat[1 + i] <== emailFields[i];
    }
    for (var i = 0; i < 29; i++) {
        flat[10 + i] <== lidFields[i];
    }

    // Chunk A: indices [0, 16)
    component chunkA = Poseidon(16);
    for (var i = 0; i < 16; i++) {
        chunkA.inputs[i] <== flat[i];
    }

    // Chunk B: indices [16, 32)
    component chunkB = Poseidon(16);
    for (var i = 0; i < 16; i++) {
        chunkB.inputs[i] <== flat[16 + i];
    }

    // Chunk C: indices [32, 39)
    component chunkC = Poseidon(7);
    for (var i = 0; i < 7; i++) {
        chunkC.inputs[i] <== flat[32 + i];
    }

    // Final fold over the three chunk digests.
    component finalHasher = Poseidon(3);
    finalHasher.inputs[0] <== chunkA.out;
    finalHasher.inputs[1] <== chunkB.out;
    finalHasher.inputs[2] <== chunkC.out;

    out <== finalHasher.out;
}
