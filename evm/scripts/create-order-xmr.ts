import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  // Generate random order ID
  const timestamp = Math.floor(Date.now() / 1000);
  const orderId = `order_${timestamp}`;
  console.log(`Creating order with ID: ${orderId}`);

  // Generate random secret (32 bytes)
  const secret = crypto.randomBytes(32);
  const secretHex = "0x" + secret.toString("hex");
  console.log(`Generated secret: ${secretHex}`);

  // Create hashlock using SHA-256
  const hashlock = ethers.sha256(secretHex);
  console.log(`Generated hashlock: ${hashlock}`);

  // Order details
  const order = {
    id: orderId,
    secret: secretHex,
    hashlock: hashlock,
    maker: {
      address: process.env.PUBLIC_KEY || "",
      token: process.env.TOKEN_ADDRESS || ethers.ZeroAddress, // ETH by default
      amount: ethers.parseEther("0.1").toString(), // 0.1 ETH or tokens
    },
    taker: {
      xmrAmount: "1000000000000", // 1 XMR in piconero (10^12)
    },
    timelock: {
      withdrawalPeriod: 0, // Immediate withdrawal
      cancellationPeriod: 3600, // 1 hour safety period
    },
    safetyDeposit: ethers.parseEther("0.01").toString(), // 0.01 ETH
    createdAt: new Date().toISOString(),
  };

  // Create orders directory if it doesn't exist
  const ordersDir = path.join(process.cwd(), "orders");
  if (!fs.existsSync(ordersDir)) {
    fs.mkdirSync(ordersDir);
  }

  // Save order to file
  const orderPath = path.join(ordersDir, `${orderId}.json`);
  fs.writeFileSync(orderPath, JSON.stringify(order, null, 2));
  console.log(`Order saved to: ${orderPath}`);

  // Print instructions
  console.log("\n=== NEXT STEPS ===");
  console.log(`1. Share the order ID with the taker: ${orderId}`);
  console.log(`2. Keep the secret safe: ${secretHex}`);
  console.log("3. Wait for taker to fill the order");
  console.log(`4. Run: ORDER_ID=${orderId} npm run maker:escrow`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
