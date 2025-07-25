import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { XMREscrowFactory__factory } from "../typechain-types";

dotenv.config();

async function main() {
  // Get order ID from environment variable
  const orderId = process.env.ORDER_ID;
  if (!orderId) {
    throw new Error("ORDER_ID environment variable not set");
  }

  console.log(`Processing order: ${orderId}`);

  // Load order from file
  const ordersDir = path.join(process.cwd(), "orders");
  const orderPath = path.join(ordersDir, `${orderId}.json`);
  
  if (!fs.existsSync(orderPath)) {
    throw new Error(`Order file not found: ${orderPath}`);
  }
  
  const order = JSON.parse(fs.readFileSync(orderPath, "utf8"));
  console.log("Order details:", JSON.stringify(order, null, 2));

  // Check if taker has filled the order
  if (!order.taker.address || !order.taker.xmrAddress) {
    throw new Error("Order not filled by taker yet");
  }

  // Connect to the network
  const [signer] = await ethers.getSigners();
  console.log(`Connected with address: ${signer.address}`);

  // Load factory address from deployment file or environment
  const factoryAddress = process.env.XMR_FACTORY_ADDRESS;
  if (!factoryAddress) {
    throw new Error("XMR_FACTORY_ADDRESS environment variable not set");
  }

  // Connect to XMR Escrow Factory
  const xmrEscrowFactory = XMREscrowFactory__factory.connect(factoryAddress, signer);
  console.log(`Connected to XMR Escrow Factory at: ${factoryAddress}`);

  // Prepare escrow immutables
  const now = Math.floor(Date.now() / 1000);
  const immutables = {
    maker: order.maker.address,
    taker: order.taker.address,
    token: order.maker.token,
    amount: order.maker.amount,
    hashlock: order.hashlock,
    safetyDeposit: order.safetyDeposit,
    timelocks: {
      deployedAt: now,
      srcWithdrawal: now + 0, // Immediate withdrawal
      srcPublicWithdrawal: now + 1800, // 30 minutes after deployment
      srcCancellation: now + 3600, // 1 hour after deployment
      dstWithdrawal: now + 0, // Immediate withdrawal
      dstPublicWithdrawal: now + 1800, // 30 minutes after deployment
      dstCancellation: now + 3600, // 1 hour after deployment
    }
  };

  // Calculate required ETH
  const isEthSwap = order.maker.token === ethers.ZeroAddress;
  const ethAmount = isEthSwap ? 
    BigInt(order.maker.amount) + BigInt(order.safetyDeposit) : 
    BigInt(order.safetyDeposit);
  
  // Add creation fee
  const creationFee = await xmrEscrowFactory.creationFee();
  const totalEthRequired = ethAmount + creationFee;
  
  console.log(`Creating source escrow with ${ethers.formatEther(totalEthRequired)} ETH...`);

  // Create source escrow
  const tx = await xmrEscrowFactory.createSrcEscrow(immutables, {
    value: totalEthRequired
  });
  
  console.log(`Transaction sent: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block ${receipt?.blockNumber}`);

  // Get escrow address from events
  const escrowCreatedEvent = receipt?.logs
    .map(log => {
      try {
        return xmrEscrowFactory.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    })
    .find(event => event && event.name === "SrcEscrowCreated");

  if (!escrowCreatedEvent) {
    throw new Error("Failed to find SrcEscrowCreated event");
  }

  const escrowAddress = escrowCreatedEvent.args[0];
  console.log(`Escrow created at: ${escrowAddress}`);

  // Record Monero address in escrow
  const xmrEscrowSrc = await ethers.getContractAt("XMREscrowSrc", escrowAddress);
  const recordTx = await xmrEscrowSrc.recordMoneroAddress(
    order.hashlock,
    order.taker.xmrAddress,
    immutables
  );
  
  console.log(`Recording Monero address: ${order.taker.xmrAddress}`);
  await recordTx.wait();
  console.log("Monero address recorded in escrow");

  // Update order with escrow address
  order.escrow = {
    address: escrowAddress,
    createdAt: new Date().toISOString(),
  };
  
  fs.writeFileSync(orderPath, JSON.stringify(order, null, 2));
  console.log(`Order updated with escrow information`);

  // Print instructions for next steps
  console.log("\n=== NEXT STEPS ===");
  console.log("1. Wait for taker to fund Monero HTLC");
  console.log(`2. Run: ORDER_ID=${orderId} npm run maker:claim-xmr`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
