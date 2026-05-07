pragma circom 2.1.6;

include "range.circom";

template To(L) {
    signal input toAddressIndex;
    signal input toAddressLength;
    signal input emailHeader[L];
    signal output out[9];

    component emailRangeCheck[L];
    component emailCounterCheck[L];
    signal emailAscii[L];
    signal emailCounter[L+1];

    emailCounter[0] <== 0;

    component fieldIndicator1[L];
    component fieldIndicator2[L];
    component fieldIndicator3[L];
    component fieldIndicator4[L];
    component fieldIndicator5[L];
    component fieldIndicator6[L];
    component fieldIndicator7[L];
    component fieldIndicator8[L];
    component fieldIndicator9[L];

    signal traceIntermediateField1[L];
    signal traceIntermediateField2[L];
    signal traceIntermediateField3[L];
    signal traceIntermediateField4[L];
    signal traceIntermediateField5[L];
    signal traceIntermediateField6[L];
    signal traceIntermediateField7[L];
    signal traceIntermediateField8[L];
    signal traceIntermediateField9[L];

    signal traceField1[L+1];
    signal traceField2[L+1];
    signal traceField3[L+1];
    signal traceField4[L+1];
    signal traceField5[L+1];
    signal traceField6[L+1];
    signal traceField7[L+1];
    signal traceField8[L+1];
    signal traceField9[L+1];

    traceField1[0] <== 0;
    traceField2[0] <== 0;
    traceField3[0] <== 0;
    traceField4[0] <== 0;
    traceField5[0] <== 0;
    traceField6[0] <== 0;
    traceField7[0] <== 0;
    traceField8[0] <== 0;
    traceField9[0] <== 0;

    for (var i = 0; i < L; i++) {
        // check whether the character is in the address range
        emailCounterCheck[i] = LessEqThan(10);
        emailCounterCheck[i].in[0] <== toAddressIndex;
        emailCounterCheck[i].in[1] <== i;
        emailCounter[i+1] <== emailCounter[i] + emailCounterCheck[i].out;

        // check whether the counter is in the trace field
        fieldIndicator1[i] = FixedRangeCheckForTraceField(0, 36);
        fieldIndicator2[i] = FixedRangeCheckForTraceField(36, 72);
        fieldIndicator3[i] = FixedRangeCheckForTraceField(72, 108);
        fieldIndicator4[i] = FixedRangeCheckForTraceField(108, 144);
        fieldIndicator5[i] = FixedRangeCheckForTraceField(144, 180);
        fieldIndicator6[i] = FixedRangeCheckForTraceField(180, 216);
        fieldIndicator7[i] = FixedRangeCheckForTraceField(216, 252);
        fieldIndicator8[i] = FixedRangeCheckForTraceField(252, 288);
        fieldIndicator9[i] = FixedRangeCheckForTraceField(288, 324);

        fieldIndicator1[i].x <== emailCounter[i+1];
        fieldIndicator2[i].x <== emailCounter[i+1];
        fieldIndicator3[i].x <== emailCounter[i+1];
        fieldIndicator4[i].x <== emailCounter[i+1];
        fieldIndicator5[i].x <== emailCounter[i+1];
        fieldIndicator6[i].x <== emailCounter[i+1];
        fieldIndicator7[i].x <== emailCounter[i+1];
        fieldIndicator8[i].x <== emailCounter[i+1];
        fieldIndicator9[i].x <== emailCounter[i+1];

        emailRangeCheck[i] = EmailRangeCheck();
        emailRangeCheck[i].a <== toAddressIndex;
        emailRangeCheck[i].b <== toAddressIndex + toAddressLength;
        emailRangeCheck[i].i <== i;
        emailAscii[i] <== emailHeader[i] * emailRangeCheck[i].out;

        traceIntermediateField1[i] <== fieldIndicator1[i].out * traceField1[i] * 128 + emailAscii[i];
        traceIntermediateField2[i] <== fieldIndicator1[i].out * traceField2[i] * 128 + emailAscii[i];
        traceIntermediateField3[i] <== fieldIndicator1[i].out * traceField3[i] * 128 + emailAscii[i];
        traceIntermediateField4[i] <== fieldIndicator1[i].out * traceField4[i] * 128 + emailAscii[i];
        traceIntermediateField5[i] <== fieldIndicator1[i].out * traceField5[i] * 128 + emailAscii[i];
        traceIntermediateField6[i] <== fieldIndicator1[i].out * traceField6[i] * 128 + emailAscii[i];
        traceIntermediateField7[i] <== fieldIndicator1[i].out * traceField7[i] * 128 + emailAscii[i];
        traceIntermediateField8[i] <== fieldIndicator1[i].out * traceField8[i] * 128 + emailAscii[i];
        traceIntermediateField9[i] <== fieldIndicator1[i].out * traceField9[i] * 128 + emailAscii[i];

        traceField1[i+1] <== traceIntermediateField1[i] + traceField1[i] * (1 - fieldIndicator1[i].out);
        traceField2[i+1] <== traceIntermediateField2[i] + traceField2[i] * (1 - fieldIndicator2[i].out);
        traceField3[i+1] <== traceIntermediateField3[i] + traceField3[i] * (1 - fieldIndicator3[i].out);
        traceField4[i+1] <== traceIntermediateField4[i] + traceField4[i] * (1 - fieldIndicator4[i].out);
        traceField5[i+1] <== traceIntermediateField5[i] + traceField5[i] * (1 - fieldIndicator5[i].out);
        traceField6[i+1] <== traceIntermediateField6[i] + traceField6[i] * (1 - fieldIndicator6[i].out);
        traceField7[i+1] <== traceIntermediateField7[i] + traceField7[i] * (1 - fieldIndicator7[i].out);
        traceField8[i+1] <== traceIntermediateField8[i] + traceField8[i] * (1 - fieldIndicator8[i].out);
        traceField9[i+1] <== traceIntermediateField9[i] + traceField9[i] * (1 - fieldIndicator9[i].out);
    }

    out[0] <== traceField1[L];
    out[1] <== traceField2[L];
    out[2] <== traceField3[L];
    out[3] <== traceField4[L];
    out[4] <== traceField5[L];
    out[5] <== traceField6[L];
    out[6] <== traceField7[L];
    out[7] <== traceField8[L];
    out[8] <== traceField9[L];
}
