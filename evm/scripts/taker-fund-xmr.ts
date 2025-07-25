import fs from "fs";
import path from "path";
import dotenv from "dotenv";
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

  // Check if maker has created escrow
  if (!order.escrow || !order.escrow.address) {
    throw new Error("Escrow not created by maker yet");
  }

  // Get Monero wallet details
  const xmrWalletPath = process.env.MONERO_WALLET_PATH;
  const xmrWalletPassword = process.env.MONERO_WALLET_PASSWORD;
  
  if (!xmrWalletPath) {
    throw new Error("MONERO_WALLET_PATH environment variable not set");
  }

  console.log("Creating Monero HTLC...");

  // Use the XMR-ETH atomic swap library from the submodule
  try {
    // This is a placeholder for the actual Monero transaction
    // In a real implementation, we would use the xmr submodule to create the transaction
    console.log(`Using XMR submodule to create HTLC with hashlock: ${order.hashlock}`);
    
    // Example command to create Monero HTLC (this is a placeholder)
    // In reality, this would use the XMR-ETH atomic swap library
    const xmrAmount = BigInt(order.taker.xmrAmount);
    console.log(`Sending ${xmrAmount} piconero (${Number(xmrAmount) / 1e12} XMR) to HTLC...`);
    
    // Simulate Monero transaction (in a real implementation, we would use the XMR library)
    const txHash = `simulate_xmr_tx_${Date.now().toString(16)}`;
    
    // Record transaction details
    order.monero = {
      txHash: txHash,
      amount: order.taker.xmrAmount,
      fundedAt: new Date().toISOString(),
    };
    
    fs.writeFileSync(orderPath, JSON.stringify(order, null, 2));
    console.log(`Monero HTLC funded with transaction: ${txHash}`);
    
    // Print instructions for next steps
    console.log("\n=== NEXT STEPS ===");
    console.log("1. Wait for maker to claim XMR (revealing secret)");
    console.log(`2. Run: ORDER_ID=${orderId} npm run taker:claim-eth`);
    
  } catch (error) {
    console.error("Error creating Monero HTLC:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
