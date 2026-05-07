pragma circom 2.1.6;

include "to.circom";
include "subject.circom";
include "tree.circom";
include "zk-email-light/circuit/dkim.circom";

template Rts(nDepth) {
    // RSA field operations constants
    // Sub field bits
    var N = 121;
    // Number of sub fields
    var K = 17;

    // DKIM header length
    var D = 640;
    // LID max length
    var L = 1024;
    // LID 29 fields
    var LF = 29;
    // LID 36 * 7 bits characters
    var LW = 36;

    // Dkim Signature Verification
    signal input emailHeader[D];
    signal input emailHeaderLength;
    signal input pubkey[K];
    signal input signature[K];

    // Ownership and Authentication from Header
    signal input subjectIndex;
    signal input toAddressIndex;
    signal input toAddressLength;

    // Membership Proof
    signal input lid[L];
    signal input lidFields[LF];
    signal input path[nDepth];
    signal input witness[nDepth];
    signal output root;

    component lidAsciiCheck[L];
    for (var i = 0; i < L; i++) {
        lidAsciiCheck[i] = FixedRangeCheckForAscii(0, 127);
        lidAsciiCheck[i].x <== lid[i];
        lidAsciiCheck[i].out === 1;
    }

    // Verify DKIM Signature
    component dkim = Dkim();
    dkim.emailHeader <== emailHeader;
    dkim.emailHeaderLength <== emailHeaderLength;
    dkim.pubkey <== pubkey;
    dkim.signature <== signature;

    // Extract Subject from Email Header
    component subject = Subject(D);
    subject.subjectIndex <== subjectIndex;
    subject.emailHeader <== emailHeader;

    // Extract Address from Email Header
    component to = To(D);
    to.toAddressIndex <== toAddressIndex;
    to.toAddressLength <== toAddressLength;
    to.emailHeader <== emailHeader;

    signal identifier;
    signal emailFields[9];
    identifier <== subject.out;
    emailFields <== to.out;

    // Reconstruct the public packed LID fields from the private LID bytes. The
    // last field is padded with zeroes because LF * LW is greater than L.
    signal lidFieldAccumulators[LF][LW + 1];
    for (var i = 0; i < LF; i++) {
        lidFieldAccumulators[i][0] <== 0;
        for (var j = 0; j < LW; j++) {
            if (i * LW + j < L) {
                lidFieldAccumulators[i][j + 1] <== lidFieldAccumulators[i][j] * 128 + lid[i * LW + j];
            } else {
                lidFieldAccumulators[i][j + 1] <== lidFieldAccumulators[i][j] * 128;
            }
        }
        lidFields[i] === lidFieldAccumulators[i][LW];
    }

    // Verify membership against the Merkle tree.
    component tree = Tree(nDepth);
    tree.identifier <== identifier;
    tree.emailFields <== emailFields;
    tree.lidFields <== lidFields;
    tree.path <== path;
    tree.witness <== witness;

    root <== tree.root;
}
