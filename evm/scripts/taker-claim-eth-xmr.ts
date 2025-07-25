import { ethers } from "hardhat";
import { XMREscrowSrc, IBaseEscrow } from "../typechain-types";
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import dotenv from "dotenv";

dotenv.config();

interface AtomicSwapOrder {
  id: string;
  secret: string;
  hashlock: string;
  maker: {
    address: string;
    token: string;
    amount: string;
  };
  taker: {
    address: string;
    xmrAddress: string;
    xmrAmount: string;
  };
  timelock: {
    withdrawalPeriod: number;
    cancellationPeriod: number;
  };
  safetyDeposit: string;
  createdAt: string;
  filledAt?: string;
  escrow?: {
    address: string;
    createdAt: string;
  };
  monero?: {
    txHash: string;
    amount: string;
    fundedAt: string;
    claimTxHash?: string;
    claimedAt?: string;
  };
  secretRevealed?: boolean;
  ethClaimed?: {
    txHash: string;
    claimedAt: string;
  };
}

async function main() {
  console.log("🎯 TAKER: CLAIMING ETH (USING REVEALED SECRET)");
  console.log("===============================================");
  console.log("💡 TAKER: Using secret revealed by MAKER to claim ETH!");

  // Get order ID from environment variable or command line
  const orderId = process.env.ORDER_ID || process.argv[process.argv.length - 1];
  if (!orderId || orderId.includes('.ts')) {
    console.log("❌ Please provide order ID");
    console.log("Usage: ORDER_ID=order_1234567890 npm run taker:claim-eth-xmr");
    console.log("   or: npm run taker:claim-eth-xmr order_1234567890");
    process.exit(1);
  }

  // Load order
  const ordersDir = path.join(process.cwd(), 'orders');
  const orderPath = path.join(ordersDir, `${orderId}.json`);
  
  if (!fs.existsSync(orderPath)) {
    throw new Error(`❌ Order not found: ${orderPath}`);
  }
  
  const order: AtomicSwapOrder = JSON.parse(fs.readFileSync(orderPath, 'utf8'));
  console.log("📄 Loaded order:", orderId);
  console.log("⏰ Created:", order.createdAt);
  
  if (!order.secretRevealed) {
    throw new Error(`❌ Secret has not been revealed yet (MAKER must claim XMR first to reveal secret)`);
  }
  
  if (!order.taker || !order.monero || !order.escrow) {
    throw new Error("❌ Order missing required components");
  }

  if (!order.monero.claimTxHash) {
    throw new Error("❌ MAKER hasn't claimed XMR yet - secret not revealed!");
  }

  console.log("\n📋 SWAP DETAILS:");
  console.log("=================");
  console.log("🔸 MAKER:", order.maker.address);
  console.log("🔸 TAKER (you):", order.taker.address);
  
  const isEthSwap = order.maker.token === ethers.ZeroAddress;
  if (isEthSwap) {
    console.log("🔸 MAKER provides:", ethers.formatEther(order.maker.amount), "ETH");
  } else {
    console.log("🔸 MAKER provides:", ethers.formatEther(order.maker.amount), "tokens at", order.maker.token);
  }
  
  console.log("🔸 TAKER provides:", BigInt(order.taker.xmrAmount) / BigInt(1e12), "XMR");
  console.log("🔸 Monero address:", order.taker.xmrAddress);
  console.log("🔸 EVM Escrow:", order.escrow.address);
  console.log("🔸 Hashlock:", order.hashlock);
  console.log("🔸 Monero claim TX:", order.monero.claimTxHash);

  // Extract secret from order
  const secret = order.secret;
  console.log("\n🔍 USING SECRET FROM ORDER:");
  console.log("==========================");
  console.log("🔑 Secret:", secret);
  
  // Verify secret matches hashlock
  const calculatedHashlock = ethers.sha256(secret);
  if (calculatedHashlock !== order.hashlock) {
    throw new Error(`❌ Secret verification failed! Calculated hashlock ${calculatedHashlock} doesn't match order hashlock ${order.hashlock}`);
  }
  console.log("✅ Secret verified - matches hashlock!");

  try {
    // Connect to the network
    const [signer] = await ethers.getSigners();
    console.log("\n🔌 Connected with address:", await signer.getAddress());
    
    // Get TAKER's ETH balance before claiming
    const balanceBefore = await ethers.provider.getBalance(await signer.getAddress());
    console.log("💰 TAKER balance before:", ethers.formatEther(balanceBefore));
    
    // Connect to escrow contract
    const escrow = await ethers.getContractAt("XMREscrowSrc", order.escrow.address) as XMREscrowSrc;
    console.log("🔌 Connected to escrow at:", order.escrow.address);
    
    // Prepare immutables for withdrawal
    const immutables: IBaseEscrow.ImmutablesStruct = {
      maker: order.maker.address,
      taker: order.taker.address,
      token: order.maker.token,
      amount: order.maker.amount,
      hashlock: order.hashlock,
      safetyDeposit: order.safetyDeposit,
      timelocks: {
        deployedAt: 0, // Will be set by contract
        srcWithdrawal: 0,
        srcPublicWithdrawal: 1800, // 30 minutes
        srcCancellation: 3600, // 1 hour
        dstWithdrawal: 0,
        dstPublicWithdrawal: 1800, // 30 minutes
        dstCancellation: 3600, // 1 hour
      }
    };
    
    // Claim ETH using revealed secret
    console.log("\n🔨 Claiming ETH...");
    const tx = await escrow.connect(signer).withdraw(secret, immutables);
    console.log("📡 Transaction submitted:", tx.hash);
    
    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error("Transaction receipt is null");
    }
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
    // Get TAKER's ETH balance after claiming
    const balanceAfter = await ethers.provider.getBalance(await signer.getAddress());
    const received = balanceAfter - balanceBefore;
    
    console.log("\n🎉 ETH CLAIM SUCCESSFUL!");
    console.log("=========================");
    console.log("✅ Transaction hash:", tx.hash);
    console.log("💰 ETH received:", ethers.formatEther(received));
    console.log("💰 TAKER balance after:", ethers.formatEther(balanceAfter));
    console.log("🎯 Atomic swap completed successfully!");
    
    // Update order with final transaction
    order.ethClaimed = {
      txHash: tx.hash,
      claimedAt: new Date().toISOString()
    };
    
    // Save updated order
    fs.writeFileSync(orderPath, JSON.stringify(order, null, 2));
    
  } catch (error) {
    console.error("❌ Error claiming ETH:", error);
    throw error;
  }
  
  console.log("\n🏁 ATOMIC SWAP COMPLETED!");
  console.log("==========================");
  console.log("📄 Order ID:", orderId);
  console.log("🔄 Full swap executed successfully!");
  console.log("💰 MAKER received:", BigInt(order.taker.xmrAmount) / BigInt(1e12), "XMR");
  
  if (order.maker.token === ethers.ZeroAddress) {
    console.log("💰 TAKER received:", ethers.formatEther(order.maker.amount), "ETH");
  } else {
    console.log("💰 TAKER received:", ethers.formatEther(order.maker.amount), "tokens");
  }
  
  console.log("💾 Order saved to:", orderPath);
  
  console.log("\n📋 FINAL ATOMIC SWAP STATUS:");
  console.log("============================");
  console.log("✅ Step 1: Order created");
  console.log("✅ Step 2: Order filled by taker");
  console.log("✅ Step 3: EVM escrow created");
  console.log("✅ Step 4: Monero HTLC funded");
  console.log("✅ Step 5: MAKER claimed XMR (secret revealed)");
  console.log("✅ Step 6: TAKER claimed ETH (using revealed secret)");
  
  console.log("\n🎯 ATOMIC SWAP SUMMARY:");
  console.log("=======================");
  
  if (order.maker.token === ethers.ZeroAddress) {
    console.log("🔸 Trade:", ethers.formatEther(order.maker.amount), "ETH ↔", BigInt(order.taker.xmrAmount) / BigInt(1e12), "XMR");
  } else {
    console.log("🔸 Trade:", ethers.formatEther(order.maker.amount), "tokens ↔", BigInt(order.taker.xmrAmount) / BigInt(1e12), "XMR");
  }
  
  console.log("🔸 MAKER:", order.maker.address);
  console.log("🔸 TAKER:", order.taker.address);
  console.log("🔸 Monero TX:", order.monero.txHash);
  console.log("🔸 EVM Escrow:", order.escrow.address);
  console.log("🔸 Secret:", order.secret);
  console.log("🔸 Hashlock:", order.hashlock);
  
  console.log("\n🔍 Verification:");
  console.log("================");
  console.log("🔸 Monero claim TX:", order.monero.claimTxHash);
  console.log("🔸 EVM claim TX:", order.ethClaimed?.txHash);
  
  return {
    success: true,
    orderId,
    ethAmount: order.maker.amount,
    xmrAmount: order.taker.xmrAmount,
    secret: order.secret,
    claimTx: order.ethClaimed?.txHash,
    order
  };
}

if (require.main === module) {
  main().catch(console.error);
}

export default main;
