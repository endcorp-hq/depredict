import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "./types/shortx";
import * as anchor from "@coral-xyz/anchor";
import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  CreateMarketArgs,
  OpenOrderArgs,
  UserTrade,
  CreateCustomerArgs,
  OrderStatus,
  MarketStates,
} from "./types/trade";
import { RpcOptions } from "./types/index";
import BN from "bn.js";
import {
  encodeString,
  formatMarket,
  formatUserTrade,
} from "./utils/helpers";
import {
    getConfigPDA,
  getMarketPDA,
  getSubUserTradePDA,
  getUserTradePDA,
} from "./utils/pda/index";
import sendVersionedTransaction from "./utils/sendVersionedTransaction";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { swap } from "./utils/swap";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { ADMIN_KEY, FEE_VAULT, USDC_MINT, USDC_DECIMALS } from "./utils/constants";

export default class Trade {
  decimals: number = USDC_DECIMALS;

  constructor(private program: Program<ShortxContract>) {}

  /**
   * Get All Markets
   *
   */
  async getAllMarkets() {
    const marketV2 = await this.program.account.marketState.all();

    return marketV2.map(({ account, publicKey }) =>
      formatMarket(account, publicKey)
    );
  }

  /**
   * Get My User Trades from a user authority
   * @param user - User PublicKey
   *
   */
  async getMyUserTrades(user: PublicKey) {
    const response = await this.program.account.userTrade.all([
      {
        memcmp: {
          offset: 8 + 1,
          bytes: user.toBase58(),
        },
      },
    ]);

    return response.map(({ account, publicKey }) =>
      formatUserTrade(account, publicKey)
    );
  }

  /**
   * Get User Orders
   * @param user - User PublicKey
   *
   */
  async getUserOrders(user: PublicKey) {
    const myUserTrades = await this.getMyUserTrades(user);

    return myUserTrades.flatMap((userTrade) => userTrade.orders);
  }

  /**
   * Get Market By ID
   * @param marketId - The ID of the market
   *
   */
  async getMarketById(marketId: number) {
    const marketPDA = getMarketPDA(this.program.programId, marketId);

    const response = await this.program.account.marketState.fetch(marketPDA);

    return formatMarket(response, marketPDA);
  }

  /**
   * Get Market By Address
   * @param address - The address of the market
   *
   */
  async getMarketByAddress(address: PublicKey) {
    const account = await this.program.account.marketState.fetch(address);

    return formatMarket(account, address);
  }

  /**
   * Get User Trade
   * @param user - User PublicKey
   * @param userNonce - The nonce of the user
   *
   */
  async getUserTrade(user: PublicKey, userNonce = 0) {
    let userTradePDA = getUserTradePDA(this.program.programId, user);

    if (userNonce !== 0) {
      const subUserTradePDA = getSubUserTradePDA(
        this.program.programId,
        user,
        userNonce
      );

      userTradePDA = getUserTradePDA(this.program.programId, subUserTradePDA);
    }

    return this.program.account.userTrade.fetch(userTradePDA);
  }

  /**
   * Create Market
   * @param args.marketId - new markert id - length + 1
   * @param args.startTime - start time
   * @param args.endTime - end time
   * @param args.question - question (max 80 characters)
   * @param args.liquidityAtStart - liquidity at start
   * @param args.payoutFee - payout fee (to add affiliate system)
   *
   * @param options - RPC options
   *
   */
  async createMarket(
    {
      marketId,
      startTime,
      endTime,
      question,
    }: CreateMarketArgs,
    options?: RpcOptions
  ) {
    if (question.length > 80) {
      throw new Error("Question must be less than 80 characters");
    }

    const ixs: TransactionInstruction[] = [];

    const marketIdBN = new BN(marketId);

    const [marketPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)],
        this.program.programId
      );


    ixs.push(
      await this.program.methods
        .createMarket({
          marketId: new BN(marketId),
          question: encodeString(question, 80),
          marketStart: new BN(startTime),
          marketEnd: new BN(endTime),
        })
        .accountsPartial({
          signer: new PublicKey(ADMIN_KEY),
          feeVault: new PublicKey(FEE_VAULT),
          market: marketPDA,
          usdcMint: new PublicKey(USDC_MINT),
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .instruction()
    );

    return sendVersionedTransaction(this.program, ixs, options);
  }

//   /**
//    * Create Pool
//    * @param poolId - The ID of the pool
//    * @param question - The question of the pool
//    * @param markets - The markets of the pool
//    *
//    * @param options - RPC options
//    */
//   async createPool(
//     {
//       poolId,
//       question,
//       markets,
//       mint,
//       customer,
//       startTime,
//       endTime,
//       feeBps,
//       payoutFee,
//     }: CreatePoolArgs,
//     options?: RpcOptions
//   ) {
//     if (question.length > 80) {
//       throw new Error("Pool question must be less than 80 characters");
//     }

//     const ixs: TransactionInstruction[] = [];

//     const poolPDA = getPoolPDA(this.program.programId, poolId);

//     ixs.push(
//       await this.program.methods
//         .createPool({
//           poolId: new BN(poolId),
//           question: encodeString(question, 80),
//         })
//         .accounts({
//           signer: this.program.provider.publicKey,
//         })
//         .instruction()
//     );

//     for (const market of markets) {
//       if (market.question.length > 80) {
//         throw new Error("Market question must be less than 80 characters");
//       }

//       ixs.push(
//         await this.program.methods
//           .createMarket({
//             marketId: new BN(market.marketId),
//             question: encodeString(market.question, 80),
//             marketStart: new BN(startTime),
//             marketEnd: new BN(endTime),
//             feeBps,
//             payoutFee,
//           })
//           .accounts({
//             signer: this.program.provider.publicKey,
//             mint,
//             tokenProgram: getTokenProgram(mint),
//             pool: poolPDA,
//             customer,
//           })
//           .instruction()
//       );
//     }

//     return sendVersionedTransaction(this.program, ixs, options);
//   }

  /**
   * Open Order
   * @param args.marketId - The ID of the Market
   * @param args.amount - The amount of the Order
   * @param args.direction - The direction of the Order
   * @param args.mint - The mint of the Order
   * @param args.token - The token to use for the Order
   *
   * @param options - RPC options
   *
   */
  async openOrder(
    { marketId, amount, direction, mint, token }: OpenOrderArgs,
    options?: RpcOptions
  ) {
    const payer = this.program.provider.publicKey;
    if (!payer) {
      throw new Error(
        "Payer public key is not available. Wallet might not be connected."
      );
    }

    const ixs: TransactionInstruction[] = [];
    const addressLookupTableAccounts: AddressLookupTableAccount[] = [];

    const { userTradePDA, ixs: userTradeIxs } = await this.getUserTradeIxs();
    const marketPDA = getMarketPDA(this.program.programId, marketId);
    const configPDA = getConfigPDA(this.program.programId);

    if (userTradeIxs.length > 0) {
      ixs.push(...userTradeIxs);
    }

    let amountInTRD = amount * 10 ** USDC_DECIMALS;

    if (token !== USDC_MINT) {
      const {
        setupInstructions,
        swapIxs,
        addressLookupTableAccounts: swapAddressLookupTableAccounts,
        usdcAmount,
      } = await swap({
        connection: this.program.provider.connection,
        wallet: payer.toBase58(),
        inToken: token,
        amount,
      });

      amountInTRD = usdcAmount;

      if (swapIxs.length === 0) {
        return;
      }

      ixs.push(...setupInstructions);
      ixs.push(...swapIxs);
      addressLookupTableAccounts.push(...swapAddressLookupTableAccounts);
    }

    ixs.push(
      await this.program.methods
        .createOrder({
          amount: new BN(amountInTRD),
          direction: direction,
        })
        .accountsPartial({
            signer: payer,
            feeVault: new PublicKey(FEE_VAULT),
            userTrade: userTradePDA,
            market: marketPDA,
            mint: mint,
            config: configPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
        .instruction()
    );

    return sendVersionedTransaction(
      this.program,
      ixs,
      options,
      addressLookupTableAccounts
    );
  }

  /**
   * Resolve Market
   * @param args.marketId - The ID of the Market
   * @param args.winningDirection - The Winning Direction of the Market
   *
   * @param options - RPC options
   *
   */
  async resolveMarket(
    {
      marketId,
      winningDirection,
      state,
    }: {
      marketId: number;
      winningDirection:
        | {
            yes: {};
          }
        | {
            no: {};
          }
        | {
            none: {};
          }
        | {
            draw: {};
          };
      state: MarketStates;
    },
    options?: RpcOptions
  ) {
    const marketIdBN = new BN(marketId);
    const [marketPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)],
        this.program.programId
      );

    const ixs: TransactionInstruction[] = [];

    ixs.push(
      await this.program.methods
        .updateMarket({
          marketId: marketIdBN,
          marketEnd: null,
          winningDirection,
          state: state,
        })
        .accountsPartial({
            signer: new PublicKey(ADMIN_KEY),
            market: marketPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
        .instruction()
    );

    return sendVersionedTransaction(this.program, ixs, options);
  }

  /**
   * Collect Remaining Liquidity
   * @param marketId - The ID of the market
   *
   * @param options - RPC options
   *
   */
  async closeMarket(marketId: number, options?: RpcOptions) {
    try{
    console.log('entered close market')
    const ixs: TransactionInstruction[] = [];

    const marketIdBN = new BN(marketId);

    const [marketPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)],
        this.program.programId
      );

    console.log('marketPDA', marketPDA.toBase58())

    ixs.push(
      await this.program.methods
        .closeMarket({
          marketId: marketIdBN,
        })
        .accountsPartial({
            signer: new PublicKey(ADMIN_KEY),
            feeVault: new PublicKey(FEE_VAULT),
            market: marketPDA,
            usdcMint: new PublicKey(USDC_MINT),
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .instruction()
    );

    return ixs;
  } catch (error) {
    console.log('error', error)
    throw error
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
  async payoutOrder(
    orders: {
      marketId: number;
      orderId: number;
      userNonce: number;
      mint: PublicKey;
    }[],
    options?: RpcOptions
  ) {
    const payer = this.program.provider.publicKey;
    if (!payer) {
      throw new Error(
        "Payer public key is not available. Wallet might not be connected."
      );
    }

    const ixs: TransactionInstruction[] = [];

    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      this.program.programId
    );

    const marketIdBN = new BN(orders[0].marketId);

    const [marketPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)],
        this.program.programId
      );

    if (orders.length > 10) {
      throw new Error("Max 10 orders per transaction");
    }

    for (const order of orders) {
      let userTradePDA = getUserTradePDA(
        this.program.programId,
        payer
      );

      if (order.userNonce !== 0) {
        const subUserTradePDA = getSubUserTradePDA(
          this.program.programId,
          payer,
          order.userNonce
        );

        userTradePDA = getUserTradePDA(this.program.programId, subUserTradePDA);
      }

      ixs.push(
        await this.program.methods
          .settleOrder(new BN(order.orderId))
          .accountsPartial({
            signer: payer,
            feeVault: new PublicKey(FEE_VAULT),
            userTrade: userTradePDA,
            market: marketPDA,
            mint: USDC_MINT,
            config: configPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          })
          .instruction()
      );
    }

    return sendVersionedTransaction(this.program, ixs, options);
  }

  /**
   * Allow Market to Payout
   * @param marketId - The ID of the market
   *
   * @param options - RPC options
   *
   */
  async allowMarketToPayout(marketId: number, options?: RpcOptions) {
    const ixs: TransactionInstruction[] = [];

    const marketIdBN = new BN(marketId);

    ixs.push(
      await this.program.methods
        .updateMarket({
          marketId: marketIdBN,
          marketEnd: null,
          winningDirection: null,
          state: { resolved: {} },
        })
        .accounts({
          signer: this.program.provider.publicKey,
          market: getMarketPDA(this.program.programId, marketId),
        })
        .instruction()
    );

    return sendVersionedTransaction(this.program, ixs, options);
  }

  /**
   * Create Sub User Trade
   * @param user - User PublicKey the main user
   *
   * @param options - RPC options
   *
   */
  async createSubUserTrade(user: PublicKey, options?: RpcOptions) {
    const ixs: TransactionInstruction[] = [];

    const userTrade = await this.getUserTrade(user);

    const subUserTradePDA = getSubUserTradePDA(
      this.program.programId,
      user,
      userTrade.nonce + 1
    );

    ixs.push(
      await this.program.methods
        .createSubUserTrade(subUserTradePDA)
        .accounts({
          signer: this.program.provider.publicKey,
        })
        .instruction()
    );

    return sendVersionedTransaction(this.program, ixs, options);
  }

  /**
   * Update Market
   * @param marketId - The ID of the market
   * @param marketEnd - The end time of the market
   *
   * @param options - RPC options
   *
   */
  async updateMarket(
    marketId: number,
    marketEnd: number,
    options?: RpcOptions
  ) {
    const ixs: TransactionInstruction[] = [];

    ixs.push(
      await this.program.methods
        .updateMarket({
          marketId: new BN(marketId),
          marketEnd: new BN(marketEnd),
          winningDirection: null,
          state: null,
        })
        .accounts({
          signer: this.program.provider.publicKey,
          market: getMarketPDA(this.program.programId, marketId),
        })
        .instruction()
    );

    return sendVersionedTransaction(this.program, ixs, options);
  }

  /**
   * Create Customer
   * @param args.id - The ID of the customer
   * @param args.name - The name of the customer
   * @param args.authority - The authority of the customer
   *
   * @param options - RPC options
   *
   */
  async createCustomer(
    { id, name, authority, feeRecipient }: CreateCustomerArgs,
    options?: RpcOptions
  ) {
    const ixs: TransactionInstruction[] = [];

    ixs.push(
      await this.program.methods
        .createUser({ id, authority })
        .accounts({
          signer: this.program.provider.publicKey,
        })
        .instruction()
    );

    return sendVersionedTransaction(this.program, ixs, options);
  }

  /**
   * Get User Trade Nonce With Slots
   * @param userTrades - User Trades
   *
   */
  getUserTradeNonceWithSlots(userTrades: UserTrade[]) {
    const payer = this.program.provider.publicKey;
    if (!payer) {
      throw new Error(
        "Payer public key is not available. Wallet might not be connected."
      );
    }
    let nonce: number | null = null;

    for (const userTrade of userTrades.reverse()) {
      if (nonce !== null) {
        break;
      }

      let freeSlots = 0;

      userTrade.orders.forEach((order) => {
        if (nonce !== null) {
          return;
        }

        if (
          order.orderStatus !== OrderStatus.OPEN &&
          order.orderStatus !== OrderStatus.WAITING &&
          freeSlots >= 2
        ) {
          nonce = userTrade.isSubUser ? Number(userTrade.nonce) : 0;
        }

        if (
          order.orderStatus !== OrderStatus.OPEN &&
          order.orderStatus !== OrderStatus.WAITING
        ) {
          freeSlots += 1;
        }
      });
    }

    if (nonce === null) {
      throw new Error("No open orders found");
    }

    if (nonce === 0) {
      return getUserTradePDA(
        this.program.programId,
        payer
      );
    }

    const subUserTradePDA = getSubUserTradePDA(
      this.program.programId,
      payer,
      nonce
    );

    const userTradePDA = getUserTradePDA(
      this.program.programId,
      subUserTradePDA
    );

    return userTradePDA;
  }

  async getUserTradeIxs() {
    const payer = this.program.provider.publicKey;
    if (!payer) {
      throw new Error(
        "Payer public key is not available. Wallet might not be connected."
      );
    }

    let userTradePDA = getUserTradePDA(
      this.program.programId,
      payer
    );

    const ixs: TransactionInstruction[] = [];

    let myUserTrades: UserTrade[] = [];

    myUserTrades = await this.getMyUserTrades(payer);

    if (myUserTrades.length === 0) {
      ixs.push(
        await this.program.methods
          .createUserTrade()
          .accounts({
            signer: payer,
          })
          .instruction()
      );

      return {
        userTradePDA,
        ixs,
        nonce: 0,
      };
    }

    try {
      const userTradePDA = this.getUserTradeNonceWithSlots(myUserTrades);

      return { userTradePDA, ixs };
    } catch {
      const mainUserTrade = myUserTrades.find((trade) => !trade.isSubUser);
      if (!mainUserTrade) {
        throw new Error("Main user trade account not found. Cannot determine next sub-user nonce.");
      }

      const subUserTradePDA = getSubUserTradePDA(
        this.program.programId,
        payer,
        Number(mainUserTrade.nonce) + 1
      );

      ixs.push(
        await this.program.methods
          .createSubUserTrade(subUserTradePDA)
          .accounts({
            signer: payer,
          })
          .instruction()
      );

      return {
        userTradePDA: getUserTradePDA(this.program.programId, subUserTradePDA),
        ixs,
      };
    }
  }

//   /**
//    * Get Orders By Market ID
//    * @param marketId - The ID of the market
//    *
//    */
//   async getOrderBook(marketId: number) {
//     const marketIdBytes = bs58.encode(
//       new BN(marketId).toArrayLike(Buffer, "le", 8)
//     );

//     const memcmpFilters = Array.from({ length: 10 }).map((_, index) => ({
//       memcmp: {
//         offset:
//           8 + // discriminator
//           1 + // bump
//           32 + // authority
//           8 + // total_deposits
//           8 + // total_withdraws
//           8 + // opened_orders
//           index * 91 + // total size of each order
//           24, // offset to market_id (ts + order_id + filled_shares)
//         bytes: marketIdBytes,
//       },
//     }));

//     const allResponses = await Promise.all(
//       memcmpFilters.map((filter) =>
//         this.program.account.userTrade.all([filter])
//       )
//     );

//     const uniqueResponses = Array.from(
//       new Map(
//         allResponses.flat().map((item) => [item.publicKey.toString(), item])
//       ).values()
//     );

//     const userTrades = uniqueResponses.map(({ account, publicKey }) =>
//       formatUserTrade(account, publicKey)
//     );

//     const orders = userTrades.flatMap((userTrade) =>
//       userTrade.orders.map((order) => ({
//         ...order,
//       }))
//     );

//     const filteredOrders = orders.filter(
//       (order) =>
//         order.marketId === marketId.toString() &&
//         order.orderStatus === OrderStatus.WAITING
//     );

//     const orderBook: {
//       hype: {
//         bid: Order[];
//         ask: Order[];
//       };
//       flop: {
//         bid: Order[];
//         ask: Order[];
//       };
//     } = {
//       hype: {
//         bid: [],
//         ask: [],
//       },
//       flop: {
//         bid: [],
//         ask: [],
//       },
//     };

//     filteredOrders.sort((a, b) => Number(a.createdAt) - Number(b.createdAt));

//     filteredOrders.forEach((order) => {
//       if (
//         order.orderSide === OrderSide.BID &&
//         order.orderDirection === OrderDirection.YES
//       ) {
//         orderBook.hype.bid.push(order);

//         return;
//       }

//       if (
//         order.orderSide === OrderSide.ASK &&
//         order.orderDirection === OrderDirection.YES
//       ) {
//         orderBook.hype.ask.push(order);

//         return;
//       }

//       if (
//         order.orderSide === OrderSide.BID &&
//         order.orderDirection === OrderDirection.NO
//       ) {
//         orderBook.flop.bid.push(order);

//         return;
//       }

//       orderBook.flop.ask.push(order);
//     });

//     return orderBook;
//   }
}
