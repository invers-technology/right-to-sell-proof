pragma circom 2.1.6;

include "../../circuits/lib/rts.circom";

component main { public [lidFields, pubkey] } = Rts(7);
