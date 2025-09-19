
import { Program } from "@coral-xyz/anchor";
import { Depredict } from "../types/depredict.js";
// solana
import { PublicKey, SystemProgram, Keypair, AddressLookupTableProgram, TransactionMessage, VersionedTransaction, TransactionInstruction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
// mpl
import { createTreeV2, setTreeDelegate } from "@metaplex-foundation/mpl-bubblegum";
import {
  createCollectionV2,
  mplCore,
  pluginAuthorityPairV2
} from '@metaplex-foundation/mpl-core';
import { 
  generateSigner,
  signerIdentity,
  sol,
  createSignerFromKeypair,
  type KeypairSigner,
  Pda,
  Signer,
  publicKeyBytes,
  type PublicKeyBytes,
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api'

const provider = anchor.AnchorProvider;
// constants
import { METAPLEX_ID, DEFAULT_MINT, MPL_BUBBLEGUM_ID, MPL_NOOP_ID as NOOP_PROGRAM_ID, MPL_ACCOUNT_COMPRESSION_ID as ACCOUNT_COMPRESSION_ID, MPL_CORE_PROGRAM_ID as CORE_PROGRAM_ID, MPL_CORE_CPI_SIGNER } from "./constants.js";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";

const DAS_RPC = "https://api.devnet.solana.com"; // must be helius or something. Load from env. 

const CANOPY_DEPTH = 8; // have some central account based settings (e.g. basic account, pro, super pro, etc.)

let CACHED_LUT: PublicKey | null = null; // cached lut for faster txs


// function to fetch asset proof with retry
async function fetchAssetProofWithRetry(assetId: PublicKey, attempts = 8, delayMs = 1500): Promise<{
    root: PublicKeyBytes;
    dataHash: PublicKeyBytes;
    creatorHash: PublicKeyBytes;
    nonce: number;
    index: number;
    proof: string[];
  }> {
    const umi = createUmi(DAS_RPC).use(dasApi());
    let lastErr: any = null;
    for (let i = 0; i < attempts; i++) {
      try {
        const assetPk = fromWeb3JsPublicKey(assetId);
        const proofRef = await umi.rpc.getAssetProof(assetPk);
        const assetRef = await umi.rpc.getAsset(assetPk);
        return {
          root: publicKeyBytes(proofRef.root.toString()),
          dataHash: publicKeyBytes(assetRef.compression.data_hash.toString()),
          creatorHash: publicKeyBytes(assetRef.compression.creator_hash.toString()),
          nonce: assetRef.compression.seq,
          index: assetRef.compression.leaf_id,
          proof: proofRef.proof,
        };
      } catch (e) {
        lastErr = e;
        if (i < attempts - 1) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }
    throw lastErr ?? new Error("Failed to fetch asset proof");
  }





// function to truncate proofs to the canopy depth for smaller tx
function truncateProof(proof: string[], canopyDepth: number = CANOPY_DEPTH): string[] {
  return proof.slice(0, Math.max(0, proof.length - canopyDepth));
}

// function to convert proofs to remaining accounts for smaller tx
function proofToRemainingAccounts(proof: string[], canopyDepth: number = CANOPY_DEPTH) {
  const truncated = truncateProof(proof, canopyDepth);
  return truncated.map((p) => ({
    pubkey: new PublicKey(p),
    isSigner: false,
    isWritable: false,
  }));
}

// function to send txs with lookup v0
async function sendWithLookupV0(ixs: TransactionInstruction[], payer: Keypair, addresses: PublicKey[]) {
  // If no extra addresses needed, send legacy
  if (!addresses || addresses.length === 0) {
    const txLegacy = new anchor.web3.Transaction().add(...ixs);
    await provider.connection.sendAndConfirm(txLegacy, [payer]);
    return;
  }

  if (!CACHED_LUT) {
    const slot = await provider.connection.getSlot();
    const [createIx, createdLutAddr] = AddressLookupTableProgram.createLookupTable({
      authority: payer.publicKey,
      payer: payer.publicKey,
      recentSlot: slot,
    });
    const txCreate = new anchor.web3.Transaction().add(createIx);
    await provider.sendAndConfirm(txCreate, [payer]);
    await new Promise((r) => setTimeout(r, 1200));
    CACHED_LUT = createdLutAddr;
  }

  const lutAddress = CACHED_LUT as PublicKey;
  let lutResp = await provider.connection.getAddressLookupTable(lutAddress);
  if (!lutResp.value) {
    await new Promise((r) => setTimeout(r, 1200));
    lutResp = await provider.connection.getAddressLookupTable(lutAddress);
  }
  const lutAcctBefore = lutResp.value;
  if (!lutAcctBefore) throw new Error("Lookup table not found/active");

  const existing = new Set(lutAcctBefore.state.addresses.map((a) => a.toBase58()));
  const toAdd = addresses.filter((a) => !existing.has(a.toBase58()));
  if (toAdd.length > 0) {
    const chunkSize = 20;
    for (let i = 0; i < toAdd.length; i += chunkSize) {
      const chunk = toAdd.slice(i, i + chunkSize);
      const extendIx = AddressLookupTableProgram.extendLookupTable({
        payer: payer.publicKey,
        authority: payer.publicKey,
        lookupTable: lutAddress,
        addresses: chunk,
      });
      const txExtend = new anchor.web3.Transaction().add(extendIx);
      await provider.sendAndConfirm(txExtend, [payer]);
    }
  }

  await new Promise((r) => setTimeout(r, 1200));
  const lutRespAfter = await provider.connection.getAddressLookupTable(lutAddress);
  const lutAcct = lutRespAfter.value;
  if (!lutAcct) throw new Error("Lookup table not found/active after extend");

  const { blockhash } = await provider.connection.getLatestBlockhash();
  const msgV0 = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: blockhash,
    instructions: ixs,
  }).compileToV0Message([lutAcct]);

  const vtx = new VersionedTransaction(msgV0);
  vtx.sign([payer]);
  const sig = await provider.connection.sendTransaction(vtx, { skipPreflight: false });
  const block = await provider.connection.getLatestBlockhash("confirmed");
  await provider.connection.confirmTransaction(
    {
      signature: sig,
      ...block,
    },
    "confirmed",
  );
}


async function createCoreCollection(authority: Keypair): Promise<KeypairSigner & { publicKey: string }> {

  const umi = createUmi("https://api.devnet.solana.com") // todo swap for helius, load from env. 
  .use(mplCore());
  let signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(authority));
  umi.use(signerIdentity(signer, true))

  const metadataUri = 'https://example.com/metadata.json';
  
  // create a collection
  const collection = generateSigner(umi);

      // we must use the marketCreator PDA as the authority to create the collection
    // market creator pda - generalise or load from other fn. 
    const seeds = [Buffer.from("market_creator"), ADMIN.publicKey.toBytes()];
    const [marketCreatorpda, bump] = PublicKey.findProgramAddressSync(
      seeds,
      program.programId
    );
    let localMarketCreatorpda: Pda = [fromWeb3JsPublicKey(marketCreatorpda), bump] as Pda;



  const tx_create = await createCollectionV2(umi, {
    collection,
    payer: signer,
    updateAuthority: localMarketCreatorpda,
    name: 'Test Collection',
    uri: metadataUri,
    plugins: [
      pluginAuthorityPairV2({
        type: 'BubblegumV2',
      }),
    ],
  }).sendAndConfirm(umi);

  console.log("tx_create", tx_create);

return { ...collection, publicKey: collection.publicKey.toString() } as any;
}

async function createMerkleTree(authority: Keypair): Promise<PublicKey> {
  
  const umi = createUmi("https://api.devnet.solana.com"); // todo swap for helius, load from env. 

  const umiAuthorityKp = umi.eddsa.createKeypairFromSecretKey(authority.secretKey);
  umi.use(signerIdentity(createSignerFromKeypair(umi, umiAuthorityKp)));

  let signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(authority));
  const merkleTree = generateSigner(umi);
  const builder = await createTreeV2(umi, {
    merkleTree,
    maxDepth: 16,
    canopyDepth: 8,
    maxBufferSize: 64,
    public: false,
    treeCreator: signer,
  });
  await builder.sendAndConfirm(umi);
  // Delegate tree authority to the market creator PDA so program CPI can sign via seeds
  const [marketCreatorpda] = PublicKey.findProgramAddressSync(
    [Buffer.from("market_creator"), ADMIN.publicKey.toBytes()],
    program.programId
  );
  await setTreeDelegate(umi, {
    treeCreator: signer,
    newTreeDelegate: fromWeb3JsPublicKey(marketCreatorpda),
    merkleTree: merkleTree.publicKey,
  }).sendAndConfirm(umi);
  
  const treePubkey = new PublicKey(merkleTree.publicKey.toString());
  console.log("Merkle tree created:", treePubkey.toString());
  // Wait for the account to be fully propagated on-chain
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
  
  // Verify the account exists and can be fetched
  try {
    const accountInfo = await provider.connection.getAccountInfo(treePubkey);

    if (!accountInfo) {
      throw new Error(`Merkle tree account ${treePubkey.toString()} not found after creation`);
    }
  } catch (error) {
    console.error(`❌ Failed to verify merkle tree account:`, error);
    throw error;
  }
  
  return treePubkey;
}

export { createCoreCollection, createMerkleTree };
export { truncateProof, proofToRemainingAccounts, fetchAssetProofWithRetry, sendWithLookupV0 };