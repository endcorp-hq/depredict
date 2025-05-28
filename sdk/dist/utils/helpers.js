import { OrderDirection, OrderStatus, WinningDirection } from '../types/trade';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
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
        marketState: getMarketState(account.marketState),
        updateTs: account.updateTs.toString(),
        nextOrderId: account.nextOrderId.toString(),
        marketStart: account.marketStart.toString(),
        marketEnd: account.marketEnd.toString(),
        question: Buffer.from(account.question).toString().replace(/\0+$/, ''),
        winningDirection: getWinningDirection(account.winningDirection),
    };
};
export const formatUserTrade = (account, publicKey) => {
    return {
        user: publicKey.toString(),
        totalDeposits: account.totalDeposits.toString(),
        totalWithdraws: account.totalWithdraws.toString(),
        orders: account.orders.map((order) => formatOrder(order, account.authority.toString())),
        nonce: account.nonce.toString(),
        isSubUser: account.isSubUser
    };
};
export const formatOrder = (order, authority) => {
    return {
        ts: order.ts.toString(),
        authority: authority ? authority : '',
        userNonce: order.userNonce.toString(),
        createdAt: order.createdAt ? order.createdAt.toString() : '',
        orderId: order.orderId.toString(),
        marketId: order.marketId.toString(),
        orderStatus: getOrderStatus(order.orderStatus),
        orderDirection: getOrderDirection(order.orderDirection),
        price: order.price.toString(),
        version: order.version.toString(),
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
export const getOrderDirection = (direction) => {
    if (Object.keys(direction)[0] === 'yes') {
        return OrderDirection.YES;
    }
    return OrderDirection.NO;
};
export const getOrderStatus = (status) => {
    let currentStatus = Object.keys(status)[0];
    switch (currentStatus) {
        case 'init':
            return OrderStatus.INIT;
        case 'open':
            return OrderStatus.OPEN;
        case 'closed':
            return OrderStatus.CLOSED;
        case 'claimed':
            return OrderStatus.CLAIMED;
        case 'liquidated':
            return OrderStatus.LIQUIDATED;
        case 'waiting':
            return OrderStatus.WAITING;
        default:
            throw new Error('Invalid order status');
    }
};
