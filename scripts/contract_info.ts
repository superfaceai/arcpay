import { createPublicClient, http } from "viem";
import { arcTestnet, RPC_URL } from "@/arc-facilitator/values";

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(RPC_URL),
});

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

// Read the name from the token contract
const name = await client.readContract({
  address: USDC_ADDRESS,
  abi: [
    {
      name: "name",
      type: "function",
      inputs: [],
      outputs: [{ type: "string" }],
    },
  ],
  functionName: "name",
});

// Try to read version if the contract supports EIP-712
let version = "2"; // default
try {
  version = (await client.readContract({
    address: USDC_ADDRESS,
    abi: [
      {
        name: "version",
        type: "function",
        inputs: [],
        outputs: [{ type: "string" }],
      },
    ],
    functionName: "version",
  })) as any;
} catch {
  // Contract might not expose version directly
  console.log("version() not available, using default '2'");
}

console.log("Contract name:", name);
console.log("Contract version:", version);
