use crate::{
    constants::POSITION,
    errors::ShortxError,
    state::{ MarketState, MintPositionArgs, Position, PositionAccount, PositionStatus},
};
use anchor_lang::prelude::*;
use anchor_spl::metadata::{mpl_token_metadata, Metadata};
use anchor_spl::{associated_token::AssociatedToken, token_2022::Token2022};
use mpl_token_metadata::{
    instructions::{CreateV1CpiBuilder, SetAndVerifyCollectionCpiBuilder},
    types::{Collection, PrintSupply, TokenStandard},
};

use mpl_token_metadata::instructions::MintV1CpiBuilder;

#[derive(Accounts)]
pub struct MintPositionContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        constraint = market.market_id == market_positions_account.market_id @ ShortxError::InvalidMarketId,
        constraint = market.authority == collection_authority.key() @ ShortxError::InvalidAuthority
    )] // Market
    pub market: Box<Account<'info, MarketState>>,

    #[account(mut)]
    pub market_positions_account: Box<Account<'info, PositionAccount>>,

    /// CHECK: mint needs to be a signer to create the NFT
    #[account(mut)]
    pub nft_mint: Signer<'info>,

    /// CHECK: We create it using anchor-spl
    #[account(mut)]
    pub nft_token_account: AccountInfo<'info>,

    /// CHECK: We create it using metaplex
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,

    /// CHECK: We create it using metaplex
    #[account(mut)]
    pub master_edition: AccountInfo<'info>,

    /// CHECK: Collection mint account
    #[account(mut)]
    pub collection_mint: AccountInfo<'info>,

    /// CHECK: Collection metadata account
    #[account(mut)]
    pub collection_metadata: AccountInfo<'info>,

    /// CHECK: Collection authority account - must be the market authority
    #[account(mut)]
    pub collection_authority: Signer<'info>,

    /// CHECK: Collection master edition account
    #[account(mut)]
    pub collection_master_edition: AccountInfo<'info>,

    pub token_program: Program<'info, Token2022>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    /// CHECK: This is the instructions sysvar
    pub sysvar_instructions: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(sub_position_key: Pubkey)]
pub struct SubPositionContext<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        constraint = market.market_id == market_positions_account.market_id @ ShortxError::InvalidMarketId
    )] // Market
    pub market: Box<Account<'info, MarketState>>,

    #[account(
        mut,
        seeds = [POSITION.as_bytes(), market.market_id.to_le_bytes().as_ref()],
        bump,
        constraint = market_positions_account.is_sub_position == false @ ShortxError::UserTradeIsSubUser,
        constraint = market_positions_account.market_id == market.market_id @ ShortxError::InvalidMarketId
    )]
    pub market_positions_account: Box<Account<'info, PositionAccount>>,

    #[account(
        init,
        payer = signer,
        space = 8 + PositionAccount::INIT_SPACE,
        seeds = [POSITION.as_bytes(), market_positions_account.market_id.to_le_bytes().as_ref(), sub_position_key.key().as_ref()],
        bump
    )]
    pub sub_market_positions: Box<Account<'info, PositionAccount>>,

    pub system_program: Program<'info, System>,
}

impl<'info> SubPositionContext<'info> {
    pub fn create_sub_position_account(
        &mut self,
        _sub_position_key: Pubkey,
        bumps: &SubPositionContextBumps,
    ) -> Result<()> {
        let market_positions = &mut self.market_positions_account;
        let sub_market_positions = &mut self.sub_market_positions;

        let nonce = market_positions.nonce.checked_add(1).unwrap();

        market_positions.nonce = nonce;

        sub_market_positions.set_inner(PositionAccount {
            bump: bumps.sub_market_positions,
            authority: self.signer.key(),
            version: 0,
            positions: [Position::default(); 10],
            nonce,
            market_id: market_positions.market_id,
            is_sub_position: true,
            padding: [0; 25],
        });

        Ok(())
    }
}

impl<'info> MintPositionContext<'info> {
    pub fn mint_position(&mut self, args: MintPositionArgs) -> Result<()> {
        // modify position state operations
        let position_account = &mut self.market_positions_account;
        let position_index = position_account
            .positions
            .iter()
            .position(|order| {
                order.position_id == args.position_id
                    && order.position_status == PositionStatus::Open
                    && order.market_id == self.market.market_id
            })
            .ok_or(ShortxError::PositionNotFound)?;

        let mut position = position_account.positions[position_index];
        // Update position state
        position.is_nft = true;
        position.mint = Some(self.nft_mint.key());
        position.authority = Some(self.signer.key());  // Keep the original position owner as authority
        
        // Update the position in the account
        position_account.positions[position_index] = position;

        let nft_name = format!("SHORTX - {}", self.market.market_id);
        msg!("position accounts modified");

        let token_metadata_program = self.token_metadata_program.to_account_info();
        let metadata_account = self.metadata_account.to_account_info();
        let mint_account = self.nft_mint.to_account_info();
        let signer_account = self.signer.to_account_info();
        let nft_token_account = self.nft_token_account.to_account_info();
        let associated_token_program = self.associated_token_program.to_account_info();
        let master_edition_account = self.master_edition.to_account_info();
        let system_program = self.system_program.to_account_info();
        let token_program = self.token_program.to_account_info();
        
        // Get collection mint from market
        let collection_mint_info = self.market.nft_collection_mint.ok_or(ShortxError::InvalidCollection)?;

        msg!("Collection mint: {}", collection_mint_info.to_string());
        msg!("Collection authority key: {}", self.collection_authority.key());
        msg!("Market authority: {}", self.market.authority);

        require!(self.collection_authority.key() == self.market.authority, ShortxError::InvalidAuthority);
        
        let mut create_cpi = CreateV1CpiBuilder::new(&token_metadata_program);
        create_cpi
        .metadata(&metadata_account)
        .mint(&mint_account, true)
        .authority(&self.collection_authority)  // Position owner as authority
        .payer(&signer_account)      // Position owner as payer
        .update_authority(&self.collection_authority, true)  // Market authority as update authority
        .master_edition(Some(&master_edition_account))
        .system_program(&system_program)
        .sysvar_instructions(&self.sysvar_instructions)
        .spl_token_program(Some(&token_program))
        .token_standard(TokenStandard::NonFungible)
        .name(nft_name)
        .uri(args.metadata_uri)
        .seller_fee_basis_points(550)
        .token_standard(TokenStandard::NonFungible)
        .print_supply(PrintSupply::Zero)
        .collection(Collection {
            verified: false,  // We'll verify it after creation
            key: collection_mint_info,
        });

        create_cpi.invoke()?;
        msg!("NFT created");

        //this mints the nft to the user's wallet
        let mut mint_cpi = MintV1CpiBuilder::new(&token_metadata_program);
        msg!("Minting NFT");
        mint_cpi
            .token(&nft_token_account)
            .token_owner(Some(&signer_account))
            .metadata(&metadata_account)
            .master_edition(Some(&master_edition_account))
            .mint(&mint_account)
            .payer(&signer_account)
            .authority(&self.collection_authority)  // Position owner as authority for minting
            .system_program(&system_program)
            .spl_token_program(&token_program)
            .spl_ata_program(&associated_token_program)
            .sysvar_instructions(&self.sysvar_instructions)
            .amount(1);

        mint_cpi.invoke()?;
        msg!("Minted NFT");

        // Now verify the collection
        msg!("Verifying collection");
        msg!("Collection authority: {}", self.collection_authority.key());
        msg!("Update authority: {}", signer_account.key());
        msg!("Market authority: {}", self.market.authority);
        

        // this sets the collection on the nft and also verifies it in one single instruction.
        let mut verify_cpi = SetAndVerifyCollectionCpiBuilder::new(&token_metadata_program);
        verify_cpi
            .metadata(&metadata_account)
            .collection_authority(&self.collection_authority)
            .payer(&signer_account)
            .update_authority(&self.collection_authority)
            .collection_mint(&self.collection_mint)
            .collection(&self.collection_metadata)
            .collection_master_edition_account(&self.collection_master_edition)
            .collection_authority_record(None);
            
        verify_cpi.invoke()?;
        msg!("Collection verified");

        Ok(())
    }
}
