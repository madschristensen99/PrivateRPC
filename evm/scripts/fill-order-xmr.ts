import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  // Get order ID from environment variable
  const orderId = process.env.ORDER_ID;
  if (!orderId) {
    throw new Error("ORDER_ID environment variable not set");
  }

  console.log(`Filling order: ${orderId}`);

  // Load order from file
  const ordersDir = path.join(process.cwd(), "orders");
  const orderPath = path.join(ordersDir, `${orderId}.json`);
  
  if (!fs.existsSync(orderPath)) {
    throw new Error(`Order file not found: ${orderPath}`);
  }
  
  const order = JSON.parse(fs.readFileSync(orderPath, "utf8"));
  console.log("Order details:", JSON.stringify(order, null, 2));

  // Get taker's Monero address
  const xmrAddress = process.env.MONERO_ADDRESS;
  if (!xmrAddress) {
    throw new Error("MONERO_ADDRESS environment variable not set");
  }

  // Update order with taker's address and current timestamp
  order.taker.address = process.env.PUBLIC_KEY || "";
  order.taker.xmrAddress = xmrAddress;
  order.filledAt = new Date().toISOString();

  // Save updated order
  fs.writeFileSync(orderPath, JSON.stringify(order, null, 2));
  console.log(`Order updated with taker's information`);

  // Print instructions for next steps
  console.log("\n=== NEXT STEPS ===");
  console.log("1. Wait for maker to create EVM escrow");
  console.log(`2. Run: ORDER_ID=${orderId} npm run taker:fund-xmr`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
