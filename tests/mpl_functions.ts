// solana
import { PublicKey, SystemProgram } from "@solana/web3.js";
// mpl
import { createTree } from "@metaplex-foundation/mpl-bubblegum";
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
  Keypair,
  Pda,
  Signer,
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'

// constants
import { 
  provider, 
  program,
  ADMIN,
  MPL_NOOP_ID
} from "./constants";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";


async function createCoreCollection(authority: Keypair): Promise<KeypairSigner & { publicKey: string }> {


  const umi = createUmi("https://api.devnet.solana.com") // todo swap for helius, load from env. 
  .use(mplCore());
  let signer = createSignerFromKeypair(umi, authority);
  umi.use(signerIdentity(signer, true))

  const metadataUri = 'https://example.com/metadata.json';
  
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
  
  const umi = createUmi("https://api.devnet.solana.com"); // todo swap for helius, load from env. 

  const umiAuthorityKp = umi.eddsa.createKeypairFromSecretKey(authority.secretKey);
  umi.use(signerIdentity(createSignerFromKeypair(umi, umiAuthorityKp)));

  let signer = createSignerFromKeypair(umi, authority);
  const merkleTree = generateSigner(umi);
  const builder = await createTree(umi, {
    merkleTree,
    treeCreator: signer,
    maxDepth: 16,
    canopyDepth: 8,
    maxBufferSize: 64,
    public: false,
  });
  await builder.sendAndConfirm(umi);
  
  const treePubkey = new PublicKey(merkleTree.publicKey.toString());
  console.log("Merkle tree created:", treePubkey.toString());
  // Wait for the account to be fully propagated on-chain
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
  
  // Verify the account exists and can be fetched
  try {
    const accountInfo = await provider.connection.getAccountInfo(treePubkey);

    console.log("Account info:", accountInfo);

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