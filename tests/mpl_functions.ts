// solana
import { PublicKey, Keypair } from "@solana/web3.js";
// mpl
import { createTreeV2 } from "@metaplex-foundation/mpl-bubblegum";
import {
  createCollection,
  mplCore,
  updateCollection,
} from '@metaplex-foundation/mpl-core';
import {
  generateSigner,
  signerIdentity,
  sol,
  createSignerFromKeypair,
  type KeypairSigner,
  Signer,
  Pda
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'

// helpers
import { 
  provider, 
  program,
  ADMIN
} from "./helpers";

async function createCoreCollection(authority: Signer): Promise<KeypairSigner> {
  const umi = createUmi(provider.connection.rpcEndpoint)
  .use(mplCore());
  const signer = generateSigner(umi);
  
  umi.use(signerIdentity(signer));
  
  await umi.rpc.airdrop(umi.identity.publicKey, sol(1));

  const metadataUri = 'https://example.com/metadata.json';
  
  // create a collection
  const collection = generateSigner(umi);

  const tx_create = await createCollection(umi, {
    collection,
    name: 'Test Collection',
    uri: metadataUri,
    payer: authority,
    plugins: [
      {
        type: "BubblegumV2",
      },
    ],
  }).sendAndConfirm(umi);

  console.log("tx_create", tx_create);

    // we must use the marketCreator PDA as the authority to create the collection
    // market creator pda
    const seeds = [Buffer.from("market_creator"), ADMIN.publicKey.toBytes()];
    const [marketCreatorpda, bump] = PublicKey.findProgramAddressSync(
      seeds,
      program.programId
    );


    const tx_update = await updateCollection(umi, {
      collection: collection.publicKey,
      authority: authority,
      payer: authority,
      newUpdateAuthority: {
        publicKey: marketCreatorpda,
        bump: bump,
      },
    }).sendAndConfirm(umi)

    console.log("tx_update", tx_update);


return collection;
}

async function createMerkleTree(authority: Keypair): Promise<PublicKey> {
  
  const umi = createUmi((provider.connection as any).rpcEndpoint);

  const umiAuthorityKp = umi.eddsa.createKeypairFromSecretKey(authority.secretKey);
  umi.use(signerIdentity(createSignerFromKeypair(umi, umiAuthorityKp)));
  
  const merkleTree = generateSigner(umi);
  const builder = await createTreeV2(umi, {
    merkleTree,
    maxDepth: 16,
    canopyDepth: 8,
    maxBufferSize: 64,
    public: true,
  });
  await builder.sendAndConfirm(umi);
  
  const treePubkey = new PublicKey(merkleTree.publicKey.toString());
  
  // Wait for the account to be fully propagated on-chain
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
  
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