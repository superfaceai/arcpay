import { isHex, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { sendTransactionOnArcTestnet } from "@/arc/services";

const [, , cliPrivateKey, cliTo, cliAmount] = process.argv;

const PRIVATE_KEY = cliPrivateKey.trim();
const RECIPIENT = cliTo.trim();
const AMOUNT = cliAmount.trim();

if (!isHex(PRIVATE_KEY)) {
  throw new Error("Private key (first argument) must be a valid hex string");
}

if (!isAddress(RECIPIENT)) {
  throw new Error(
    "Recipient address (second argument) must be a valid address"
  );
}

if (!AMOUNT || isNaN(Number(AMOUNT))) {
  throw new Error("Amount (third argument) must be a valid number");
}

const account = privateKeyToAccount(PRIVATE_KEY);

console.info(`- Sending -----------------------------------------------------`);
console.info(`  From: ${account.address}`);
console.info(`  To: ${RECIPIENT}`);
console.info(`  Amount: ${AMOUNT} USDC`);
console.info(`  `);

const hash = await sendTransactionOnArcTestnet({
  fromWalletPrivateKey: PRIVATE_KEY,
  toAddress: RECIPIENT,
  amount: AMOUNT,
});

if (!hash.ok) {
  throw new Error(`Failed to send transaction: ${hash.error.message}`);
}

console.info(`  ✅ Sent transaction`);
console.info(`  Hash: ${hash.value.txHash}`);
console.info(
  `  -------------------------------------------------------------\n\n`
);
