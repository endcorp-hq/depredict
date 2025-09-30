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

// constants
import { 
  provider, 
  program,
  ADMIN,
  MPL_NOOP_ID
} from "./constants";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { createLut } from '@metaplex-foundation/mpl-toolbox'
const DAS_RPC = "https://api.devnet.solana.com";
const CANOPY_DEPTH = 8;
let CACHED_LUT: PublicKey | null = null;

function truncateProof(proof: string[], canopyDepth: number = CANOPY_DEPTH): string[] {
  return proof.slice(0, Math.max(0, proof.length - canopyDepth));
}

function proofToRemainingAccounts(proof: string[], canopyDepth: number = CANOPY_DEPTH) {
  const truncated = truncateProof(proof, canopyDepth);
  return truncated.map((p) => ({
    pubkey: new PublicKey(p),
    isSigner: false,
    isWritable: false,
  }));
}

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

async function sendWithLookupV0(ixs: TransactionInstruction[], payer: Keypair, addresses: PublicKey[]) {
  // If no extra addresses needed, send legacy
  if (!addresses || addresses.length === 0) {
    const txLegacy = new anchor.web3.Transaction().add(...ixs);
    await provider.sendAndConfirm(txLegacy, [payer]);
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


async function createMarketLut(marketCreatorPda: PublicKey) {
  const umi = createUmi("https://api.devnet.solana.com") // todo swap for helius, load from env. 

  const recentSlot = await umi.rpc.getSlot({ commitment: 'finalized' })

// authority is the market creator. 
  await createLut(umi, {
    authority: createSignerFromKeypair(umi, fromWeb3JsKeypair(ADMIN)),
    recentSlot,
    addresses: [
      fromWeb3JsPublicKey(ADMIN.publicKey), 
      fromWeb3JsPublicKey(marketCreatorPda)
    ],
  })

}





async function createCoreCollection(authority: Keypair): Promise<KeypairSigner & { publicKey: string }> {


  const umi = createUmi(provider.connection.rpcEndpoint)
  .use(mplCore());
  let signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(authority));
  umi.use(signerIdentity(signer, true))

  const metadataUri = "https://example.com/metadata.json";
  
  // create a collection
  const collection = generateSigner(umi);

      // we must use the marketCreator PDA as the authority to create the collection
    // market creator pda
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
  
  const umi = createUmi(provider.connection.rpcEndpoint);

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
  // Give the network a moment to finalize the TreeConfig account before delegating
  
  await new Promise((r) => setTimeout(r, 5000));

  
  const treePubkey = new PublicKey(merkleTree.publicKey.toString());
  console.log("Merkle tree created:", treePubkey.toString());
  // Wait for the account to be fully propagated on-chain
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
  
  // Verify the account exists and can be fetched
  try {

    const treeAccountInfo = await provider.connection.getAccountInfo(treePubkey);

    console.log("Account info:", treeAccountInfo);

    if (!treeAccountInfo) {
      throw new Error(`Merkle tree account ${treePubkey.toString()} not found after creation`);
    }
      // Delegate tree authority to the market creator PDA so program CPI can sign via seeds. 
  const [marketCreatorpda] = PublicKey.findProgramAddressSync(
    [Buffer.from("market_creator"), ADMIN.publicKey.toBytes()],
    program.programId
  );

  console.log(marketCreatorpda);
  
  let delegated = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await setTreeDelegate(umi, {
        merkleTree: merkleTree.publicKey,
        treeCreator: signer,
        newTreeDelegate: fromWeb3JsPublicKey(marketCreatorpda),
      }).sendAndConfirm(umi);
      delegated = true;
      break;
    } catch (e) {
      console.log(`setTreeDelegate attempt ${attempt} failed. ${attempt < 3 ? 'Retrying in 4s...' : 'No more retries.'}`);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 4000));
      } else {
        throw e;
      }
    }
  }

  } catch (error) {

    console.error(`❌ Failed to verify merkle tree account:`, error);
    throw error;
  
  }
  
  return treePubkey;

}

export { createCoreCollection, createMerkleTree };
export { truncateProof, proofToRemainingAccounts, fetchAssetProofWithRetry, sendWithLookupV0 };