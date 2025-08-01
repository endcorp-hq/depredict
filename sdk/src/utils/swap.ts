import axios from 'axios'
import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  TransactionInstruction,
  ComputeBudgetProgram
} from '@solana/web3.js'
import { TOKEN_MINTS, TOKEN_DECIMALS } from './constants.js'

export const swap = async ({
  connection,
  wallet,
  inToken,
  amount,
  mint
}: {
  connection: Connection
  wallet: string
  inToken: string
  amount: number
  mint: string
}) => {
  const token = TOKENS[inToken]

  if (!token) {
    throw new Error('Token not found')
  }

  const formattedAmountIn = amount * 10 ** token.decimals

  const quoteResponse = await axios.get(
    `https://quote-api.jup.ag/v6/quote?inputMint=${inToken}&outputMint=${mint}&amount=${formattedAmountIn}&slippageBps=1000`
  )

  const { data: quoteData } = quoteResponse

  const swapResponse = await axios.post(
    'https://quote-api.jup.ag/v6/swap-instructions',
    {
      userPublicKey: wallet,
      wrapAndUnwrapSol: true,
      quoteResponse: quoteData
    }
  )

  const {
    setupInstructions,
    swapInstruction,
    addressLookupTableAddresses,
    cleanupInstruction
  } = swapResponse.data

  return {
    swapIxs: [
      deserializeInstruction(swapInstruction),
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 500000
      })
    ],
    addressLookupTableAccounts: await getAddressLookupTableAccounts(
      connection,
      addressLookupTableAddresses
    ),
    setupInstructions: setupInstructions.map(deserializeInstruction),
    cleanupInstruction: deserializeInstruction(cleanupInstruction),
    mintAmount: quoteData.outAmount
  }
}

const deserializeInstruction = (instruction: any) => {
  return new TransactionInstruction({
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map((key: any) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable
    })),
    data: Buffer.from(instruction.data, 'base64')
  })
}

export const getAddressLookupTableAccounts = async (
  connection: Connection,
  keys: string[]
): Promise<AddressLookupTableAccount[]> => {
  const addressLookupTableAccountInfos =
    await connection.getMultipleAccountsInfo(
      keys.map((key) => new PublicKey(key))
    )

  return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
    const addressLookupTableAddress = keys[index]
    if (accountInfo) {
      const addressLookupTableAccount = new AddressLookupTableAccount({
        key: new PublicKey(addressLookupTableAddress),
        state: AddressLookupTableAccount.deserialize(accountInfo.data)
      })
      acc.push(addressLookupTableAccount)
    }

    return acc
  }, new Array<AddressLookupTableAccount>())
}

const TOKENS: Record<string, { mint: string; decimals: number }> = {
  [TOKEN_MINTS.SOL.toBase58()]: {
    mint: TOKEN_MINTS.SOL.toBase58(),
    decimals: TOKEN_DECIMALS[TOKEN_MINTS.SOL.toBase58()]
  },
  [TOKEN_MINTS.USDC_MAINNET.toBase58()]: {
    mint: TOKEN_MINTS.USDC_MAINNET.toBase58(),
    decimals: TOKEN_DECIMALS[TOKEN_MINTS.USDC_MAINNET.toBase58()]
  },
  [TOKEN_MINTS.USDC_DEVNET.toBase58()]: {
    mint: TOKEN_MINTS.USDC_DEVNET.toBase58(),
    decimals: TOKEN_DECIMALS[TOKEN_MINTS.USDC_DEVNET.toBase58()]
  },
  [TOKEN_MINTS.BONK.toBase58()]: {
    mint: TOKEN_MINTS.BONK.toBase58(),
    decimals: TOKEN_DECIMALS[TOKEN_MINTS.BONK.toBase58()]
  }
}