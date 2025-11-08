import {
  createWalletClient,
  http,
  defineChain,
  isHex,
  isAddress,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const RPC_URL = "https://rpc.testnet.arc.network";

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

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
});

const account = privateKeyToAccount(PRIVATE_KEY);

const client = createWalletClient({
  account,
  chain: arcTestnet,
  transport: http(RPC_URL),
});

console.info(`- Sending -----------------------------------------------------`);
console.info(`  From: ${account.address}`);
console.info(`  To: ${RECIPIENT}`);
console.info(`  Amount: ${AMOUNT} USDC`);
console.info(`  `);

const hash = await client.sendTransaction({
  to: RECIPIENT,
  value: parseEther(AMOUNT),
});

console.info(`  ✅ Sent transaction`);
console.info(`  Hash: ${hash}`);
console.info(
  `  -------------------------------------------------------------\n\n`
);
