pragma circom 2.1.6;

include "range.circom";

template Subject(L) {
    signal input subjectIndex;
    signal input emailHeader[L];
    signal output out;

    signal byteArray[L];
    signal tempAccumulators[L];
    signal tempAccumulators2[L];
    signal accumulators[L+1];
    component asciiRangeCheck[L];
    component subjectRangeCheck[L];
    component isInHexAsciiNumber[L];

    accumulators[0] <== 0;

    for (var i = 0; i < L; i++) {
        // i is in range of subjectIndex and subjectIndex + S
        subjectRangeCheck[i] = SubjectRangeCheck();
        subjectRangeCheck[i].a <== subjectIndex;
        subjectRangeCheck[i].i <== i;

        // emailHeader[i] is in ascii range
        asciiRangeCheck[i] = AsciiRangeCheck();
        asciiRangeCheck[i].x <== emailHeader[i];

        // emailHeader[i] is in ascii range if in subject range
        0 === subjectRangeCheck[i].out * (asciiRangeCheck[i].out - 1);

        isInHexAsciiNumber[i] = HexAsciiNumberRangeCheck();
        isInHexAsciiNumber[i].x <== emailHeader[i];
        byteArray[i] <== emailHeader[i] - 87 + (isInHexAsciiNumber[i].out * 39);

        tempAccumulators[i] <== (accumulators[i] * 16 + byteArray[i]) * subjectRangeCheck[i].out;
        tempAccumulators2[i] <== (accumulators[i] * (1 - subjectRangeCheck[i].out));

        // set accumulators[i] 0 if not in subject range
        accumulators[i + 1] <== tempAccumulators[i] + tempAccumulators2[i];
    }

    out <== accumulators[L];
}
