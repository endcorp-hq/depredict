import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram, } from "@solana/web3.js";
import BN from "bn.js";
import { encodeString, formatMarket } from "./utils/helpers";
import { getConfigPDA, getMarketPDA, getPositionAccountPDA, getSubPositionAccountPDA, } from "./utils/pda/index";
import sendVersionedTransaction from "./utils/sendVersionedTransaction";
import { swap } from "./utils/swap";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createInitializeMint2Instruction, getAssociatedTokenAddressSync, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID, } from "@solana/spl-token";
import { USDC_DECIMALS, METAPLEX_ID, } from "./utils/constants";
import Position from "./position";
export default class Trade {
    constructor(program, adminKey, feeVault, usdcMint) {
        this.program = program;
        this.decimals = USDC_DECIMALS;
        this.ADMIN_KEY = adminKey;
        this.FEE_VAULT = feeVault;
        this.USDC_MINT = usdcMint;
        this.position = new Position(this.program);
    }
    /**
     * Get All Markets
     *
     */
    async getAllMarkets() {
        const marketV2 = await this.program.account.marketState.all();
        return marketV2.map(({ account, publicKey }) => formatMarket(account, publicKey));
    }
    /**
     * Get Market By ID
     * @param marketId - The ID of the market
     *
     */
    async getMarketById(marketId) {
        const marketPDA = getMarketPDA(this.program.programId, marketId);
        const response = await this.program.account.marketState.fetch(marketPDA);
        return formatMarket(response, marketPDA);
    }
    /**
     * Get Market By Address
     * @param address - The address of the market PDA
     *
     */
    async getMarketByAddress(address) {
        const account = await this.program.account.marketState.fetch(address);
        return formatMarket(account, address);
    }
    /**
     * Create Market
     * @param args.marketId - new markert id - length + 1
     * @param args.startTime - start time
     * @param args.endTime - end time
     * @param args.question - question (max 80 characters)
     * @param args.oraclePubkey - oracle pubkey
     * @param args.metadataUri - metadata uri
     * @param args.payer - payer
     * @param options - RPC options
     *
     */
    async createMarket({ startTime, endTime, question, oraclePubkey, metadataUri, payer, }, options) {
        if (question.length > 80) {
            throw new Error("Question must be less than 80 characters");
        }
        const ixs = [];
        const [configPDA] = PublicKey.findProgramAddressSync([Buffer.from("config")], this.program.programId);
        const configAccount = await this.program.account.config.fetch(configPDA);
        const marketId = configAccount.numMarkets;
        const marketIdBN = new BN(marketId);
        const [marketPDA] = PublicKey.findProgramAddressSync([Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)], this.program.programId);
        const [collectionPda] = PublicKey.findProgramAddressSync([Buffer.from("collection")], this.program.programId);
        console.log("Collection PDA:", collectionPda.toString());
        // Create a new keypair for the collection mint
        const collectionMintKeypair = Keypair.generate();
        console.log("Collection Mint:", collectionMintKeypair.publicKey.toString());
        const createAccountInstruction = SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: collectionMintKeypair.publicKey,
            space: MINT_SIZE,
            lamports: await getMinimumBalanceForRentExemptMint(this.program.provider.connection),
            programId: TOKEN_PROGRAM_ID
        });
        const initMintInstruction = createInitializeMint2Instruction(collectionMintKeypair.publicKey, 1, payer, payer, TOKEN_PROGRAM_ID);
        // Initialize the collection mint using SPL Token program
        console.log("Add collection mint account instructions to transaction");
        ixs.push(createAccountInstruction);
        ixs.push(initMintInstruction);
        const [collectionMetadataPda] = PublicKey.findProgramAddressSync([
            Buffer.from("metadata"),
            new PublicKey(METAPLEX_ID).toBuffer(),
            collectionMintKeypair.publicKey.toBuffer(),
        ], new PublicKey(METAPLEX_ID));
        console.log("Collection Metadata PDA:", collectionMetadataPda.toString());
        const [collectionMasterEditionPda] = PublicKey.findProgramAddressSync([
            Buffer.from("metadata"),
            new PublicKey(METAPLEX_ID).toBuffer(),
            collectionMintKeypair.publicKey.toBuffer(),
            Buffer.from("edition"),
        ], new PublicKey(METAPLEX_ID));
        ixs.push(await this.program.methods
            .createMarket({
            question: encodeString(question, 80),
            marketStart: new BN(startTime),
            marketEnd: new BN(endTime),
            metadataUri: metadataUri,
        })
            .accountsPartial({
            signer: payer,
            feeVault: this.FEE_VAULT,
            config: configPDA,
            oraclePubkey: oraclePubkey,
            market: marketPDA,
            usdcMint: this.USDC_MINT,
            nftCollectionMint: collectionMintKeypair.publicKey,
            nftCollectionMetadata: collectionMetadataPda,
            nftCollectionMasterEdition: collectionMasterEditionPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenMetadataProgram: METAPLEX_ID,
        })
            .instruction());
        return ixs;
        return sendVersionedTransaction(this.program, ixs, options);
    }
    /**
     * Open Order
     * @param args.marketId - The ID of the Market
     * @param args.amount - The amount of the Order
     * @param args.direction - The direction of the Order
     * @param args.mint - The mint of the Order
     * @param args.token - The token to use for the Order
     * @param args.payer - The payer of the Order
     * @param options - RPC options
     *
     */
    async openPosition({ marketId, amount, direction, mint, token, payer }, options) {
        const ixs = [];
        const addressLookupTableAccounts = [];
        const { positionAccountPDA, ixs: positionAccountIxs } = await this.position.getPositionAccountIxs(marketId);
        const marketPDA = getMarketPDA(this.program.programId, marketId);
        const configPDA = getConfigPDA(this.program.programId);
        if (positionAccountIxs.length > 0) {
            ixs.push(...positionAccountIxs);
        }
        let amountInTRD = amount * 10 ** USDC_DECIMALS;
        if (token !== this.USDC_MINT.toBase58()) {
            const { setupInstructions, swapIxs, addressLookupTableAccounts: swapAddressLookupTableAccounts, usdcAmount, } = await swap({
                connection: this.program.provider.connection,
                wallet: payer.toBase58(),
                inToken: token,
                amount,
                usdcMint: this.USDC_MINT.toBase58(),
            });
            amountInTRD = usdcAmount;
            if (swapIxs.length === 0) {
                return;
            }
            ixs.push(...setupInstructions);
            ixs.push(...swapIxs);
            addressLookupTableAccounts.push(...swapAddressLookupTableAccounts);
        }
        ixs.push(await this.program.methods
            .createPosition({
            amount: new BN(amountInTRD),
            direction: direction,
        })
            .accountsPartial({
            signer: payer,
            feeVault: this.FEE_VAULT,
            marketPositionsAccount: positionAccountPDA,
            market: marketPDA,
            usdcMint: mint,
            config: configPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
            .instruction());
        return { ixs, addressLookupTableAccounts };
        return sendVersionedTransaction(this.program, ixs, options, addressLookupTableAccounts);
    }
    /**
     * Resolve Market
     * @param args.marketId - The ID of the Market
     * @param args.winningDirection - The Winning Direction of the Market
     *
     * @param options - RPC options
     *
     */
    async resolveMarket({ marketId, winningDirection, payer, }, options) {
        const marketIdBN = new BN(marketId);
        const [marketPDA] = PublicKey.findProgramAddressSync([Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)], this.program.programId);
        const ixs = [];
        ixs.push(await this.program.methods
            .resolveMarket({
            marketId: marketIdBN,
            winningDirection: winningDirection,
        })
            .accountsPartial({
            signer: payer,
            market: marketPDA,
        })
            .instruction());
        return ixs;
        return sendVersionedTransaction(this.program, ixs, options);
    }
    /**
     * Collect Remaining Liquidity
     * @param marketId - The ID of the market
     * @param payer - The payer of the Market
     * @param options - RPC options
     *
     */
    async closeMarket(marketId, payer, options) {
        try {
            console.log("entered close market");
            const ixs = [];
            const marketIdBN = new BN(marketId);
            const [marketPDA] = PublicKey.findProgramAddressSync([Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)], this.program.programId);
            console.log("marketPDA", marketPDA.toBase58());
            ixs.push(await this.program.methods
                .closeMarket({
                marketId: marketIdBN,
            })
                .accountsPartial({
                signer: payer,
                feeVault: this.FEE_VAULT,
                market: marketPDA,
                usdcMint: this.USDC_MINT,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
                .instruction());
            return ixs;
        }
        catch (error) {
            console.log("error", error);
            throw error;
        }
    }
    /**
     * Payout Order
     * @param args.marketId - The ID of the Market
     * @param args.orderId - The ID of the Order to Payout
     * @param args.userNonce - The nonce of the user
     *
     * @param options - RPC options
     *
     */
    async payoutOrder(orders, payer, options) {
        const ixs = [];
        const [configPDA] = PublicKey.findProgramAddressSync([Buffer.from("config")], this.program.programId);
        const marketIdBN = new BN(orders[0].marketId);
        const [marketPDA] = PublicKey.findProgramAddressSync([Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)], this.program.programId);
        if (orders.length > 10) {
            throw new Error("Max 10 orders per transaction");
        }
        for (const order of orders) {
            let positionAccountPDA = getPositionAccountPDA(this.program.programId, order.marketId);
            if (order.userNonce !== 0) {
                const marketAddress = PublicKey.findProgramAddressSync([
                    Buffer.from("market"),
                    new BN(order.marketId).toArrayLike(Buffer, "le", 8),
                ], this.program.programId)[0];
                const subPositionAccountPDA = getSubPositionAccountPDA(this.program.programId, order.marketId, marketAddress, order.userNonce);
                positionAccountPDA = getPositionAccountPDA(this.program.programId, order.marketId, subPositionAccountPDA);
            }
            ixs.push(await this.program.methods
                .settlePosition(new BN(order.orderId))
                .accountsPartial({
                signer: payer,
                feeVault: this.FEE_VAULT,
                marketPositionsAccount: positionAccountPDA,
                market: marketPDA,
                usdcMint: this.USDC_MINT,
                config: configPDA,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
                .instruction());
        }
        return ixs;
        return sendVersionedTransaction(this.program, ixs, options);
    }
    /**
     * Update Market
     * @param marketId - The ID of the market
     * @param marketEnd - The end time of the market
     * @param options - RPC options
     *
     */
    async updateMarket(marketId, marketEnd, payer, options) {
        const ixs = [];
        ixs.push(await this.program.methods
            .updateMarket({
            marketId: new BN(marketId),
            marketEnd: new BN(marketEnd),
        })
            .accounts({
            signer: payer,
            market: getMarketPDA(this.program.programId, marketId),
        })
            .instruction());
        return ixs;
        return sendVersionedTransaction(this.program, ixs, options);
    }
    async payoutNft(nftPositions, payer, options) {
        const ixs = [];
        const marketIdBN = new BN(nftPositions[0].marketId);
        const [marketPda] = PublicKey.findProgramAddressSync([Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)], this.program.programId);
        const userUsdcAta = getAssociatedTokenAddressSync(this.USDC_MINT, payer, false, TOKEN_PROGRAM_ID);
        const marketVault = getAssociatedTokenAddressSync(this.USDC_MINT, marketPda, true, // allowOwnerOffCurve since marketPda is a PDA
        TOKEN_PROGRAM_ID);
        for (const position of nftPositions) {
            if (position.marketId !== marketIdBN.toNumber()) {
                throw new Error("Market ID mismatch");
            }
            let positionAccountPDA = getPositionAccountPDA(this.program.programId, position.marketId);
            if (position.positionNonce !== 0) {
                const marketAddress = PublicKey.findProgramAddressSync([
                    Buffer.from("market"),
                    new BN(position.marketId).toArrayLike(Buffer, "le", 8),
                ], this.program.programId)[0];
                const subPositionAccountPDA = getSubPositionAccountPDA(this.program.programId, position.marketId, marketAddress, position.positionNonce);
                positionAccountPDA = getPositionAccountPDA(this.program.programId, position.marketId, subPositionAccountPDA);
            }
            ixs.push(await this.program.methods
                .settleNftPosition({
                positionId: new BN(position.positionId),
                marketId: marketIdBN,
                amount: new BN(position.amount),
                direction: position.direction,
            })
                .accountsPartial({
                signer: payer,
                marketPositionsAccount: positionAccountPDA,
                nftMint: position.nftMint,
                userNftTokenAccount: position.nftTokenAccount,
                userUsdcAta: userUsdcAta,
                marketUsdcVault: marketVault,
                usdcMint: this.USDC_MINT,
                nftMetadataAccount: position.nftMetadata,
                nftMasterEditionAccount: position.nftMasterEdition,
                market: marketPda,
                tokenProgram: TOKEN_PROGRAM_ID,
                tokenMetadataProgram: METAPLEX_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
                .instruction());
        }
        return ixs;
        return sendVersionedTransaction(this.program, ixs, options);
    }
}
