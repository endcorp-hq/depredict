
import { Program } from "@coral-xyz/anchor";
import { Depredict } from "../types/depredict.js";
import { PublicKey, Keypair, AddressLookupTableProgram, AddressLookupTableAccount, TransactionInstruction, VersionedTransaction } from "@solana/web3.js";
import { createTreeV2, setTreeDelegate } from "@metaplex-foundation/mpl-bubblegum";
import { createCollectionV2, mplCore, pluginAuthorityPairV2 } from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";
import { generateSigner, signerIdentity, createSignerFromKeypair, publicKeyBytes, type PublicKeyBytes, type KeypairSigner, Pda } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import createVersionedTransaction from "./sendVersionedTransaction.js";
import { getMarketCreatorPDA } from "./pda/index.js";

const DAS_RPC = process.env.DAS_RPC || "";

function getUmi(rpcEndpoint?: string) {
  const endpoint = rpcEndpoint && rpcEndpoint.length > 0 ? rpcEndpoint : DAS_RPC;
  if (!endpoint) {
    throw new Error("DAS RPC endpoint not provided. Pass rpcEndpoint or set process.env.DAS_RPC");
  }
  return createUmi(endpoint);
}

export const fetchAssetProof = async (
  assetId: PublicKey,
  rpcEndpoint?: string
): Promise<{
  root: PublicKeyBytes;
  dataHash: PublicKeyBytes;
  creatorHash: PublicKeyBytes;
  nonce: number;
  index: number;
  proof: string[];
}> => {
  const umi = getUmi(rpcEndpoint).use(dasApi());
  const assetPk = fromWeb3JsPublicKey(assetId);
  const proofRef = await (umi.rpc as any).getAssetProof(assetPk);
  const assetRef = await (umi.rpc as any).getAsset(assetPk);
  return {
    root: publicKeyBytes(proofRef.root.toString()),
    dataHash: publicKeyBytes(assetRef.compression.data_hash.toString()),
    creatorHash: publicKeyBytes(assetRef.compression.creator_hash.toString()),
    nonce: assetRef.compression.seq,
    index: assetRef.compression.leaf_id,
    proof: proofRef.proof,
  };
};

export async function fetchAssetProofWithRetry(
  assetId: PublicKey,
  rpcEndpoint?: string,
  retries = 5,
  delayMs = 500
) {
  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fetchAssetProof(assetId, rpcEndpoint);
    } catch (err) {
      lastErr = err;
      if (attempt < retries - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

export function truncateProof(proof: string[], canopyDepth: number): string[] {
  return proof.slice(0, Math.max(0, proof.length - canopyDepth));
}

export function proofToRemainingAccounts(proof: string[], canopyDepth: number) {
  const truncated = truncateProof(proof, canopyDepth);
  return truncated.map((p) => ({
    pubkey: new PublicKey(p),
    isSigner: false,
    isWritable: false,
  }));
}

export async function buildLookupTableTransactions(
  program: Program<Depredict>,
  payer: PublicKey,
  addresses: PublicKey[],
  existingLookupTable?: PublicKey
): Promise<{
  createLutTx?: VersionedTransaction;
  extendLutTxs: VersionedTransaction[];
  lookupTableAddress: PublicKey;
}> {
  const connection = program.provider.connection;
  let lookupTableAddress = existingLookupTable ?? PublicKey.default;
  const extendLutTxs: VersionedTransaction[] = [];
  let createLutTx: VersionedTransaction | undefined;

  if (!existingLookupTable) {
    const slot = await connection.getSlot();
    const [createIx, createdAddress] = AddressLookupTableProgram.createLookupTable({
      authority: payer,
      payer,
      recentSlot: slot,
    });
    createLutTx = await createVersionedTransaction(program, [createIx], payer);
    lookupTableAddress = createdAddress;
  } else {
    lookupTableAddress = existingLookupTable;
  }

  const chunkSize = 20;
  for (let i = 0; i < addresses.length; i += chunkSize) {
    const chunk = addresses.slice(i, i + chunkSize);
    const extendIx = AddressLookupTableProgram.extendLookupTable({
      payer,
      authority: payer,
      lookupTable: lookupTableAddress,
      addresses: chunk,
    });
    const tx = await createVersionedTransaction(program, [extendIx], payer);
    extendLutTxs.push(tx);
  }

  return { createLutTx, extendLutTxs, lookupTableAddress };
}

export async function compileTxWithLookupV0(
  program: Program<Depredict>,
  ixs: TransactionInstruction[],
  payer: PublicKey,
  lookupTableAddress: PublicKey
) {
  const { value } = await program.provider.connection.getAddressLookupTable(lookupTableAddress);
  if (!value) throw new Error("Lookup table not found/active");
  return createVersionedTransaction(program, ixs, payer, undefined, [value as AddressLookupTableAccount]);
}

export async function sendWithLookupV0(
  program: Program<Depredict>,
  ixs: TransactionInstruction[],
  payer: PublicKey,
  addresses: PublicKey[] = [],
  existingLookupTable?: PublicKey
): Promise<{
  createLutTx?: VersionedTransaction;
  extendLutTxs: VersionedTransaction[];
  mainTx: VersionedTransaction;
  lookupTableAddress: PublicKey;
}> {
  if (!addresses || addresses.length === 0) {
    const mainTx = await createVersionedTransaction(program, ixs, payer);
    return { extendLutTxs: [], mainTx, lookupTableAddress: PublicKey.default };
  }
  const { createLutTx, extendLutTxs, lookupTableAddress } = await buildLookupTableTransactions(
    program,
    payer,
    addresses,
    existingLookupTable
  );
  const mainTx = await compileTxWithLookupV0(program, ixs, payer, lookupTableAddress);
  return { createLutTx, extendLutTxs, mainTx, lookupTableAddress };
}

export async function createCoreCollection(
  program: Program<Depredict>,
  authority: Keypair,
  {
    name = "Test Collection",
    uri = "https://example.com/metadata.json",
    rpcEndpoint,
  }: { name?: string; uri?: string; rpcEndpoint?: string } = {}
): Promise<KeypairSigner & { publicKey: string }> {
  const umi = getUmi(rpcEndpoint).use(mplCore());
  const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(authority as any));
  umi.use(signerIdentity(signer, true));

  const collection = generateSigner(umi);

  const derived = getMarketCreatorPDA(program.programId, authority.publicKey);
  const [marketCreatorPda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("market_creator"), authority.publicKey.toBytes()],
    program.programId
  );
  if (!marketCreatorPda.equals(derived)) throw new Error("MarketCreator PDA derivation mismatch");
  const umiMarketCreatorPda: Pda = [fromWeb3JsPublicKey(marketCreatorPda), bump] as Pda;

  await createCollectionV2(umi, {
    collection,
    payer: signer,
    updateAuthority: umiMarketCreatorPda,
    name,
    uri,
    plugins: [pluginAuthorityPairV2({ type: "BubblegumV2" })],
  }).sendAndConfirm(umi);

  return { ...collection, publicKey: collection.publicKey.toString() } as any;
}

export async function createMerkleTree(
  program: Program<Depredict>,
  authority: Keypair,
  {
    maxDepth = 16,
    canopyDepth = 8,
    maxBufferSize = 64,
    isPublic = false,
    rpcEndpoint,
  }: { maxDepth?: number; canopyDepth?: number; maxBufferSize?: number; isPublic?: boolean; rpcEndpoint?: string } = {}
): Promise<PublicKey> {
  const umi = getUmi(rpcEndpoint);
  const umiAuthorityKp = umi.eddsa.createKeypairFromSecretKey(authority.secretKey);
  umi.use(signerIdentity(createSignerFromKeypair(umi, umiAuthorityKp)));

  const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(authority as any));
  const merkleTree = generateSigner(umi);
  const builder = await createTreeV2(umi, {
    merkleTree,
    maxDepth,
    canopyDepth,
    maxBufferSize,
    public: isPublic,
    treeCreator: signer,
  });
  await builder.sendAndConfirm(umi);

  const [marketCreatorPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("market_creator"), authority.publicKey.toBytes()],
    program.programId
  );
  await setTreeDelegate(umi, {
    treeCreator: signer,
    newTreeDelegate: fromWeb3JsPublicKey(marketCreatorPda),
    merkleTree: merkleTree.publicKey,
  }).sendAndConfirm(umi);

  const treePubkey = new PublicKey(merkleTree.publicKey.toString());
  const accountInfo = await program.provider.connection.getAccountInfo(treePubkey);
  if (!accountInfo) throw new Error(`Merkle tree account ${treePubkey.toString()} not found after creation`);
  return treePubkey;
}

