import { BN } from "@coral-xyz/anchor";
import { formatPositionAccount } from "./utils/helpers";
import { Keypair, PublicKey, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, } from "@solana/web3.js";
import sendVersionedTransaction from "./utils/sendVersionedTransaction";
import { getPositionAccountPDA, getSubPositionAccountPDA } from "./utils/pda";
import { PositionStatus } from "./types/position";
import { METAPLEX_ID } from "./utils/constants";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
export default class Position {
    constructor(program) {
        this.program = program;
        this.METAPLEX_PROGRAM_ID = new PublicKey(METAPLEX_ID);
    }
    /**
     * Get all Position Accounts for a Market
     * @param marketId - Market ID
     *
     */
    async getPositionAccountsForMarket(marketId) {
        const response = await this.program.account.positionAccount.all([
            {
                memcmp: {
                    offset: 8 + 1,
                    bytes: marketId.toString(),
                },
            },
        ]);
        return response.map(({ account }) => formatPositionAccount(account, marketId));
    }
    /**
     * Get User positions for a market
     * @param user - User PublicKey
     *
     */
    async getUserPositions(user, marketId) {
        const positionAccounts = await this.getPositionAccountsForMarket(marketId);
        const positions = positionAccounts.flatMap((positionAccount) => positionAccount.positions);
        return positions.filter((position) => position.authority === user.toBase58());
    }
    /**
     * Get the PDA for a position account
     * @param marketId - Market ID
     * @param marketAddress - Market Address
     * @param positionNonce - The nonce of the position account
     *
     */
    async getPositionsAccountPda(marketId, positionNonce = 0) {
        let positionAccountPDA = getPositionAccountPDA(this.program.programId, marketId);
        if (positionNonce !== 0) {
            const marketAddress = PublicKey.findProgramAddressSync([Buffer.from("market"), new BN(marketId).toArrayLike(Buffer, "le", 8)], this.program.programId)[0];
            const subPositionAccountPDA = getSubPositionAccountPDA(this.program.programId, marketId, marketAddress, positionNonce);
            positionAccountPDA = getPositionAccountPDA(this.program.programId, marketId, subPositionAccountPDA);
        }
        return this.program.account.positionAccount.fetch(positionAccountPDA);
    }
    /**
     * Create Sub positions account
     * @param user - User PublicKey the main user
     * @param payer - Payer PublicKey
     * @param options - RPC options
     *
     */
    async createSubPositionAccount(marketId, payer, marketAddress, options) {
        const ixs = [];
        const positionAccount = await this.getPositionsAccountPda(marketId);
        const subPositionAccountPDA = getSubPositionAccountPDA(this.program.programId, marketId, marketAddress, positionAccount.nonce + 1);
        const marketPositionsAccount = getPositionAccountPDA(this.program.programId, marketId);
        ixs.push(await this.program.methods
            .createSubPositionAccount(subPositionAccountPDA)
            .accountsPartial({
            signer: payer,
            market: marketAddress,
            marketPositionsAccount: marketPositionsAccount,
            subMarketPositions: subPositionAccountPDA,
            systemProgram: SystemProgram.programId,
        })
            .instruction());
        return ixs;
        return sendVersionedTransaction(this.program, ixs, options);
    }
    /**
     * Get position account Nonce With Slots
     * @param positionAccounts - Position Accounts
     *
     */
    getPositionAccountNonceWithSlots(positionAccounts) {
        const payer = this.program.provider.publicKey;
        const marketId = Number(positionAccounts[0].marketId);
        const marketAddress = PublicKey.findProgramAddressSync([Buffer.from("market"), new BN(marketId).toArrayLike(Buffer, "le", 8)], this.program.programId)[0];
        if (!payer) {
            throw new Error("Payer public key is not available. Wallet might not be connected.");
        }
        let nonce = null;
        for (const positionAccount of positionAccounts.reverse()) {
            if (nonce !== null) {
                break;
            }
            let freeSlots = 0;
            positionAccount.positions.forEach((position) => {
                if (nonce !== null) {
                    return;
                }
                if (position.positionStatus !== PositionStatus.OPEN &&
                    position.positionStatus !== PositionStatus.WAITING &&
                    freeSlots >= 2) {
                    nonce = positionAccount.isSubPosition
                        ? Number(positionAccount.nonce)
                        : 0;
                }
                if (position.positionStatus !== PositionStatus.OPEN &&
                    position.positionStatus !== PositionStatus.WAITING) {
                    freeSlots += 1;
                }
            });
        }
        if (nonce === null) {
            throw new Error("No open orders found");
        }
        if (nonce === 0) {
            return getPositionAccountPDA(this.program.programId, Number(marketId));
        }
        const subPositionAccountPDA = getSubPositionAccountPDA(this.program.programId, Number(marketId), marketAddress, nonce);
        const positionAccountPDA = getPositionAccountPDA(this.program.programId, Number(marketId), subPositionAccountPDA);
        return positionAccountPDA;
    }
    async getPositionAccountIxs(marketId) {
        const payer = this.program.provider.publicKey;
        if (!payer) {
            throw new Error("Payer public key is not available. Wallet might not be connected.");
        }
        let marketAddress = PublicKey.findProgramAddressSync([Buffer.from("market"), new BN(marketId).toArrayLike(Buffer, "le", 8)], this.program.programId)[0];
        const marketPositionsAccount = getPositionAccountPDA(this.program.programId, marketId);
        const ixs = [];
        let positionAccounts = [];
        positionAccounts = await this.getPositionAccountsForMarket(marketId);
        if (positionAccounts.length === 0) {
            throw new Error("No position accounts found for this market. Something went wrong.");
        }
        try {
            const positionAccountPDA = this.getPositionAccountNonceWithSlots(positionAccounts);
            return { positionAccountPDA, ixs };
        }
        catch {
            const mainPositionAccount = positionAccounts.find((positionAccount) => !positionAccount.isSubPosition);
            if (!mainPositionAccount) {
                throw new Error("Main position account not found. Cannot determine next sub-position nonce.");
            }
            const subPositionAccountPDA = getSubPositionAccountPDA(this.program.programId, marketId, marketAddress, Number(mainPositionAccount.nonce) + 1);
            ixs.push(await this.program.methods
                .createSubPositionAccount(subPositionAccountPDA)
                .accountsPartial({
                signer: payer,
                market: marketAddress,
                marketPositionsAccount: marketPositionsAccount,
                subMarketPositions: subPositionAccountPDA,
                systemProgram: SystemProgram.programId,
            })
                .instruction());
            return {
                positionAccountPDA: getPositionAccountPDA(this.program.programId, marketId, subPositionAccountPDA),
                ixs,
            };
        }
    }
    async mintExistingPosition(marketId, positionId, positionNonce, payer, metadataUri, collectionAuthority, options) {
        const ixs = [];
        const marketIdBN = new BN(marketId);
        const [marketPDA] = PublicKey.findProgramAddressSync([Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)], this.program.programId);
        let positionAccountPDA = getPositionAccountPDA(this.program.programId, marketId);
        if (positionNonce !== 0) {
            const marketAddress = PublicKey.findProgramAddressSync([
                Buffer.from("market"),
                marketIdBN.toArrayLike(Buffer, "le", 8),
            ], this.program.programId)[0];
            const subPositionAccountPDA = getSubPositionAccountPDA(this.program.programId, marketId, marketAddress, positionNonce);
            positionAccountPDA = getPositionAccountPDA(this.program.programId, marketId, subPositionAccountPDA);
        }
        const marketAccount = await this.program.account.marketState.fetch(marketPDA);
        const nftMintKeypair = Keypair.generate();
        console.log("NFT Mint:", nftMintKeypair.publicKey.toString());
        // Get the NFT metadata PDA
        const [nftMetadataPda] = PublicKey.findProgramAddressSync([
            Buffer.from("metadata"),
            this.METAPLEX_PROGRAM_ID.toBuffer(),
            nftMintKeypair.publicKey.toBuffer(),
        ], this.METAPLEX_PROGRAM_ID);
        console.log("NFT Metadata PDA:", nftMetadataPda.toString());
        // Get the NFT master edition PDA
        const [nftMasterEditionPda] = PublicKey.findProgramAddressSync([
            Buffer.from("metadata"),
            this.METAPLEX_PROGRAM_ID.toBuffer(),
            nftMintKeypair.publicKey.toBuffer(),
            Buffer.from("edition"),
        ], this.METAPLEX_PROGRAM_ID);
        console.log("NFT Master Edition PDA:", nftMasterEditionPda.toString());
        // Create the user's NFT token account using ATA program
        console.log("Creating NFT token account...");
        const nftTokenAccount = getAssociatedTokenAddressSync(nftMintKeypair.publicKey, payer, // Create token account for admin since they own the position
        false, // allowOwnerOffCurve
        TOKEN_PROGRAM_ID);
        console.log("NFT Token Account:", nftTokenAccount.toString());
        if (!marketAccount.nftCollectionMint || !marketAccount.nftCollectionMetadata || !marketAccount.nftCollectionMasterEdition) {
            throw new Error("Market account does not have a collection mint, metadata, or master edition");
        }
        ixs.push(await this.program.methods.mintPosition({
            positionId: new BN(positionId),
            metadataUri: metadataUri,
        })
            .accountsPartial({
            signer: payer,
            market: marketPDA,
            marketPositionsAccount: positionAccountPDA,
            nftMint: nftMintKeypair.publicKey,
            nftTokenAccount: nftTokenAccount,
            metadataAccount: nftMetadataPda,
            masterEdition: nftMasterEditionPda,
            collectionMint: marketAccount.nftCollectionMint,
            collectionMetadata: marketAccount.nftCollectionMetadata,
            collectionMasterEdition: marketAccount.nftCollectionMasterEdition,
            collectionAuthority: collectionAuthority, //needs to be the same as market creator and needs to sign.
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: this.METAPLEX_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        }).instruction());
    }
}
