import { BN } from "@coral-xyz/anchor";
import { formatPositionAccount } from "./utils/helpers";
import { PublicKey, SystemProgram, } from "@solana/web3.js";
import { getMarketPDA, getPositionAccountPDA, getSubPositionAccountPDA, } from "./utils/pda";
import { PositionStatus } from "./types/position";
import { METAPLEX_ID } from "./utils/constants";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
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
    async getPositionsAccountsForMarket(marketId) {
        const allAccounts = await this.program.account.positionAccount.all();
        console.log("SDK: All position accounts for user for market:", allAccounts.map((acc) => ({
            marketId: acc.account.marketId,
            authority: acc.account.authority.toString(),
            // log other fields you want to see
        })));
        // Then try the filtered query
        const response = await this.program.account.positionAccount.all([
            {
                memcmp: {
                    offset: 8 + 1,
                    bytes: bs58.encode(new BN(marketId).toArray("le", 8)),
                },
            },
        ]);
        return response.map(({ account }) => formatPositionAccount(account, marketId));
    }
    /**
     * Get all Positions for a user
     * @param user - User PublicKey
     *
     */
    // async getPositionsForUser(user: PublicKey) {
    //   // Then try the filtered query
    //   const allAccounts = await this.program.account.positionAccount.all();
    //   const formattedPositionAccounts = allAccounts.map(({ account }) =>
    //     formatPositionAccount(account)
    //   );
    //   const positions = formattedPositionAccounts.flatMap(
    //     (positionAccount) => positionAccount.positions
    //   );
    //   const userPositions = positions.filter(
    //     (position) => position.authority === user.toBase58()
    //   );
    //   return userPositions;
    // }
    /**
     * Get User positions for a particular market
     * @param user - User PublicKey
     * @param marketId - Market ID
     */
    // async getUserPositionsForMarket(user: PublicKey, marketId: number) {
    //   const positionAccounts = await this.getPositionsAccountsForMarket(marketId);
    //   const positions = positionAccounts.flatMap(
    //     (positionAccount) => positionAccount.positions
    //   );
    //   return positions.filter(
    //     (position) => position.authority === user.toBase58()
    //   );
    // }
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
            const marketAddress = getMarketPDA(this.program.programId, marketId);
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
        try {
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
        }
        catch (error) {
            console.log("error", error);
            throw error;
        }
        return ixs;
    }
    /**
     * Get position account Nonce With Slots
     * @param positionAccounts - Position Accounts
     *
     */
    getPositionAccountNonceWithSlots(positionAccounts, payer) {
        const marketId = Number(positionAccounts[0].marketId);
        const marketAddress = getMarketPDA(this.program.programId, marketId);
        if (!payer) {
            throw new Error("Payer public key is not available. Wallet might not be connected.");
        }
        let nonce = null;
        for (const positionAccount of positionAccounts.reverse()) {
            if (nonce !== null) {
                break;
            }
            console.log("SDK: positionAccount", positionAccount);
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
        console.log("SDK: nonce", nonce);
        const subPositionAccountPDA = getSubPositionAccountPDA(this.program.programId, Number(marketId), marketAddress, nonce);
        const positionAccountPDA = getPositionAccountPDA(this.program.programId, Number(marketId), subPositionAccountPDA);
        return positionAccountPDA;
    }
    async getPositionAccountIxs(marketId, payer) {
        if (!payer) {
            throw new Error("Payer public key is not available. Wallet might not be connected.");
        }
        let marketAddress = getMarketPDA(this.program.programId, marketId);
        const marketPositionsAccount = getPositionAccountPDA(this.program.programId, marketId);
        console.log("SDK: marketPositionsAccount from positions", marketPositionsAccount.toString());
        const ixs = [];
        let positionAccounts = [];
        positionAccounts = await this.getPositionsAccountsForMarket(marketId);
        console.log("SDK: initial positionAccounts", positionAccounts);
        if (positionAccounts.length === 0) {
            throw new Error("No position accounts found for this market. Something went wrong.");
        }
        try {
            const positionAccountWithSlots = this.getPositionAccountNonceWithSlots(positionAccounts, payer);
            console.log("SDK: returned positionAccountPDA", positionAccountWithSlots);
            return { positionAccountPDA: positionAccountWithSlots, ixs };
        }
        catch {
            const mainPositionAccount = positionAccounts.find((positionAccount) => !positionAccount.isSubPosition);
            if (!mainPositionAccount) {
                throw new Error("Main position account not found. Cannot determine next sub-position nonce.");
            }
            const subPositionAccountKey = getSubPositionAccountPDA(this.program.programId, marketId, marketAddress, Number(mainPositionAccount.nonce) + 1);
            console.log("SDK: subPositionAccountKey", subPositionAccountKey.toString());
            const subPositionAccountPDA = getPositionAccountPDA(this.program.programId, marketId, subPositionAccountKey);
            console.log("SDK: subPositionAccountPDA", subPositionAccountPDA.toString());
            ixs.push(await this.program.methods
                .createSubPositionAccount(subPositionAccountKey)
                .accountsPartial({
                signer: payer,
                market: marketAddress,
                marketPositionsAccount: marketPositionsAccount,
                subMarketPositions: subPositionAccountPDA,
                systemProgram: SystemProgram.programId,
            })
                .instruction());
            return {
                positionAccountPDA: subPositionAccountPDA,
                ixs,
            };
        }
    }
}
