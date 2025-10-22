import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log("——————————————————————————————————————————————————————————————————————");
console.log("— ADDRESS");
console.log(" ", account.address);
console.log("——————————————————————————————————————————————————————————————————————");
console.log("— PRIVATE KEY");
console.log(" ", privateKey);
console.log("——————————————————————————————————————————————————————————————————————");

