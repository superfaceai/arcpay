# Scripts

### Send money from your Arc testnet wallet

You'll need:

- Your wallet private key
- Recipient wallet address
- Amount of USDC

```sh
npm run arc:send-money [from] [to] [amount]
```

For example, to send money:

- from wallet with private key `0x292xxx87`
- to `0xFF378b68a174a9090BEA6ea4f51B0e901D334338`
- amount `2 USDC`

you should call

```sh
npm run arc:send-money 0x292xxx87 0xFF378b68a174a9090BEA6ea4f51B0e901D334338 2
```
