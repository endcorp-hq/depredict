use crate::{
    constants::POSITION,
    errors::ShortxError,
    state::{ MarketState, MintPositionArgs, Position, PositionAccount, PositionStatus},
};
use anchor_lang::prelude::*;
use anchor_spl::{
    token::Token,
    associated_token::AssociatedToken
};


use mpl_core::{
    ID as MPL_CORE_ID,
    instructions::{
        CreateV2CpiBuilder
    },
    types::{
        Attribute, 
        Attributes, 
        Plugin, 
        PluginAuthorityPair, 
        PluginAuthority
    },
};

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


    /// CHECK: Collection authority account - must be the market authority
    #[account(mut)]
    pub collection_authority: Signer<'info>,


    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    /// CHECK: This is the instructions sysvar
    pub sysvar_instructions: AccountInfo<'info>,
    #[account(address = MPL_CORE_ID)]
    /// CHECK: this account is checked by the address constraint
    pub mpl_core_program: UncheckedAccount<'info>,

    #[account(mut, constraint = collection.key() == market.nft_collection.unwrap() @ ShortxError::InvalidCollection)]
    /// CHECK: this account is checked by the address constraint
    pub collection: AccountInfo<'info>,
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
        // position.mint = Some(self.nft_mint.key());
        position.authority = Some(Pubkey::default());  // Change the authority to default pubkey
        
        // Update the position in the account
        position_account.positions[position_index] = position;

        let nft_name = format!("SHORTX - {}", self.market.market_id);
        msg!("position accounts modified");

        
        let signer_account = self.signer.to_account_info();
        let system_program = self.system_program.to_account_info();
        


        msg!("Market authority: {}", self.market.authority);

        require!(self.collection_authority.key() == self.market.authority, ShortxError::InvalidAuthority);

        // Add attributes to the NFT
        msg!("Adding attributes to NFT");
        let attributes = Attributes {
            attribute_list: vec![
                Attribute {
                    key: "market_id".to_string(),
                    value: self.market.market_id.to_string(),
                },
                Attribute {
                    key: "position_id".to_string(),
                    value: position.position_id.to_string(),
                },
                Attribute {
                    key: "position_amount".to_string(),
                    value: position.amount.to_string(),
                },
            ],
        };

        msg!("Create the asset");
        let mpl_core_program = &self.mpl_core_program.to_account_info();

        let mut create_asset_cpi = CreateV2CpiBuilder::new(mpl_core_program);
        create_asset_cpi
        .asset(&position_account.to_account_info())
        .name(nft_name)
        .uri(args.metadata_uri)
        .collection(Some(&self.collection.to_account_info()))
        .authority(Some(&self.collection_authority))
        .payer(&signer_account)
        .plugins(vec![PluginAuthorityPair {
            plugin: Plugin::Attributes(attributes),
            authority: Some(PluginAuthority::UpdateAuthority),
        }])
        .system_program(&system_program)
        .invoke_signed(&[&[
            b"collection",
            &self.market.market_id.to_le_bytes(),
            &[self.market.bump]
        ]])?; // this is the collection seeds, to review

        Ok(())
    }
}
