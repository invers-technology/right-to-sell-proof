// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Rts {
    struct VerificationKey {
        uint256[] vk_alpha_1;
        uint256[][] vk_beta_2;
        uint256[][] vk_gamma_2;
        uint256[][] vk_delta_2;
        uint256[][][] vk_alphabeta_12;
        uint256[][] IC;
    }
    struct Root {
        bytes32 root;
        uint256 version;
        uint256 timestamp;
    }
    Root[] public roots;
    uint256 public duration;
    uint256[17][] public publicKeys;
    VerificationKey private verificationKey;

    constructor(
        bytes32 initialRoot,
        uint256 initialDuration,
        uint256[17][] memory initialPublicKeys,
        VerificationKey memory initialVerificationKey
    ) {
        roots.push(Root(initialRoot, 1, block.timestamp));
        duration = initialDuration;
        publicKeys = initialPublicKeys;
        verificationKey = initialVerificationKey;
    }

    function updateRoot(bytes32 newRoot) public {
        uint256 newVersion = roots.length + 1;
        roots.push(Root(newRoot, newVersion, block.timestamp));
    }

    function updateDuration(uint256 newDuration) public {
        duration = newDuration;
    }

    function addPublicKey(uint256[17] memory publicKey) public {
        publicKeys.push(publicKey);
    }

    function abolishPublicKey(uint256 keyIndex) public {
        publicKeys[keyIndex] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    }

    function getValidRoots() public view returns (Root[] memory) {
        uint256 validSince = block.timestamp > duration ? block.timestamp - duration : 0;
        uint256 count = 0;
        for (uint256 i = 0; i < roots.length; i++) {
            if (roots[i].timestamp >= validSince) {
                count++;
            }
        }
        Root[] memory validRoots = new Root[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < roots.length; i++) {
            if (roots[i].timestamp >= validSince) {
                validRoots[index] = roots[i];
                index++;
            }
        }
        return validRoots;
    }

    function getPublicKey(uint256 keyIndex) public view returns (uint256[17] memory) {
        return publicKeys[keyIndex];
    }

    function getVerificationKey() public view returns (
        uint256[] memory vk_alpha_1,
        uint256[][] memory vk_beta_2,
        uint256[][] memory vk_gamma_2,
        uint256[][] memory vk_delta_2,
        uint256[][][] memory vk_alphabeta_12,
        uint256[][] memory IC
        ) {
        return (
            verificationKey.vk_alpha_1,
            verificationKey.vk_beta_2,
            verificationKey.vk_gamma_2,
            verificationKey.vk_delta_2,
            verificationKey.vk_alphabeta_12,
            verificationKey.IC
        );
    }
}
