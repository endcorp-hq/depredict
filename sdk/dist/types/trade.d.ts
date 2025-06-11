import { PublicKey } from '@solana/web3.js';
export type Market = {
    address: string;
    bump: number;
    authority: string;
    oraclePubkey: string;
    nftCollectionMint: string;
    nftCollectionMetadata: string;
    nftCollectionMasterEdition: string;
    marketUsdcVault: string;
    marketId: string;
    yesLiquidity: string;
    noLiquidity: string;
    volume: string;
    updateTs: string;
    nextPositionId: string;
    marketState: MarketStates;
    marketStart: string;
    marketEnd: string;
    question: string;
    winningDirection: WinningDirection;
};
export type FilteredMarket = {
    address: string;
    bump: number;
    authority: string;
    oraclePubkey: string;
    nftCollectionMint: string;
    nftCollectionMetadata: string;
    nftCollectionMasterEdition: string;
    marketUsdcVault: string;
    marketId: string;
    yesLiquidity: string;
    noLiquidity: string;
    volume: string;
    updateTs: string;
    nextPositionId: string;
    marketState: string;
    marketStart: string;
    marketEnd: string;
    question: string;
    winningDirection: string;
};
export type MarketStates = {
    active: {};
} | {
    ended: {};
} | {
    resolving: {};
} | {
    resolved: {};
};
export declare enum WinningDirection {
    NONE = "None",
    YES = "Yes",
    NO = "No",
    DRAW = "Draw"
}
export type InitializeMarketArgs = {
    marketId: number;
    startTime: number;
    endTime: number;
    question: string;
    feeBps: number;
    customer: PublicKey | null;
};
export type CreateCustomerArgs = {
    id: number;
    name: string;
    authority: PublicKey;
    feeRecipient: PublicKey;
};
export type OpenOrderArgs = {
    marketId: number;
    amount: number;
    token: string;
    direction: {
        yes: {};
    } | {
        no: {};
    };
    mint: PublicKey;
    payer: PublicKey;
    feeVaultAccount: PublicKey;
    usdcMintAddress: PublicKey;
};
export type CreateMarketArgs = {
    marketId: number;
    startTime: number;
    endTime: number;
    question: string;
    oraclePubkey: PublicKey;
    metadataUri: string;
    payer: PublicKey;
    feeVaultAccount: PublicKey;
    usdcMintAddress: PublicKey;
};
