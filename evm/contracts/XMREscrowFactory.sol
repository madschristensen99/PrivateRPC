// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {XMREscrowSrc} from "./XMREscrowSrc.sol";
import {XMRSwapAdapter} from "./XMRSwapIntegration.sol";

contract XMREscrowFactory {
    address public immutable srcImplementation;
    constructor(uint32 rescueDelay, IERC20 accessToken, address adapter) {
        srcImplementation = address(new XMREscrowSrc(rescueDelay, accessToken, adapter));
    }

    function createSrcEscrow(bytes32 salt) external returns (address) {
        return Create2.deploy(0, salt, _proxyBytecode());
    }

    function addressOfSrcEscrow(bytes32 salt) external view returns (address) {
        return Create2.computeAddress(salt, keccak256(_proxyBytecode()));
    }

    function _proxyBytecode() internal view returns (bytes memory) {
        return abi.encodePacked(
            hex"3d602d80600a3d3981f3363d3d373d3d3d363d73",
            srcImplementation,
            hex"5af43d82803e903d91602b57fd5bf3"
        );
    }
}
