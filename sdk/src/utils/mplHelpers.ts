
import { Program } from "@coral-xyz/anchor";
import { Depredict } from "../types/depredict.js";
import { PublicKey, Keypair, AddressLookupTableProgram, AddressLookupTableAccount, TransactionInstruction, VersionedTransaction } from "@solana/web3.js";
import { createTreeV2, setTreeDelegate } from "@metaplex-foundation/mpl-bubblegum";
import { createCollectionV2, mplCore, pluginAuthorityPairV2 } from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";
import { fetchMerkleTree } from "@metaplex-foundation/spl-account-compression";
import { generateSigner, signerIdentity, createSignerFromKeypair, publicKeyBytes, type PublicKeyBytes, type KeypairSigner, Pda } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import type { PublicKey as UmiPublicKey } from "@metaplex-foundation/umi";
import createVersionedTransaction from "./sendVersionedTransaction.js";
import { getMarketCreatorPDA } from "./pda/index.js";

export function getUmi(rpcEndpoint?: string) {
  const endpoint = rpcEndpoint;
  if (!endpoint || endpoint.length === 0) {
    throw new Error(
      "MISSING_DAS_RPC: Provide rpcEndpoint"
    );
  }
  return createUmi(endpoint);
}

export function toWeb3PublicKey(value: any): PublicKey {
  if (!value) throw new Error("INVALID_PUBLIC_KEY: value is required");
  if (value instanceof PublicKey) return value;
  if (typeof (value as any).toBase58 === "function" && typeof (value as any).toString === "function") {
    // umi public key
    return new PublicKey((value as any).toString());
  }
  if (typeof value === "string") return new PublicKey(value);
  throw new Error("INVALID_PUBLIC_KEY: Normalize inputs to PublicKey or pass base58 string");
}

export function toUmiPublicKey(value: any): UmiPublicKey {
  if (!value) throw new Error("INVALID_PUBLIC_KEY: value is required");
  if (typeof (value as any).toBase58 === "function" && typeof (value as any).toString === "function" && !(value instanceof PublicKey)) {
    return value as UmiPublicKey;
  }
  const web3Pk = toWeb3PublicKey(value as any);
  return fromWeb3JsPublicKey(web3Pk);
}

/**
 * Requests the DAS proof for a compressed asset and returns it in the shape
 * that `trade.claimPosition` expects.
 *
 * @example
 * const proof = await fetchAssetProofWithRetry(assetId, connection.rpcEndpoint);
 * const remainingAccounts = proofToRemainingAccounts(proof.proof, proof.canopyDepth);
 */
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
  canopyDepth: number;
}> => {
  const umi = getUmi(rpcEndpoint).use(dasApi());
  const assetPk = fromWeb3JsPublicKey(assetId);
  const proofRef = await (umi.rpc as any).getAssetProof(assetPk);
  const assetRef = await (umi.rpc as any).getAsset(assetPk);
  const merkleTreeAccount = await fetchMerkleTree(umi, proofRef.tree_id);
  const canopyNodes = Array.isArray((merkleTreeAccount as any).canopy)
    ? (merkleTreeAccount as any).canopy
    : [];
  const canopyDepth =
    canopyNodes.length > 0
      ? Math.max(0, Math.floor(Math.log2(canopyNodes.length + 2) - 1))
      : 0;
  const truncatedProof =
    canopyDepth > 0
      ? proofRef.proof.slice(0, Math.max(0, proofRef.proof.length - canopyDepth))
      : proofRef.proof;
  const leafIndex =
    BigInt(proofRef.node_index ?? 0) - (BigInt(1) << BigInt(proofRef.proof.length ?? 0));
  const nonce = assetRef.compression.leaf_id ?? assetRef.compression.seq;
  return {
    root: publicKeyBytes(proofRef.root.toString()),
    dataHash: publicKeyBytes(assetRef.compression.data_hash.toString()),
    creatorHash: publicKeyBytes(assetRef.compression.creator_hash.toString()),
    nonce: Number(nonce ?? 0),
    index: Number(leafIndex < 0n ? 0n : leafIndex),
    proof: truncatedProof,
    canopyDepth,
  };
};

/**
 * Convenience wrapper around {@link fetchAssetProof} that retries when the DAS
 * endpoint has not indexed the cNFT yet.
 */
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

/**
 * Trims canopy nodes off a proof. Usually you should hand the canopy depth
 * returned by {@link fetchAssetProof} straight into this helper.
 */
export function truncateProof(proof: string[], canopyDepth = 0): string[] {
  if (!canopyDepth || canopyDepth <= 0) return proof;
  return proof.slice(0, Math.max(0, proof.length - canopyDepth));
}

/**
 * Converts a trimmed proof into Anchor `remainingAccounts`, ready to be passed
 * to `program.methods.settlePosition(...).remainingAccounts(...)`.
 */
export function proofToRemainingAccounts(proof: string[], canopyDepth = 0) {
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

export function normalizeResult(result: any): { ixs: TransactionInstruction[]; alts: (AddressLookupTableAccount | string)[] } {
  const ixs: TransactionInstruction[] =
    result?.ixs ?? result?.instructions ?? (result?.instruction ? [result.instruction] : []);
  const alts: (AddressLookupTableAccount | string)[] =
    result?.alts ?? result?.addressLookupTableAccounts ?? [];
  return { ixs, alts };
}

export async function buildV0Message(
  program: Program<Depredict>,
  ixs: TransactionInstruction[],
  payer: PublicKey,
  alts: (AddressLookupTableAccount | string)[] = [],
  recentBlockhash?: string
): Promise<{ message: Uint8Array; alts: string[] }> {
  const connection = program.provider.connection;
  const altAccounts: AddressLookupTableAccount[] = [];
  const altStrings: string[] = [];
  for (const alt of alts) {
    if (typeof alt === "string") {
      const { value } = await connection.getAddressLookupTable(new PublicKey(alt));
      if (value) {
        altAccounts.push(value as AddressLookupTableAccount);
        altStrings.push(alt);
      }
    } else {
      altAccounts.push(alt);
      altStrings.push(alt.key.toBase58());
    }
  }
  const tx = await createVersionedTransaction(program, ixs, payer, { recentBlockhash } as any, altAccounts);
  return { message: tx.message.serialize(), alts: altStrings };
}

export async function createCoreCollection(
  program: Program<Depredict>,
  authority: Keypair,
  {
    name,
    uri,
    rpcEndpoint,
  }: { name: string; uri: string; rpcEndpoint?: string }
): Promise<KeypairSigner & { publicKey: string }> {
  if (!name || !uri || typeof name !== "string" || typeof uri !== "string") {
    throw new Error("INVALID_COLLECTION_PARAMS: name and uri are required strings");
  }
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
