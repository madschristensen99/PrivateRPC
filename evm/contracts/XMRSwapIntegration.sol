// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { AddressLib, Address } from "./libraries/AddressLib.sol";
import { Timelocks, TimelocksLib } from "./libraries/TimelocksLib.sol";

import { IBaseEscrow } from "./interfaces/IBaseEscrow.sol";
import { BaseEscrow } from "./BaseEscrow.sol";
import { Escrow } from "./Escrow.sol";

/**
 * @title XMR Swap Integration
 * @notice Integration layer between HashiELD escrow system and xmr-eth-atomic-swap
 * @dev Provides adapter functions to connect the two systems
 */
interface ISwapCreator {
    enum Stage {
        INVALID,
        PENDING,
        READY,
        COMPLETED
    }

    struct Swap {
        address payable owner;
        address payable claimer;
        bytes32 claimCommitment;
        bytes32 refundCommitment;
        uint256 timeout1;
        uint256 timeout2;
        address asset;
        uint256 value;
        uint256 nonce;
    }

    function swaps(bytes32 swapID) external view returns (Stage);
    function newSwap(
        bytes32 _claimCommitment,
        bytes32 _refundCommitment,
        address payable _claimer,
        uint256 _timeoutDuration1,
        uint256 _timeoutDuration2,
        address _asset,
        uint256 _value,
        uint256 _nonce
    ) external payable returns (bytes32);
    function setReady(Swap memory _swap) external;
    function claim(Swap memory _swap, bytes32 _secret) external;
    function refund(Swap memory _swap, bytes32 _secret) external;
}

/**
 * @title XMR Swap Adapter
 * @notice Adapter contract to connect HashiELD escrow system with xmr-eth-atomic-swap
 * @dev Provides mapping between HashiELD escrow parameters and SwapCreator parameters
 */
contract XMRSwapAdapter {
    using SafeERC20 for IERC20;
    using AddressLib for Address;
    using TimelocksLib for Timelocks;

    // Address of the SwapCreator contract from xmr-eth-atomic-swap
    ISwapCreator public immutable swapCreator;

    // Mapping from hashlock to swapID
    mapping(bytes32 => bytes32) public hashlockToSwapID;
    
    // Mapping from swapID to hashlock
    mapping(bytes32 => bytes32) public swapIDToHashlock;

    event SwapCreated(bytes32 hashlock, bytes32 swapID);
    event SwapReady(bytes32 hashlock, bytes32 swapID);
    event SwapClaimed(bytes32 hashlock, bytes32 swapID, bytes32 secret);
    event SwapRefunded(bytes32 hashlock, bytes32 swapID, bytes32 secret);

    constructor(address _swapCreator) {
        swapCreator = ISwapCreator(_swapCreator);
    }

    /**
     * @notice Creates a new swap using the SwapCreator contract
     * @param hashlock The hashlock used in the HashiELD escrow system
     * @param claimCommitment The claim commitment for the SwapCreator
     * @param refundCommitment The refund commitment for the SwapCreator
     * @param claimer The address that can claim the swap
     * @param timeoutDuration1 The first timeout duration
     * @param timeoutDuration2 The second timeout duration
     * @param asset The token address (address(0) for native currency)
     * @param value The amount to swap
     * @param nonce A random nonce
     * @return swapID The ID of the created swap
     */
    function createSwap(
        bytes32 hashlock,
        bytes32 claimCommitment,
        bytes32 refundCommitment,
        address payable claimer,
        uint256 timeoutDuration1,
        uint256 timeoutDuration2,
        address asset,
        uint256 value,
        uint256 nonce
    ) external payable returns (bytes32) {
        // For ERC20 tokens, first transfer tokens from the sender to this contract
        if (asset != address(0)) {
            // Transfer tokens from sender to this adapter contract
            IERC20(asset).safeTransferFrom(msg.sender, address(this), value);
            
            // Approve the SwapCreator to spend these tokens
            IERC20(asset).approve(address(swapCreator), value);
        }
        
        // Create the swap in the SwapCreator contract
        bytes32 swapID = swapCreator.newSwap{value: msg.value}(
            claimCommitment,
            refundCommitment,
            claimer,
            timeoutDuration1,
            timeoutDuration2,
            asset,
            value,
            nonce
        );
        
        hashlockToSwapID[hashlock] = swapID;
        swapIDToHashlock[swapID] = hashlock;
        
        emit SwapCreated(hashlock, swapID);
        return swapID;
    }

    /**
     * @notice Sets a swap as ready
     * @param hashlock The hashlock used in the HashiELD escrow system
     * @param swap The swap struct for the SwapCreator
     */
    function setSwapReady(bytes32 hashlock, ISwapCreator.Swap memory swap) external {
        bytes32 swapID = hashlockToSwapID[hashlock];
        require(swapID != bytes32(0), "Swap not found");
        
        swapCreator.setReady(swap);
        emit SwapReady(hashlock, swapID);
    }

    /**
     * @notice Claims a swap
     * @param hashlock The hashlock used in the HashiELD escrow system
     * @param swap The swap struct for the SwapCreator
     * @param secret The secret to claim the swap
     */
    function claimSwap(bytes32 hashlock, ISwapCreator.Swap memory swap, bytes32 secret) external {
        bytes32 swapID = hashlockToSwapID[hashlock];
        require(swapID != bytes32(0), "Swap not found");
        
        swapCreator.claim(swap, secret);
        emit SwapClaimed(hashlock, swapID, secret);
    }

    /**
     * @notice Refunds a swap
     * @param hashlock The hashlock used in the HashiELD escrow system
     * @param swap The swap struct for the SwapCreator
     * @param secret The secret to refund the swap
     */
    function refundSwap(bytes32 hashlock, ISwapCreator.Swap memory swap, bytes32 secret) external {
        bytes32 swapID = hashlockToSwapID[hashlock];
        require(swapID != bytes32(0), "Swap not found");
        
        swapCreator.refund(swap, secret);
        emit SwapRefunded(hashlock, swapID, secret);
    }

    /**
     * @notice Gets the status of a swap
     * @param hashlock The hashlock used in the HashiELD escrow system
     * @return The status of the swap
     */
    function getSwapStatus(bytes32 hashlock) external view returns (ISwapCreator.Stage) {
        bytes32 swapID = hashlockToSwapID[hashlock];
        require(swapID != bytes32(0), "Swap not found");
        
        return swapCreator.swaps(swapID);
    }
}
