import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createSignerFromKeypair, generateSigner, signerIdentity } from '@metaplex-foundation/umi'
import { createTreeV2, mplBubblegum } from '@metaplex-foundation/mpl-bubblegum'
import { provider } from './helpers'
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters'
import { Keypair } from '@solana/web3.js'
import * as fs from 'fs'
import {
  fetchMerkleTree,
} from "@metaplex-foundation/mpl-account-compression";



const umi = createUmi('https://api.devnet.solana.com')
.use(mplBubblegum())

const merkleTree = generateSigner(umi)
const wallet = fromWeb3JsKeypair(provider.wallet.payer)
const adminSigner = createSignerFromKeypair(umi, wallet)

// Set the signer identity for UMI
umi.use(signerIdentity(adminSigner))
it("Creates merkle tree account for testing", async () => {

  
  const builder = await createTreeV2(umi, {
    merkleTree,
    maxBufferSize: 64,
    maxDepth: 16,
    public: false,
  })
  
  await builder.sendAndConfirm(umi)
  console.log("Merkle tree account created:", merkleTree.publicKey.toString())
  console.log("Admin account:", adminSigner.publicKey.toString())
})

it("Fetches merkle tree account", async () => {
  const umi = createUmi('https://api.devnet.solana.com')
    .use(mplBubblegum())

  const wallet = fromWeb3JsKeypair(provider.wallet.payer)
  const adminSigner = createSignerFromKeypair(umi, wallet)
  
  // Set the signer identity for UMI
  umi.use(signerIdentity(adminSigner))
  
  const merkleTreeAccount = await fetchMerkleTree(umi, merkleTree.publicKey)
  console.log("Merkle tree account fetched:", merkleTreeAccount)
})