// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { AddressLib, Address } from "./libraries/AddressLib.sol";
import { Timelocks, TimelocksLib } from "./libraries/TimelocksLib.sol";

import { IBaseEscrow } from "./interfaces/IBaseEscrow.sol";
import { BaseEscrow } from "./BaseEscrow.sol";
import { EscrowDst } from "./EscrowDst.sol";
import { XMRSwapAdapter, ISwapCreator } from "./XMRSwapIntegration.sol";

/**
 * @title XMR Destination Escrow for Monero→EVM atomic swaps
 * @notice Escrow contract for XMR→EVM swaps - holds ERC20/ETH, releases when maker provides secret
 * @dev Used when Monero is the source and EVM tokens are the destination
 * @custom:security-contact security@atomicswap.io
 */
contract XMREscrowDst is EscrowDst {
    using SafeERC20 for IERC20;
    using AddressLib for Address;
    using TimelocksLib for Timelocks;
    
    /// @notice XMR Swap Adapter for integration with xmr-eth-atomic-swap
    XMRSwapAdapter public immutable swapAdapter;
    
    /// @notice Deposit event emitted when funds are deposited
    event Deposit(address indexed sender, address indexed token, uint256 amount, bytes32 indexed hashlock);

    constructor(uint32 rescueDelay, IERC20 accessToken, address _swapAdapter) EscrowDst(rescueDelay, accessToken) {
        swapAdapter = XMRSwapAdapter(_swapAdapter);
    }

    // Allow contract to receive ETH
    receive() external payable override {}

    /**
     * @notice Deposit function that wraps createSwap to meet 1-inch interface
     * @param hashlock The hashlock for the escrow
     * @param claimCommitment The claim commitment for SwapCreator
     * @param refundCommitment The refund commitment for SwapCreator
     * @param immutables The escrow immutables
     */
    function deposit(
        bytes32 hashlock,
        bytes32 claimCommitment,
        bytes32 refundCommitment,
        Immutables calldata immutables
    )
        external
        payable
        onlyValidImmutables(immutables)
    {
        // Only taker can deposit
        if (msg.sender != immutables.taker.get()) {
            revert InvalidCaller();
        }
        
        // Handle token transfers for ERC20 tokens
        if (immutables.token.get() != address(0)) {
            IERC20(immutables.token.get()).safeTransferFrom(msg.sender, address(this), immutables.amount);
            IERC20(immutables.token.get()).approve(address(swapAdapter), immutables.amount);
        }
        
        // Create the swap in the SwapCreator contract via adapter
        swapAdapter.createSwap{
            value: immutables.token.get() == address(0) ? immutables.amount : 0
        }(
            hashlock,
            claimCommitment,
            refundCommitment,
            payable(immutables.maker.get()),
            immutables.timelocks.get(TimelocksLib.Stage.DstWithdrawal),
            immutables.timelocks.get(TimelocksLib.Stage.DstCancellation),
            immutables.token.get(),
            immutables.amount,
            uint256(hashlock)
        );
        
        emit Deposit(msg.sender, immutables.token.get(), immutables.amount, hashlock);
    }
    
    /**
     * @notice Creates a swap in the SwapCreator contract (legacy method, use deposit instead)
     * @param hashlock The hashlock for the escrow
     * @param claimCommitment The claim commitment for SwapCreator
     * @param refundCommitment The refund commitment for SwapCreator
     * @param immutables The escrow immutables
     */
    function createSwap(
        bytes32 hashlock,
        bytes32 claimCommitment,
        bytes32 refundCommitment,
        Immutables calldata immutables
    )
        external
        payable
        onlyValidImmutables(immutables)
    {
        // Only taker can create a swap
        if (msg.sender != immutables.taker.get()) {
            revert InvalidCaller();
        }
        
        // Handle token approvals for ERC20 tokens
        if (immutables.token.get() != address(0)) {
            // Approve the adapter to spend tokens
            IERC20(immutables.token.get()).approve(address(swapAdapter), immutables.amount);
        }
        
        // Create the swap in the SwapCreator contract via adapter
        swapAdapter.createSwap{
            value: immutables.token.get() == address(0) ? immutables.amount : 0
        }(
            hashlock,
            claimCommitment,
            refundCommitment,
            payable(immutables.maker.get()),
            immutables.timelocks.get(TimelocksLib.Stage.DstWithdrawal),
            immutables.timelocks.get(TimelocksLib.Stage.DstCancellation),
            immutables.token.get(),
            immutables.amount,
            uint256(hashlock)
        );
    }
    
    /**
     * @notice Sets a swap as ready in the SwapCreator contract
     * @param hashlock The hashlock for the escrow
     * @param immutables The escrow immutables
     */
    function setSwapReady(
        bytes32 hashlock,
        Immutables calldata immutables
    )
        external
        onlyValidImmutables(immutables)
    {
        // Only taker can set a swap as ready
        if (msg.sender != immutables.taker.get()) {
            revert InvalidCaller();
        }
        
        // Create swap parameters to pass to adapter
        ISwapCreator.Swap memory swap = ISwapCreator.Swap({
            owner: payable(immutables.taker.get()),
            claimer: payable(immutables.maker.get()),
            claimCommitment: bytes32(0), // Will be read from SwapCreator by adapter
            refundCommitment: bytes32(0), // Will be read from SwapCreator by adapter
            timeout1: immutables.timelocks.get(TimelocksLib.Stage.DstWithdrawal),
            timeout2: immutables.timelocks.get(TimelocksLib.Stage.DstCancellation),
            asset: immutables.token.get(),
            value: immutables.amount,
            nonce: uint256(hashlock)
        });
        
        // Set the swap as ready
        swapAdapter.setSwapReady(hashlock, swap);
    }
    
    /**
     * @notice Override the withdraw function to integrate with SwapCreator
     * @param secret The secret that unlocks the escrow
     * @param immutables The escrow immutables
     */
    function withdraw(bytes32 secret, Immutables calldata immutables)
        external
        override
        onlyValidImmutables(immutables)
        onlyValidSecret(secret, immutables)
        onlyAfter(immutables.timelocks.get(TimelocksLib.Stage.DstWithdrawal))
        onlyBefore(immutables.timelocks.get(TimelocksLib.Stage.DstCancellation))
    {
        // Allow both maker and taker to withdraw in private period
        if (msg.sender != immutables.maker.get() && msg.sender != immutables.taker.get()) {
            revert InvalidCaller();
        }

        // Create swap parameters to pass to adapter
        bytes32 hashlock = keccak256(abi.encodePacked(secret));
        ISwapCreator.Swap memory swap = ISwapCreator.Swap({
            owner: payable(immutables.taker.get()),
            claimer: payable(immutables.maker.get()),
            claimCommitment: bytes32(0), // Will be read from SwapCreator by adapter
            refundCommitment: bytes32(0), // Will be read from SwapCreator by adapter
            timeout1: immutables.timelocks.get(TimelocksLib.Stage.DstWithdrawal),
            timeout2: immutables.timelocks.get(TimelocksLib.Stage.DstCancellation),
            asset: immutables.token.get(),
            value: immutables.amount,
            nonce: uint256(hashlock)
        });
        
        // Claim the swap in the SwapCreator contract
        swapAdapter.claimSwap(hashlock, swap, secret);
        
        // Transfer tokens to maker
        _uniTransfer(immutables.token.get(), immutables.maker.get(), immutables.amount);
        
        // Return safety deposit to taker
        _ethTransfer(immutables.taker.get(), immutables.safetyDeposit);
        
        emit EscrowWithdrawal(secret);
    }
}
