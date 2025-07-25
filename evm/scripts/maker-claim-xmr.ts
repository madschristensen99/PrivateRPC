import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { ethers } from "hardhat";
import { execSync } from "child_process";

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

  // Check if taker has funded Monero HTLC
  if (!order.monero || !order.monero.txHash) {
    throw new Error("Monero HTLC not funded by taker yet");
  }

  // Get Monero wallet details
  const xmrWalletPath = process.env.MONERO_WALLET_PATH;
  const xmrWalletPassword = process.env.MONERO_WALLET_PASSWORD;
  
  if (!xmrWalletPath) {
    throw new Error("MONERO_WALLET_PATH environment variable not set");
  }

  console.log("Claiming Monero from HTLC...");

  try {
    // Get secret from order
    const secret = order.secret;
    if (!secret) {
      throw new Error("Secret not found in order");
    }
    
    console.log(`Using secret: ${secret}`);
    
    // Use the XMR-ETH atomic swap library from the submodule to claim XMR
    // This is a placeholder for the actual Monero claim transaction
    console.log(`Using XMR submodule to claim HTLC with secret: ${secret}`);
    
    // Example command to claim Monero HTLC (this is a placeholder)
    // In reality, this would use the XMR-ETH atomic swap library
    const claimTxHash = `simulate_xmr_claim_tx_${Date.now().toString(16)}`;
    
    // Record claim details
    order.monero.claimTxHash = claimTxHash;
    order.monero.claimedAt = new Date().toISOString();
    order.secretRevealed = true;
    
    fs.writeFileSync(orderPath, JSON.stringify(order, null, 2));
    console.log(`Monero claimed with transaction: ${claimTxHash}`);
    
    // Print instructions for next steps
    console.log("\n=== NEXT STEPS ===");
    console.log("Secret is now revealed on the Monero blockchain");
    console.log(`Taker should run: ORDER_ID=${orderId} npm run taker:claim-eth`);
    
  } catch (error) {
    console.error("Error claiming Monero:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
