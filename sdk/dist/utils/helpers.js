import { WinningDirection } from '../types/trade';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PositionDirection, PositionStatus } from '../types/position';
export const encodeString = (value, alloc = 32) => {
    const buffer = Buffer.alloc(alloc, 32);
    buffer.write(value);
    return Array(...buffer);
};
export const decodeString = (bytes) => {
    const buffer = Buffer.from(bytes);
    return buffer.toString('utf8').trim();
};
export const formatMarket = (account, address) => {
    return {
        bump: account.bump,
        address: address.toString(),
        authority: account.authority.toString(),
        marketId: account.marketId.toString(),
        yesLiquidity: account.yesLiquidity.toString(),
        noLiquidity: account.noLiquidity.toString(),
        volume: account.volume.toString(),
        oraclePubkey: account.oraclePubkey ? account.oraclePubkey.toString() : '',
        nftCollectionMint: account.nftCollectionMint ? account.nftCollectionMint.toString() : '',
        nftCollectionMetadata: account.nftCollectionMetadata ? account.nftCollectionMetadata.toString() : '',
        nftCollectionMasterEdition: account.nftCollectionMasterEdition ? account.nftCollectionMasterEdition.toString() : '',
        marketUsdcVault: account.marketUsdcVault ? account.marketUsdcVault.toString() : '',
        marketState: getMarketState(account.marketState),
        updateTs: account.updateTs.toString(),
        nextPositionId: account.nextPositionId.toString(),
        marketStart: account.marketStart.toString(),
        marketEnd: account.marketEnd.toString(),
        question: Buffer.from(account.question).toString().replace(/\0+$/, ''),
        winningDirection: getWinningDirection(account.winningDirection),
    };
};
export const formatPositionAccount = (account, marketId) => {
    return {
        authority: account.authority,
        marketId: marketId,
        positions: account.positions.map((position) => formatPosition(position, account.authority.toString())),
        nonce: account.nonce,
        isSubPosition: account.isSubPosition
    };
};
export const formatPosition = (position, authority) => {
    return {
        ts: position.ts.toString(),
        authority: authority ? authority : '',
        positionNonce: position.positionNonce.toString(),
        createdAt: position.createdAt ? position.createdAt.toString() : '',
        positionId: position.positionId.toString(),
        marketId: position.marketId.toString(),
        isNft: position.isNft,
        mint: position.mint ? position.mint.toString() : '',
        positionStatus: getPositionStatus(position.positionStatus),
        direction: getPositionDirection(position.direction),
        amount: position.amount.toString(),
    };
};
export const getMarketState = (status) => {
    const currentStatus = Object.keys(status)[0];
    return currentStatus;
};
export const getWinningDirection = (direction) => {
    const key = Object.keys(direction)[0];
    switch (key) {
        case 'yes':
            return WinningDirection.YES;
        case 'no':
            return WinningDirection.NO;
        case 'none':
            return WinningDirection.NONE;
        default:
            const upperKey = key.toUpperCase();
            if (upperKey in WinningDirection) {
                return WinningDirection[upperKey];
            }
            throw new Error(`Invalid winning direction variant: ${key}`);
    }
};
export const getTokenProgram = (mint) => {
    return TOKEN_PROGRAM_ID;
};
export const getPositionDirection = (direction) => {
    if (Object.keys(direction)[0] === 'yes') {
        return PositionDirection.YES;
    }
    return PositionDirection.NO;
};
export const getPositionStatus = (status) => {
    let currentStatus = Object.keys(status)[0];
    switch (currentStatus) {
        case 'init':
            return PositionStatus.INIT;
        case 'open':
            return PositionStatus.OPEN;
        case 'closed':
            return PositionStatus.CLOSED;
        case 'claimed':
            return PositionStatus.CLAIMED;
        case 'liquidated':
            return PositionStatus.LIQUIDATED;
        case 'waiting':
            return PositionStatus.WAITING;
        default:
            throw new Error('Invalid order status');
    }
};
