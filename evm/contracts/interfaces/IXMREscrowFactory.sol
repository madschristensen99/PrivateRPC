// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import { IBaseEscrow } from "./IBaseEscrow.sol";

/**
 * @title IXMREscrowFactory Interface
 * @notice Interface for XMR Escrow Factory
 */
interface IXMREscrowFactory {
    /**
     * @notice Creates source escrow for EVM→XMR swaps
     * @param immutables Escrow immutables
     */
    function createSrcEscrow(IBaseEscrow.Immutables calldata immutables) external payable;
    
    /**
     * @notice Creates destination escrow for XMR→EVM swaps
     * @param immutables Escrow immutables
     */
    function createDstEscrow(IBaseEscrow.Immutables calldata immutables) external payable;
    
    /**
     * @notice Returns address of source escrow
     * @param immutables Escrow immutables
     * @return Address of source escrow
     */
    function addressOfEscrowSrc(IBaseEscrow.Immutables calldata immutables) external view returns (address);
    
    /**
     * @notice Returns address of destination escrow
     * @param immutables Escrow immutables
     * @return Address of destination escrow
     */
    function addressOfEscrowDst(IBaseEscrow.Immutables calldata immutables) external view returns (address);
    
    /**
     * @notice Emitted when source escrow is created
     * @param escrow Address of created escrow
     * @param hashlock Escrow hashlock
     * @param maker Maker address
     * @param creator Creator address
     */
    event SrcEscrowCreated(
        address indexed escrow,
        bytes32 indexed hashlock,
        address indexed maker,
        address creator
    );
    
    /**
     * @notice Emitted when destination escrow is created
     * @param escrow Address of created escrow
     * @param hashlock Escrow hashlock
     * @param taker Taker address
     * @param creator Creator address
     */
    event DstEscrowCreated(
        address indexed escrow,
        bytes32 indexed hashlock,
        address indexed taker,
        address creator
    );
}
