// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { AddressLib, Address } from "./libraries/AddressLib.sol";
import { Timelocks, TimelocksLib } from "./libraries/TimelocksLib.sol";

import { IBaseEscrow } from "./interfaces/IBaseEscrow.sol";
import { BaseEscrow } from "./BaseEscrow.sol";
import { Escrow } from "./Escrow.sol";
import { XMRSwapAdapter, ISwapCreator } from "./XMRSwapIntegration.sol";

/**
 * @title XMR Source Escrow for EVM→Monero atomic swaps
 * @notice Escrow contract for EVM→XMR swaps - holds ERC20/ETH, releases when taker provides secret
 * @dev Used when EVM tokens are the source and Monero is the destination
 * @custom:security-contact security@atomicswap.io
 */
contract XMREscrowSrc is Escrow {
    using SafeERC20 for IERC20;
    using AddressLib for Address;
    using TimelocksLib for Timelocks;
    
    /// @notice XMR Swap Adapter for integration with xmr-eth-atomic-swap
    XMRSwapAdapter public immutable swapAdapter;
    
    /// @notice Deposit event emitted when funds are deposited
    event Deposit(address indexed sender, address indexed token, uint256 amount, bytes32 indexed hashlock);

    constructor(uint32 rescueDelay, IERC20 accessToken, address _swapAdapter) BaseEscrow(rescueDelay, accessToken) {
        swapAdapter = XMRSwapAdapter(_swapAdapter);
    }

    // Allow contract to receive ETH
    receive() external payable {}

    /**
     * @notice Private withdrawal by taker using secret
     * @dev Taker reveals secret to claim EVM tokens after providing Monero to maker
     * @param secret The secret that matches the hashlock
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

        _withdraw(secret, immutables);
    }

    /**
     * @notice Public withdrawal by anyone with access token
     * @dev Anyone with access token can trigger withdrawal in public period
     * @param secret The secret that matches the hashlock
     * @param immutables The escrow immutables
     */
    function publicWithdraw(bytes32 secret, Immutables calldata immutables)
        external
        onlyAccessTokenHolder()
        onlyValidImmutables(immutables)
        onlyValidSecret(secret, immutables)
        onlyAfter(immutables.timelocks.get(TimelocksLib.Stage.DstPublicWithdrawal))
        onlyBefore(immutables.timelocks.get(TimelocksLib.Stage.DstCancellation))
    {
        _withdraw(secret, immutables);
    }

    /**
     * @notice Cancels escrow and returns funds to maker
     * @dev Can only be called after cancellation period starts
     * @param immutables The escrow immutables
     */
    function cancel(Immutables calldata immutables)
        external
        override
        onlyMaker(immutables)
        onlyValidImmutables(immutables)
        onlyAfter(immutables.timelocks.get(TimelocksLib.Stage.DstCancellation))
    {
        // Return tokens to maker
        _uniTransfer(immutables.token.get(), immutables.maker.get(), immutables.amount);
        // Return safety deposit to maker
        _ethTransfer(immutables.maker.get(), immutables.safetyDeposit);
        
        emit EscrowCancelled();
    }

    /**
     * @notice Deposit function that wraps createSwap to meet 1-inch interface
     * @dev Handles token transfers and creates swap in one transaction
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
        // Only maker can deposit
        if (msg.sender != immutables.maker.get()) {
            revert InvalidCaller();
        }
        
        // Handle token transfers for ERC20 tokens
        if (immutables.token.get() != address(0)) {
            // Transfer tokens from maker to this contract
            IERC20(immutables.token.get()).safeTransferFrom(
                msg.sender, 
                address(this), 
                immutables.amount
            );
            
            // Approve the adapter to spend tokens
            IERC20(immutables.token.get()).approve(address(swapAdapter), immutables.amount);
        }
        
        // Create the swap in the SwapCreator contract
        swapAdapter.createSwap{
            value: immutables.token.get() == address(0) ? immutables.amount : 0
        }(
            hashlock,
            claimCommitment,
            refundCommitment,
            payable(immutables.taker.get()),
            immutables.timelocks.get(TimelocksLib.Stage.DstWithdrawal),
            immutables.timelocks.get(TimelocksLib.Stage.DstCancellation),
            immutables.token.get(),
            immutables.amount,
            uint256(hashlock)
        );
        
        emit Deposit(msg.sender, immutables.token.get(), immutables.amount, hashlock);
    }

    
    /**
     * @dev Internal withdrawal logic
     * @param secret The secret that unlocks the escrow
     * @param immutables The escrow immutables
     */
    function _withdraw(bytes32 secret, Immutables calldata immutables) internal {
        bytes32 hashlock = immutables.hashlock;
        
        // Create swap parameters to pass to adapter
        ISwapCreator.Swap memory swap = ISwapCreator.Swap({
            owner: payable(immutables.maker.get()),
            claimer: payable(immutables.taker.get()),
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
        
        // Transfer tokens to taker
        _uniTransfer(immutables.token.get(), immutables.taker.get(), immutables.amount);
        
        // Return safety deposit to maker
        _ethTransfer(immutables.maker.get(), immutables.safetyDeposit);
        
        emit EscrowWithdrawal(secret);
    }
}
