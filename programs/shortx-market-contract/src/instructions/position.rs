use crate::{
    constants::POSITION,
    errors::ShortxError,
    state::{MarketState, MintPositionArgs, Position, PositionAccount, PositionStatus},
};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::Token2022,
};
use anchor_spl::{
    metadata::{mpl_token_metadata, Metadata},
};
use mpl_token_metadata::{
     instructions::CreateV1CpiBuilder, types::{Collection, PrintSupply, TokenStandard}
};

use mpl_token_metadata::instructions::MintV1CpiBuilder;

#[derive(Accounts)]
pub struct MintPositionContext<'info> {
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
        constraint = market_positions_account.is_sub_position == false @ ShortxError::UserTradeIsSubUser
    )]
    pub market_positions_account: Box<Account<'info, PositionAccount>>,

    /// CHECK: We create it using metaplex
    #[account(mut)]
    pub nft_mint: AccountInfo<'info>,

    /// CHECK: We create it using anchor-spl
    #[account(mut)]
    pub nft_token_account: AccountInfo<'info>,

    /// CHECK: We create it using metaplex
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,

    /// CHECK: We create it using metaplex
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
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
            .ok_or(ShortxError::OrderNotFound)?;

        let mut position = position_account.positions[position_index];

        // Update position state
        position.is_nft = true;
        position.mint = Some(self.nft_mint.key());
        position.authority = None;

        let nft_name = String::from_utf8(self.market.question.to_vec()).unwrap();

        //Mint NFT operations

        let token_metadata_program = self.token_metadata_program.to_account_info();
        let metadata_account = self.metadata_account.to_account_info();
        let mint_account = self.nft_mint.to_account_info();
        let signer_account = self.signer.to_account_info();
        let master_edition_account = self.master_edition.to_account_info();
        let system_program = self.system_program.to_account_info();
        let token_program = self.token_program.to_account_info();
        let nft_token_account = self.nft_token_account.to_account_info();
        let associated_token_program = self.associated_token_program.to_account_info();
        let market = self.market.to_account_info();

        // Get collection mint from market
        let collection_mint = self.market.collection_mint.ok_or(ShortxError::InvalidCollection)?;

        let mut create_cpi = CreateV1CpiBuilder::new(&token_metadata_program);

        create_cpi.metadata(&metadata_account)
            .mint(&mint_account, true)
            .authority(&market)
            .payer(&signer_account)
            .update_authority(&market, false)
            .master_edition(Some(&master_edition_account))
            .system_program(&system_program)
            .spl_token_program(Some(&token_program))
            .token_standard(TokenStandard::NonFungible)
            .name(nft_name)
            .uri(args.metadata_uri)
            .collection(Collection {
                verified: true,
                key: collection_mint,
            })
            .token_standard(TokenStandard::NonFungible)
            .print_supply(PrintSupply::Zero);

        create_cpi.invoke()?;

        let mut mint_cpi = MintV1CpiBuilder::new(&token_metadata_program);

        mint_cpi
            .token(&nft_token_account)
            .token_owner(Some(&signer_account))
            .metadata(&metadata_account)
            .master_edition(Some(&master_edition_account))
            .mint(&mint_account)
            .payer(&signer_account)
            .authority(&market)
            .system_program(&system_program)
            .spl_token_program(&token_program)
            .spl_ata_program(&associated_token_program)
            .amount(1);

        mint_cpi.invoke()?;

        Ok(())
    }
}
