import { BN, Program } from "@coral-xyz/anchor";
import { ShortxContract } from "./types/shortx";
import { formatPositionAccount } from "./utils/helpers";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import sendVersionedTransaction from "./utils/sendVersionedTransaction";
import { getPositionAccountPDA, getSubPositionAccountPDA } from "./utils/pda";
import { RpcOptions } from "./types";
import { PositionAccount, PositionStatus } from "./types/position";

export default class Position {
  constructor(private program: Program<ShortxContract>) {}

  /**
   * Get all Position Accounts for a Market
   * @param marketId - Market ID
   *
   */
  async getPositionAccountsForMarket(marketId: number) {
    const response = await this.program.account.positionAccount.all([
      {
        memcmp: {
          offset: 8 + 1,
          bytes: marketId.toString(),
        },
      },
    ]);

    return response.map(({ account }) =>
      formatPositionAccount(account, marketId)
    );
  }

  /**
   * Get User positions for a market
   * @param user - User PublicKey
   *
   */
  async getUserPositions(user: PublicKey, marketId: number) {
    const positionAccounts = await this.getPositionAccountsForMarket(marketId);

    const positions = positionAccounts.flatMap(
      (positionAccount) => positionAccount.positions
    );

    return positions.filter((position) => position.authority === user.toBase58());
  }

  /**
   * Get the PDA for a position account
   * @param marketId - Market ID
   * @param marketAddress - Market Address
   * @param userNonce - The nonce of the user
   *
   */
  async getPositionsAccountPda(marketId: number, userNonce = 0) {
    let positionAccountPDA = getPositionAccountPDA(
      this.program.programId,
      marketId
    );

    if (userNonce !== 0) {
      const marketAddress = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), new BN(marketId).toArrayLike(Buffer, "le", 8)],
        this.program.programId
      )[0];
      const subPositionAccountPDA = getSubPositionAccountPDA(
        this.program.programId,
        marketId,
        marketAddress,
        userNonce
      );

      positionAccountPDA = getPositionAccountPDA(
        this.program.programId,
        marketId,
        subPositionAccountPDA
      );
    }

    return this.program.account.positionAccount.fetch(positionAccountPDA);
  }

  /**
   * Create Sub positions account
   * @param user - User PublicKey the main user
   *
   * @param options - RPC options
   *
   */
  async createSubPositionAccount(
    marketId: number,
    marketAddress: PublicKey,
    options?: RpcOptions
  ) {
    const ixs: TransactionInstruction[] = [];

    const positionAccount = await this.getPositionsAccountPda(marketId);

    const subPositionAccountPDA = getSubPositionAccountPDA(
      this.program.programId,
      marketId,
      marketAddress,
      positionAccount.nonce + 1
    );

    const marketPositionsAccount = getPositionAccountPDA(
      this.program.programId,
      marketId
    );

    ixs.push(
      await this.program.methods
        .createSubPositionAccount(subPositionAccountPDA)
        .accountsPartial({
          signer: this.program.provider.publicKey,
          market: marketAddress,
          marketPositionsAccount: marketPositionsAccount,
          subMarketPositions: subPositionAccountPDA,
          systemProgram: SystemProgram.programId,
        })
        .instruction()
    );

    return sendVersionedTransaction(this.program, ixs, options);
  }

  /**
   * Get position account Nonce With Slots
   * @param positionAccounts - Position Accounts
   *
   */
  getPositionAccountNonceWithSlots(positionAccounts: PositionAccount[]) {
    const payer = this.program.provider.publicKey;
    const marketId = Number(positionAccounts[0].marketId);
    const marketAddress = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), new BN(marketId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    )[0];
    if (!payer) {
      throw new Error(
        "Payer public key is not available. Wallet might not be connected."
      );
    }
    let nonce: number | null = null;

    for (const positionAccount of positionAccounts.reverse()) {
      if (nonce !== null) {
        break;
      }

      let freeSlots = 0;

      positionAccount.positions.forEach((position) => {
        if (nonce !== null) {
          return;
        }

        if (
          position.positionStatus !== PositionStatus.OPEN &&
          position.positionStatus !== PositionStatus.WAITING &&
          freeSlots >= 2
        ) {
          nonce = positionAccount.isSubPosition
            ? Number(positionAccount.nonce)
            : 0;
        }

        if (
          position.positionStatus !== PositionStatus.OPEN &&
          position.positionStatus !== PositionStatus.WAITING
        ) {
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

    const subPositionAccountPDA = getSubPositionAccountPDA(
      this.program.programId,
      Number(marketId),
      marketAddress,
      nonce
    );

    const positionAccountPDA = getPositionAccountPDA(
      this.program.programId,
      Number(marketId),
      subPositionAccountPDA
    );

    return positionAccountPDA;
  }

  async getPositionAccountIxs(marketId: number) {
    const payer = this.program.provider.publicKey;
    if (!payer) {
      throw new Error(
        "Payer public key is not available. Wallet might not be connected."
      );
    }

    let marketAddress = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), new BN(marketId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    )[0];

    const marketPositionsAccount = getPositionAccountPDA(
      this.program.programId,
      marketId
    );

    const ixs: TransactionInstruction[] = [];

    let positionAccounts: PositionAccount[] = [];

    positionAccounts = await this.getPositionAccountsForMarket(marketId);

    if (positionAccounts.length === 0) {
      throw new Error(
        "No position accounts found for this market. Something went wrong."
      );
    }

    try {
      const positionAccountPDA =
        this.getPositionAccountNonceWithSlots(positionAccounts);

      return { positionAccountPDA, ixs };
    } catch {
      const mainPositionAccount = positionAccounts.find(
        (positionAccount) => !positionAccount.isSubPosition
      );
      if (!mainPositionAccount) {
        throw new Error(
          "Main position account not found. Cannot determine next sub-position nonce."
        );
      }

      const subPositionAccountPDA = getSubPositionAccountPDA(
        this.program.programId,
        marketId,
        marketAddress,
        Number(mainPositionAccount.nonce) + 1
      );

      ixs.push(
        await this.program.methods
          .createSubPositionAccount(subPositionAccountPDA)
          .accountsPartial({
            signer: payer,
            market: marketAddress,
            marketPositionsAccount: marketPositionsAccount,
            subMarketPositions: subPositionAccountPDA,
            systemProgram: SystemProgram.programId,
          })
          .instruction()
      );

      return {
        positionAccountPDA: getPositionAccountPDA(
          this.program.programId,
          marketId,
          subPositionAccountPDA
        ),
        ixs,
      };
    }
  }
}
