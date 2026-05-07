pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";

template HexAsciiNumberRangeCheck() {
    signal input x;
    signal output out;
    component rangeCheck = FixedRangeCheckForAscii(48, 57);
    rangeCheck.x <== x;
    out <== rangeCheck.out;
}

template AsciiRangeCheck() {
    signal input x;
    signal output out;
    component rangeCheck = FixedRangeCheckForAscii(48, 57);
    component rangeCheck2 = FixedRangeCheckForAscii(97, 102);
    rangeCheck.x <== x;
    rangeCheck2.x <== x;
    out <== rangeCheck.out + rangeCheck2.out;
}

template FixedRangeCheckForAscii(min, max) {
    signal input x;
    signal output out;
    component geq = GreaterEqThan(8);
    component leq = LessEqThan(8);

    geq.in[0] <== x;
    geq.in[1] <== min;

    leq.in[0] <== x;
    leq.in[1] <== max;

    out <== geq.out * leq.out;
}

template FixedRangeCheckForTraceField(min, max) {
    signal input x;
    signal output out;
    component geq = GreaterEqThan(10);
    component leq = LessEqThan(10);

    geq.in[0] <== x;
    geq.in[1] <== min;

    leq.in[0] <== x;
    leq.in[1] <== max;

    out <== geq.out * leq.out;
}

template SubjectRangeCheck() {
    signal input a;
    signal input i;
    signal output out;

    component gt1 = GreaterEqThan(10); // a < i
    component gt2 = GreaterThan(10); // i < a + 64

    gt1.in[0] <== i;
    gt1.in[1] <== a;

    gt2.in[0] <== a + 64;
    gt2.in[1] <== i;

    out <== gt1.out * gt2.out;
}

template EmailRangeCheck() {
    signal input a;
    signal input b;
    signal input i;
    signal output out;

    component gt1 = GreaterEqThan(10); // a < i
    component gt2 = GreaterThan(10); // i < b

    gt1.in[0] <== i;
    gt1.in[1] <== a;

    gt2.in[0] <== b;
    gt2.in[1] <== i;

    out <== gt1.out * gt2.out;
}
