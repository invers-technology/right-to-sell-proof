pragma circom 2.1.6;

include "./lib/rts.circom";

component main { public [lidFields, pubkey] } = Rts(17);
