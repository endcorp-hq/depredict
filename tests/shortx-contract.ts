// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { ShortxContract } from "../target/types/shortx_contract";
// import {
//   PublicKey,
//   Keypair,
//   SystemProgram,
//   Transaction,
// } from "@solana/web3.js";
// import {
//   TOKEN_PROGRAM_ID,
//   ASSOCIATED_TOKEN_PROGRAM_ID,
//   createMint,
//   getOrCreateAssociatedTokenAccount,
//   mintTo,
// } from "@solana/spl-token";
// import { assert } from "chai";
// import * as fs from "fs";

// // Helper function for delays
// const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// // We will create a mint dynamically in the before() block
// // const USDC_MINT_PUBKEY = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

// describe("shortx-contract", () => {
//   const provider = anchor.AnchorProvider.env();
//   anchor.setProvider(provider);

//   const program = anchor.workspace.ShortxContract as Program<ShortxContract>;
//   const admin = Keypair.fromSecretKey(
//     Buffer.from(JSON.parse(fs.readFileSync("./keypair.json", "utf-8")))
//   );
//   const feeVault = Keypair.fromSecretKey(
//     Buffer.from(JSON.parse(fs.readFileSync("./fee-vault.json", "utf-8")))
//   );

//   const localMintFile = "./local_mint.json";
//   const localMint = Keypair.fromSecretKey(
//     Buffer.from(JSON.parse(fs.readFileSync(localMintFile, "utf-8")))
//   );

//   const user = Keypair.fromSecretKey(
//     Buffer.from(JSON.parse(fs.readFileSync("./user.json", "utf-8")))
//   );

//   let localMintPubkey: PublicKey;
//   let adminTokenAccount: PublicKey;
//   let feeVaultTokenAccount: PublicKey;
//   let userTokenAccount: PublicKey;

//   const [configPda] = PublicKey.findProgramAddressSync(
//     [Buffer.from("config")],
//     program.programId
//   );

//   before(async () => {
//     console.log("Admin public key:", admin.publicKey.toString());
//     console.log("Fee vault public key:", feeVault.publicKey.toString());
//     console.log("Config PDA:", configPda.toString());
//     localMintPubkey = localMint.publicKey;
//     console.log(`Loaded local token mint: ${localMintPubkey.toString()}`);

//     // 2. Initialize the mint account on the current localnet instance
//     // This is needed every time because anchor test starts a fresh validator
//     try {
//       await createMint(
//         provider.connection,
//         admin, // Payer
//         admin.publicKey, // Mint Authority
//         null, // Freeze Authority (optional)
//         6, // Decimals (like USDC)
//         localMint // Mint Keypair
//       );
//       console.log(
//         `Initialized mint account ${localMintPubkey.toString()} on-chain.`
//       );
//     } catch (error) {
//       // Log error if mint already exists (might happen in specific test setups, though unlikely with anchor test)
//       if (error.message.includes("already in use")) {
//         console.log(
//           `Mint account ${localMintPubkey.toString()} already exists.`
//         );
//       } else {
//         throw error; // Re-throw other errors
//       }
//     }

//     // 3. Create ATAs for admin and feeVault (idempotent)
//     adminTokenAccount = (
//       await getOrCreateAssociatedTokenAccount(
//         provider.connection,
//         admin, // Payer
//         localMintPubkey,
//         admin.publicKey
//       )
//     ).address;
//     console.log(
//       `Admin ATA (${localMintPubkey.toString()}): ${adminTokenAccount.toString()}`
//     );

//     feeVaultTokenAccount = (
//       await getOrCreateAssociatedTokenAccount(
//         provider.connection,
//         admin, // Payer (admin pays for fee vault's ATA)
//         localMintPubkey,
//         feeVault.publicKey
//       )
//     ).address;

//     userTokenAccount = (
//       await getOrCreateAssociatedTokenAccount(
//         provider.connection,
//         user, // Payer
//         localMintPubkey,
//         user.publicKey
//       )
//     ).address;

//     console.log(
//       `Fee Vault ATA (${localMintPubkey.toString()}): ${feeVaultTokenAccount.toString()}`
//     );

//     // 4. Mint tokens to the ATAs
//     const mintAmount = new anchor.BN(1_000_000 * 10 ** 6); // 1 Million tokens with 6 decimals
//     await mintTo(
//       provider.connection,
//       admin, // Payer
//       localMintPubkey,
//       adminTokenAccount,
//       admin.publicKey, // Mint Authority
//       mintAmount.toNumber() // Amount (beware of JS number limits for large amounts)
//     );
//     console.log(`Minted ${mintAmount.toString()} tokens to admin ATA`);

//     await mintTo(
//       provider.connection,
//       admin, // Payer
//       localMintPubkey,
//       feeVaultTokenAccount,
//       admin.publicKey, // Mint Authority
//       mintAmount.toNumber()
//     );

//     await mintTo(
//       provider.connection,
//       admin, // Payer
//       localMintPubkey,
//       userTokenAccount,
//       admin.publicKey, // Mint Authority
//       mintAmount.toNumber()
//     );
//     console.log(`Minted ${mintAmount.toString()} tokens to fee vault ATA`);
//   });

//   describe("Config", () => {
//     it("Initializes config", async () => {
//       const feeAmount = new anchor.BN(100);

//       await program.methods
//         .initializeConfig(feeAmount)
//         .accountsPartial({
//           signer: admin.publicKey,
//           feeVault: feeVault.publicKey,
//           config: configPda,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([admin])
//         .rpc();

//       const configAccount = await program.account.config.fetch(configPda);
//       assert.ok(configAccount.authority.equals(admin.publicKey));
//       assert.ok(configAccount.feeVault.equals(feeVault.publicKey));
//       assert.ok(configAccount.feeAmount.eq(feeAmount));
//     });

//     it("Updates config", async () => {
//       const newFeeAmount = new anchor.BN(200);

//       await program.methods
//         .updateConfig(newFeeAmount, null, null)
//         .accountsPartial({
//           signer: admin.publicKey,
//           feeVault: feeVault.publicKey,
//           config: configPda,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([admin])
//         .rpc();

//       const configAccount = await program.account.config.fetch(configPda);
//       assert.ok(configAccount.feeAmount.eq(newFeeAmount));
//     });
//   });

//   // describe("Market", () => {
//   //   it("Creates market", async () => {
//   //     const marketId = new anchor.BN(1);
//   //     const question = Array.from(Buffer.from("Will BTC reach $100k in 2024?"));
//   //     const marketStart = new anchor.BN(Math.floor(Date.now() / 1000));
//   //     const marketEnd = new anchor.BN(Math.floor(Date.now() / 1000) + 86400); // 24 hours later

//   //     const [marketPda] = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("market"), admin.publicKey.toBytes(), marketId.toArrayLike(Buffer, "le", 8)],
//   //       program.programId
//   //     );

//   //     console.log("Market PDA:", marketPda.toString());

//   //     await program.methods
//   //       .createMarket({
//   //         marketId,
//   //         question,
//   //         marketStart,
//   //         marketEnd,
//   //       })
//   //       .accountsPartial({
//   //         signer: admin.publicKey,
//   //         feeVault: feeVault.publicKey,
//   //         market: marketPda,
//   //         usdcMint: localMintPubkey,
//   //         tokenProgram: TOKEN_PROGRAM_ID,
//   //         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//   //         systemProgram: anchor.web3.SystemProgram.programId,
//   //       })
//   //       .signers([admin])
//   //       .rpc();

//   //     const marketAccount = await program.account.marketState.fetch(marketPda);
//   //     assert.ok(marketAccount.marketId.eq(marketId));
//   //     assert.ok(marketAccount.authority.equals(admin.publicKey));
//   //   });

//   //   it("Updates market", async () => {
//   //     const newMarketEnd = new anchor.BN(Math.floor(Date.now() / 1000) + 172800); // 48 hours later
//   //     const marketId = new anchor.BN(1);
//   //     const [marketPda] = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("market"), admin.publicKey.toBytes(), marketId.toArrayLike(Buffer, "le", 8)],
//   //       program.programId
//   //     );

//   //     await program.methods
//   //       .updateMarket({
//   //         marketId,
//   //         marketEnd: newMarketEnd,
//   //         winningDirection: { none: {} },
//   //         state: { active: {} },
//   //       })
//   //       .accountsPartial({
//   //         signer: admin.publicKey,
//   //         market: marketPda,
//   //         systemProgram: anchor.web3.SystemProgram.programId,
//   //       })
//   //       .signers([admin])
//   //       .rpc();

//   //     const marketAccount = await program.account.marketState.fetch(marketPda);
//   //     assert.ok(marketAccount.marketEnd.eq(newMarketEnd));
//   //   });

//   //   it("Closes market", async () => {
//   //     const marketId = new anchor.BN(1);
//   //     const [marketPda] = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("market"), admin.publicKey.toBytes(), marketId.toArrayLike(Buffer, "le", 8)],
//   //       program.programId
//   //     );
//   //     // First update market to resolved state
//   //     await program.methods
//   //       .updateMarket({
//   //         marketId: new anchor.BN(1),
//   //         marketEnd: null,
//   //         winningDirection: { yes: {} },
//   //         state: { resolved: {} },
//   //       })
//   //       .accountsPartial({
//   //         signer: admin.publicKey,
//   //         market: marketPda,
//   //         systemProgram: anchor.web3.SystemProgram.programId,
//   //       })
//   //       .signers([admin])
//   //       .rpc();

//   //     // Then close the market
//   //     await program.methods
//   //       .closeMarket({
//   //         marketId: new anchor.BN(1)
//   //       })
//   //       .accountsPartial({
//   //         signer: admin.publicKey,
//   //         feeVault: feeVault.publicKey,
//   //         market: marketPda,
//   //         usdcMint: localMintPubkey,
//   //         tokenProgram: TOKEN_PROGRAM_ID,
//   //         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//   //         systemProgram: anchor.web3.SystemProgram.programId,
//   //       })
//   //       .signers([admin])
//   //       .rpc();
//   //   });
//   // });

//   // describe("User", () => {
//   //   it("Creates user", async () => {
//   //     const userId = 1;
//   //     const [userPda] = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("user"), user.publicKey.toBytes()],
//   //       program.programId
//   //     );

//   //     await program.methods
//   //       .createUser({
//   //         authority: user.publicKey,
//   //         id: userId,

//   //       })
//   //       .accountsPartial({
//   //         signer: user.publicKey,
//   //         user: userPda,
//   //         systemProgram: anchor.web3.SystemProgram.programId,
//   //       })
//   //       .signers([user])
//   //       .rpc();

//   //     const userAccount = await program.account.user.fetch(userPda);
//   //     assert.equal(userAccount.id, userId);
//   //     assert.ok(userAccount.authority.equals(user.publicKey));
//   //   });
//   // });

//   // describe("User Trade", () => {
//   //   it("Creates user trade", async () => {
//   //     const [userTradePda] = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("user_trade"), user.publicKey.toBytes()],
//   //       program.programId
//   //     );

//   //     await program.methods
//   //       .createUserTrade()
//   //       .accountsPartial({
//   //         signer: user.publicKey,
//   //         userTrade: userTradePda,
//   //         systemProgram: anchor.web3.SystemProgram.programId,
//   //       })
//   //       .signers([user])
//   //       .rpc();

//   //     const userTradeAccount = await program.account.userTrade.fetch(userTradePda);
//   //     assert.ok(userTradeAccount.authority.equals(user.publicKey));
//   //   });

//   //   it("Creates sub user trade", async () => {
//   //     const subUser = Keypair.generate();
//   //     const [userTradePda] = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("user_trade"), user.publicKey.toBytes()],
//   //       program.programId
//   //     );

//   //     const [subUserTradePda] = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("user_trade"), subUser.publicKey.toBytes()],
//   //       program.programId
//   //     );

//   //     await program.methods
//   //       .createSubUserTrade(subUser.publicKey)
//   //       .accountsPartial({
//   //         signer: user.publicKey,
//   //         userTrade: userTradePda,
//   //         subUserTrade: subUserTradePda,
//   //         systemProgram: anchor.web3.SystemProgram.programId,
//   //       })
//   //       .signers([user])
//   //       .rpc();

//   //     const subUserTradeAccount = await program.account.userTrade.fetch(subUserTradePda);
//   //     assert.ok(subUserTradeAccount.authority.equals(user.publicKey));
//   //     assert.ok(subUserTradeAccount.isSubUser);
//   //   });
//   // });

//   describe("Order Placement and Flow", () => {
//     const marketId = new anchor.BN(10);

//     // it("Creates market for Orders", async () => {
//     //   const question = Array.from(Buffer.from("Market for Order Tests?"));

//     //   // --- Get validator time ---
//     //   console.log("\n--- Fetching Validator Time ---");
//     //   const currentSlot = await provider.connection.getSlot();
//     //   const validatorTime = await provider.connection.getBlockTime(currentSlot);
//     //   if (!validatorTime) {
//     //     assert.fail("Could not fetch validator block time.");
//     //   }
//     //   console.log(`Current Slot: ${currentSlot}`);
//     //   console.log(
//     //     `Validator Time (getBlockTime): ${validatorTime} (${new Date(
//     //       validatorTime * 1000
//     //     ).toISOString()})`
//     //   );
//     //   console.log("--- End Fetching Validator Time ---");
//     //   // ---

//     //   // Set market times relative to validator time
//     //   const marketStart = new anchor.BN(validatorTime - 60); // Start 60 seconds BEFORE validator time
//     //   const marketEnd = new anchor.BN(validatorTime + 86400); // End 24 hours AFTER validator time
//     //   console.log(
//     //     `Calculated Market Start: ${marketStart.toString()} (${new Date(
//     //       marketStart.toNumber() * 1000
//     //     ).toISOString()})`
//     //   );

//     //   const [marketPda] = PublicKey.findProgramAddressSync(
//     //     [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
//     //     program.programId
//     //   );

//     //   console.log("Market PDA (Order Suite):", marketPda.toString());

//     //   const tx = await program.methods
//     //     .createMarket({
//     //       marketId,
//     //       question,
//     //       marketStart,
//     //       marketEnd,
//     //     })
//     //     .accountsPartial({
//     //       signer: admin.publicKey,
//     //       feeVault: feeVault.publicKey,
//     //       market: marketPda,
//     //       usdcMint: localMintPubkey,
//     //       tokenProgram: TOKEN_PROGRAM_ID,
//     //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//     //       systemProgram: anchor.web3.SystemProgram.programId,
//     //     })
//     //     .signers([admin])
//     //     .transaction();

//     //   const txSignature = await anchor.web3.sendAndConfirmTransaction(
//     //     provider.connection,
//     //     new Transaction().add(tx),
//     //     [admin],
//     //     { commitment: "confirmed" }
//     //   );
//     //   console.log("Create Market Tx Signature:", txSignature);

//     //   // Confirmation is implicitly done by sendAndConfirmTransaction
//     //   // await provider.connection.confirmTransaction(txSignature, "confirmed");

//     //   console.log("\n--- Verifying Market Start Time After Creation ---");
//     //   try {
//     //     // Short delay to allow state propagation (optional)
//     //     await new Promise((resolve) => setTimeout(resolve, 1000));
//     //     const marketAccount = await program.account.marketState.fetch(
//     //       marketPda
//     //     );
//     //     const writtenStartTime = marketAccount.marketStart.toNumber();
//     //     console.log(
//     //       `Market Start Time (Read Back): ${writtenStartTime} (${new Date(
//     //         writtenStartTime * 1000
//     //       ).toISOString()})`
//     //     );
//     //     assert.strictEqual(
//     //       writtenStartTime,
//     //       marketStart.toNumber(),
//     //       "Written marketStart time mismatch!"
//     //     );
//     //   } catch (fetchError) {
//     //     console.error(
//     //       "Error fetching market account after createMarket:",
//     //       fetchError
//     //     );
//     //   }
//     //   console.log("--- End Verification ---");

//     //   const marketAccount = await program.account.marketState.fetch(marketPda);
//     //   assert.ok(marketAccount.marketId.eq(marketId));
//     //   assert.ok(marketAccount.authority.equals(admin.publicKey));
//     // });

//     // it("Creates user trade", async () => {
//     //   const [userTradePda] = PublicKey.findProgramAddressSync(
//     //     [Buffer.from("user_trade"), user.publicKey.toBytes()],
//     //     program.programId
//     //   );

//     //   const userTradeAccountCheck = await program.account.userTrade.fetch(
//     //     userTradePda
//     //   );
//     //   if (userTradeAccountCheck.authority.equals(user.publicKey)) {
//     //     console.log("User trade already exists");
//     //     return;
//     //   } else {
//     //     await program.methods
//     //       .createUserTrade()
//     //       .accountsPartial({
//     //         signer: user.publicKey,
//     //         userTrade: userTradePda,
//     //         systemProgram: anchor.web3.SystemProgram.programId,
//     //       })
//     //       .signers([user])
//     //       .rpc();

//     //     const userTradeAccount = await program.account.userTrade.fetch(
//     //       userTradePda
//     //     );
//     //     assert.ok(userTradeAccount.authority.equals(user.publicKey));
//     //   }
//     // });

//     // it("Creates order", async () => {
//     //   const [userTradePda] = PublicKey.findProgramAddressSync(
//     //     [Buffer.from("user_trade"), user.publicKey.toBytes()],
//     //     program.programId
//     //   );

//     //   const [marketPda] = PublicKey.findProgramAddressSync(
//     //     [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
//     //     program.programId
//     //   );

//     //   // --- Log Timestamps ---
//     //   console.log("\n--- Timestamp Check Before Create Order ---");
//     //   try {
//     //     const marketAccount = await program.account.marketState.fetch(
//     //       marketPda
//     //     );
//     //     const marketStartTime = marketAccount.marketStart.toNumber(); // Convert BN to number
//     //     const currentTime = Math.floor(Date.now() / 1000);
//     //     console.log(`Market PDA: ${marketPda.toString()}`);
//     //     console.log(
//     //       `Market Start Time (from account): ${marketStartTime} (${new Date(
//     //         marketStartTime * 1000
//     //       ).toISOString()})`
//     //     );
//     //     console.log(
//     //       `Current Time (before createOrder call): ${currentTime} (${new Date(
//     //         currentTime * 1000
//     //       ).toISOString()})`
//     //     );
//     //     console.log(
//     //       `Current Time > Market Start Time? ${currentTime > marketStartTime}`
//     //     );
//     //   } catch (fetchError) {
//     //     console.error(
//     //       "Error fetching market account before createOrder:",
//     //       fetchError
//     //     );
//     //     // Consider failing the test here if market doesn't exist
//     //     assert.fail(
//     //       "Market account could not be fetched before placing order."
//     //     );
//     //   }
//     //   console.log("--- End Timestamp Check ---");
//     //   // ---

//     //   // --- Log UserTrade Orders Before Placing ---
//     //   console.log("\n--- Checking UserTrade Orders Before Placing ---");
//     //   try {
//     //     const userTradeAccount = await program.account.userTrade.fetch(
//     //       userTradePda
//     //     );
//     //     console.log("Current orders in UserTrade:");
//     //     userTradeAccount.orders.forEach((order, index) => {
//     //       console.log(
//     //         `  Slot ${index}: ID=${order.orderId.toString()}, Status=${JSON.stringify(
//     //           order.orderStatus
//     //         )}, Direction=${JSON.stringify(
//     //           order.orderDirection
//     //         )}, Market=${order.marketId.toString()}`
//     //       );
//     //     });
//     //   } catch (fetchError) {
//     //     console.error(
//     //       "Error fetching userTrade account before createOrder:",
//     //       fetchError
//     //     );
//     //     assert.fail(
//     //       "UserTrade account could not be fetched before placing order."
//     //     );
//     //   }
//     //   console.log("--- End UserTrade Orders Check ---");
//     //   // ---

//     //   // console.log("\n--- Placing First YES Order ---");
//     //   // // Fetch market state to get the current price for the first order
//     //   let marketAccount = await program.account.marketState.fetch(marketPda);
//     //   let orderAmount = marketAccount.yesPrice; // Use current YES price as amount
//     //   console.log(
//     //     `Using order amount (current YES price): ${orderAmount.toString()}`
//     //   );

//     //   await program.methods
//     //     .createOrder({
//     //       amount: orderAmount, // Use the fetched price
//     //       direction: { yes: {} },
//     //     })
//     //     .accountsPartial({
//     //       signer: user.publicKey,
//     //       feeVault: feeVault.publicKey,
//     //       userTrade: userTradePda,
//     //       market: marketPda,
//     //       mint: localMintPubkey,
//     //       config: configPda,
//     //       tokenProgram: TOKEN_PROGRAM_ID,
//     //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//     //       systemProgram: anchor.web3.SystemProgram.programId,
//     //     })
//     //     .signers([user])
//     //     .rpc();
//     //   console.log("First YES Order placed.");
//     //   marketAccount = await program.account.marketState.fetch(marketPda); // Re-fetch market state
//     //   console.log(
//     //     `Price after 1st YES: YES=${marketAccount.yesPrice.toString()}, NO=${marketAccount.noPrice.toString()}`
//     //   );

//     //   await sleep(3500); // Add delay before next order

//     //   // --- Place Second YES Order ---
//     //   console.log("\n--- Placing Second YES Order ---");
//     //   orderAmount = marketAccount.yesPrice; // Get current YES price
//     //   console.log(
//     //     `Using order amount (current YES price): ${orderAmount.toString()}`
//     //   );
//     //   await program.methods
//     //     .createOrder({ amount: orderAmount, direction: { yes: {} } })
//     //     .accountsPartial({
//     //       /* Same accounts as above */ signer: user.publicKey,
//     //       feeVault: feeVault.publicKey,
//     //       userTrade: userTradePda,
//     //       market: marketPda,
//     //       mint: localMintPubkey,
//     //       config: configPda,
//     //       tokenProgram: TOKEN_PROGRAM_ID,
//     //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//     //       systemProgram: anchor.web3.SystemProgram.programId,
//     //     })
//     //     .signers([user])
//     //     .rpc();
//     //   console.log("Second YES Order placed.");
//     //   marketAccount = await program.account.marketState.fetch(marketPda);
//     //   console.log(
//     //     `Price after 2nd YES: YES=${marketAccount.yesPrice.toString()}, NO=${marketAccount.noPrice.toString()}`
//     //   );

//     //   await sleep(3500); // Add delay before next order

//     //   // --- Place Third YES Order ---
//     //   console.log("\n--- Placing Third YES Order ---");
//     //   orderAmount = marketAccount.yesPrice; // Get current YES price
//     //   console.log(
//     //     `Using order amount (current YES price): ${orderAmount.toString()}`
//     //   );
//     //   await program.methods
//     //     .createOrder({ amount: orderAmount, direction: { yes: {} } })
//     //     .accountsPartial({
//     //       /* Same accounts */ signer: user.publicKey,
//     //       feeVault: feeVault.publicKey,
//     //       userTrade: userTradePda,
//     //       market: marketPda,
//     //       mint: localMintPubkey,
//     //       config: configPda,
//     //       tokenProgram: TOKEN_PROGRAM_ID,
//     //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//     //       systemProgram: anchor.web3.SystemProgram.programId,
//     //     })
//     //     .signers([user])
//     //     .rpc();
//     //   console.log("Third YES Order placed.");
//     //   marketAccount = await program.account.marketState.fetch(marketPda);
//     //   console.log(
//     //     `Price after 3rd YES: YES=${marketAccount.yesPrice.toString()}, NO=${marketAccount.noPrice.toString()}`
//     //   );

//     //   await sleep(3500); // Add delay before next order

//     //   // --- Place First NO Order ---
//     //   console.log("\n--- Placing First NO Order ---");
//     //   orderAmount = marketAccount.noPrice; // Get current NO price
//     //   console.log(
//     //     `Using order amount (current NO price): ${orderAmount.toString()}`
//     //   );
//     //   await program.methods
//     //     .createOrder({ amount: orderAmount, direction: { no: {} } })
//     //     .accountsPartial({
//     //       /* Same accounts */ signer: user.publicKey,
//     //       feeVault: feeVault.publicKey,
//     //       userTrade: userTradePda,
//     //       market: marketPda,
//     //       mint: localMintPubkey,
//     //       config: configPda,
//     //       tokenProgram: TOKEN_PROGRAM_ID,
//     //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//     //       systemProgram: anchor.web3.SystemProgram.programId,
//     //     })
//     //     .signers([user])
//     //     .rpc();
//     //   console.log("First NO Order placed.");
//     //   marketAccount = await program.account.marketState.fetch(marketPda);
//     //   console.log(
//     //     `Final Price after NO order: YES=${marketAccount.yesPrice.toString()}, NO=${marketAccount.noPrice.toString()}`
//     //   );

//     //   // --- Find Open YES Orders to Close ---
//     //   console.log("\n--- Finding Open YES Orders ---");
//     //   const userTradeAccount = await program.account.userTrade.fetch(
//     //     userTradePda
//     //   );
//     //   const openYesOrders = userTradeAccount.orders.filter(
//     //     (order) =>
//     //       // Check if status is Open and direction is Yes and marketId matches
//     //       order.orderStatus.hasOwnProperty("open") &&
//     //       order.orderDirection.hasOwnProperty("yes") &&
//     //       order.marketId.eq(marketId) &&
//     //       order.orderId.gtn(0) // Ensure it's a valid order (ID > 0)
//     //   );

//     //   if (openYesOrders.length < 2) {
//     //     console.error(
//     //       "Orders found:",
//     //       userTradeAccount.orders.map((o) => ({
//     //         id: o.orderId.toString(),
//     //         status: JSON.stringify(o.orderStatus),
//     //         dir: JSON.stringify(o.orderDirection),
//     //         market: o.marketId.toString(),
//     //       }))
//     //     );
//     //     assert.fail(
//     //       `Expected at least 2 open YES orders for market ${marketId.toString()}, found ${
//     //         openYesOrders.length
//     //       }`
//     //     );
//     //   }

//     //   const yesOrderToClose1Id = openYesOrders[0].orderId;
//     //   const yesOrderToClose2Id = openYesOrders[1].orderId;
//     //   console.log(
//     //     `Found YES orders to close: ${yesOrderToClose1Id.toString()}, ${yesOrderToClose2Id.toString()}`
//     //   );

//     //   // --- Close First YES Order ---
//     //   console.log(
//     //     `\n--- Closing First YES Order (${yesOrderToClose1Id.toString()}) ---`
//     //   );
//     //   await program.methods
//     //     .closeOrder(yesOrderToClose1Id)
//     //     .accountsPartial({
//     //       // Same accounts as createOrder
//     //       signer: user.publicKey,
//     //       feeVault: feeVault.publicKey,
//     //       userTrade: userTradePda,
//     //       market: marketPda,
//     //       mint: localMintPubkey,
//     //       config: configPda,
//     //       tokenProgram: TOKEN_PROGRAM_ID,
//     //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//     //       systemProgram: anchor.web3.SystemProgram.programId,
//     //     })
//     //     .signers([user])
//     //     .rpc({
//     //       skipPreflight: true,
//     //       commitment: "confirmed",
//     //     });
//     //   console.log("First YES Order closed.");
//     //   marketAccount = await program.account.marketState.fetch(marketPda); // Re-fetch market state
//     //   console.log(
//     //     `Price after closing 1st YES: YES=${marketAccount.yesPrice.toString()}, NO=${marketAccount.noPrice.toString()}`
//     //   );

//     //   await sleep(3500); // Delay to prevent ConcurrentTransaction

//     //   // --- Close Second YES Order ---
//     //   console.log(
//     //     `\n--- Closing Second YES Order (${yesOrderToClose2Id.toString()}) ---`
//     //   );
//     //   await program.methods
//     //     .closeOrder(yesOrderToClose2Id)
//     //     .accountsPartial({
//     //       // Same accounts
//     //       signer: user.publicKey,
//     //       feeVault: feeVault.publicKey,
//     //       userTrade: userTradePda,
//     //       market: marketPda,
//     //       mint: localMintPubkey,
//     //       config: configPda,
//     //       tokenProgram: TOKEN_PROGRAM_ID,
//     //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//     //       systemProgram: anchor.web3.SystemProgram.programId,
//     //     })
//     //     .signers([user])
//     //     .rpc();
//     //   console.log("Second YES Order closed.");
//     //   marketAccount = await program.account.marketState.fetch(marketPda);
//     //   console.log(
//     //     `Final Price after closing 2nd YES: YES=${marketAccount.yesPrice.toString()}, NO=${marketAccount.noPrice.toString()}`
//     //   );

//     //   await sleep(3500); // Delay to prevent ConcurrentTransaction

      
//     // });

//     it("market resolution", async () => {
//       let marketId = new anchor.BN(10);
//       const [marketPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
//         program.programId
//       );
//       console.log("\n--- Fetching Validator Time ---");
//       const currentSlot = await provider.connection.getSlot();
//       const validatorTime = await provider.connection.getBlockTime(
//         currentSlot
//       );
//       if (!validatorTime) {
//         assert.fail("Could not fetch validator block time.");
//       }
//       console.log(`Current Slot: ${currentSlot}`);
//       console.log(
//         `Validator Time (getBlockTime): ${validatorTime} (${new Date(
//           validatorTime * 1000
//         ).toISOString()})`
//       );
//       console.log("--- End Fetching Validator Time ---");
//       // ---

//       // Set market times relative to validator time
//       // const marketStart = new anchor.BN(validatorTime - 60); // Start 60 seconds BEFORE validator time
//       const marketEnd = new anchor.BN(validatorTime - 100); // End 24 hours AFTER validator time

//       await program.methods
//         .updateMarket({
//           marketId,
//           marketEnd,
//           winningDirection: { yes: {} },
//           state: { resolved: {} },
//         })
//         .accountsPartial({
//           signer: admin.publicKey,
//           market: marketPda,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([admin])
//         .rpc();
//     });

    

//     it("order payouts", async () => {
//       await sleep(3500);
//       let marketId = new anchor.BN(10);
//       const [marketPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
//         program.programId
//       );
//       const [userTradePda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("user_trade"), user.publicKey.toBytes()],
//         program.programId
//       );
//       const userTradeAccount = await program.account.userTrade.fetch(
//         userTradePda
//       );

//       console.log("Current orders in UserTrade:");
//         userTradeAccount.orders.forEach((order, index) => {
//           console.log(
//             `  Slot ${index}: ID=${order.orderId.toString()}, Status=${JSON.stringify(
//               order.orderStatus
//             )}, Direction=${JSON.stringify(
//               order.orderDirection
//             )}, Market=${order.marketId.toString()}`
//           );
//         });
//       await program.methods
//         .settleOrder(userTradeAccount.orders[7].orderId)
//         .accountsPartial({
//           signer: user.publicKey,
//           feeVault: feeVault.publicKey,
//           userTrade: userTradePda,
//           market: marketPda,
//           mint: localMintPubkey,
//           config: configPda,
//           tokenProgram: TOKEN_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([user])
//         .rpc();
//     });
//   });
// });
