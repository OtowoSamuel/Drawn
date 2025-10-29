# Linear Wallet SDK notes

This file contains pointers for integrating Linear Wallet SDK into the frontend.

- Install the SDK (example): `npm install @linear/sdk` (confirm package name/current docs).
- Use the SDK to request wallet connection and sign transactions. Keep calls behind safe UI flows.
- Example flow: connect wallet -> fetch user address -> call backend or sign a transaction for minting.

Use the Linear docs for up-to-date APIs and web3 provider patterns.
