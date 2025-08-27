use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use crate::state::GameAccountOptimized;
use crate::errors::TokenError;

/// Token configuration for game
#[account]
pub struct TokenConfig {
    /// Accepted token mint (can be SOL or SPL token)
    pub accepted_mint: Pubkey,
    /// Is native SOL
    pub is_native_sol: bool,
    /// Minimum token stake
    pub min_stake: u64,
    /// Maximum token stake
    pub max_stake: u64,
    /// Decimals for the token
    pub decimals: u8,
}

/// Create a game with SPL token stakes
pub fn create_token_game<'info>(
    ctx: Context<CreateTokenGame<'info>>,
    game_type: crate::state::GameType,
    stake_amount: u64,
) -> Result<()> {
    let mut game = ctx.accounts.game.load_init()?;
    let token_config = &ctx.accounts.token_config;
    
    // Validate stake amount
    require!(
        stake_amount >= token_config.min_stake && stake_amount <= token_config.max_stake,
        TokenError::InvalidStakeAmount
    );
    
    // Initialize game with token info
    game.game_id = ctx.accounts.config.game_counter;
    game.set_type_and_state(game_type, crate::state::GameState::Waiting);
    game.creator = ctx.accounts.creator.key();
    game.players[0] = ctx.accounts.creator.key();
    game.stakes[0] = stake_amount;
    game.player_count = 1;
    game.pot_total = stake_amount;
    game.entry_fee = stake_amount;
    
    // Transfer tokens to game vault
    transfer_tokens_to_vault(
        &ctx.accounts.creator_token_account,
        &ctx.accounts.game_vault,
        &ctx.accounts.creator,
        &ctx.accounts.token_program,
        stake_amount,
    )?;
    
    Ok(())
}

/// Join a game with SPL tokens
pub fn join_token_game<'info>(
    ctx: Context<JoinTokenGame<'info>>,
) -> Result<()> {
    let mut game = ctx.accounts.game.load_mut()?;
    
    // Validate player can join
    require!(
        game.player_count < MAX_PLAYERS as u8,
        TokenError::GameFull
    );
    
    // Add player to game
    let player_index = game.player_count as usize;
    game.players[player_index] = ctx.accounts.player.key();
    game.stakes[player_index] = game.entry_fee;
    game.player_count += 1;
    game.pot_total += game.entry_fee;
    
    // Transfer tokens to vault
    transfer_tokens_to_vault(
        &ctx.accounts.player_token_account,
        &ctx.accounts.game_vault,
        &ctx.accounts.player,
        &ctx.accounts.token_program,
        game.entry_fee,
    )?;
    
    Ok(())
}

/// Distribute token winnings
pub fn distribute_token_winnings<'info>(
    ctx: Context<DistributeTokenWinnings<'info>>,
) -> Result<()> {
    let config = &ctx.accounts.config;
    
    // Get game values before mutable borrow
    let game = ctx.accounts.game.load()?;
    let pot_total = game.pot_total;
    let game_creator = game.creator;
    let game_id = game.game_id;
    drop(game); // Release immutable borrow
    
    // Derive the bump for the game PDA
    let (_, game_bump) = Pubkey::find_program_address(
        &[
            b"game",
            game_creator.as_ref(),
            &game_id.to_le_bytes(),
        ],
        ctx.program_id,
    );
    
    // Calculate fees and winner payout
    let platform_fee = (pot_total * config.platform_fee as u64) / 100;
    let winner_payout = pot_total - platform_fee;
    
    // Get game account info for PDA signing
    let game_account_info = ctx.accounts.game.to_account_info();
    
    // Transfer platform fee to treasury
    if platform_fee > 0 {
        transfer_tokens_from_vault(
            &ctx.accounts.game_vault,
            &ctx.accounts.treasury_token_account,
            &game_account_info,
            &ctx.accounts.token_program,
            platform_fee,
            &[&[
                b"game",
                game_creator.as_ref(),
                &game_id.to_le_bytes(),
                &[game_bump],
            ]],
        )?;
    }
    
    // Transfer winnings to winner
    if winner_payout > 0 {
        transfer_tokens_from_vault(
            &ctx.accounts.game_vault,
            &ctx.accounts.winner_token_account,
            &game_account_info,
            &ctx.accounts.token_program,
            winner_payout,
            &[&[
                b"game",
                game_creator.as_ref(),
                &game_id.to_le_bytes(),
                &[game_bump],
            ]],
        )?;
    }
    
    // Mark as distributed (now get mutable reference)
    let mut game = ctx.accounts.game.load_mut()?;
    game.set_flag(crate::state::game_optimized::FLAG_FEES_DISTRIBUTED, true);
    
    Ok(())
}

/// Helper function to transfer tokens to vault
fn transfer_tokens_to_vault<'info>(
    from: &Account<'info, TokenAccount>,
    to: &Account<'info, TokenAccount>,
    authority: &Signer<'info>,
    token_program: &Program<'info, Token>,
    amount: u64,
) -> Result<()> {
    let cpi_accounts = Transfer {
        from: from.to_account_info(),
        to: to.to_account_info(),
        authority: authority.to_account_info(),
    };
    
    let cpi_program = token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, amount)?;
    
    Ok(())
}

/// Helper function to transfer tokens from vault with PDA signer
fn transfer_tokens_from_vault<'info>(
    from: &Account<'info, TokenAccount>,
    to: &Account<'info, TokenAccount>,
    authority: &AccountInfo<'info>,
    token_program: &Program<'info, Token>,
    amount: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let cpi_accounts = Transfer {
        from: from.to_account_info(),
        to: to.to_account_info(),
        authority: authority.clone(),
    };
    
    let cpi_program = token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    
    token::transfer(cpi_ctx, amount)?;
    
    Ok(())
}

/// Create token game context
#[derive(Accounts)]
pub struct CreateTokenGame<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        init,
        payer = creator,
        space = GameAccountOptimized::LEN,
        seeds = [b"game", creator.key().as_ref(), &config.game_counter.to_le_bytes()],
        bump
    )]
    pub game: AccountLoader<'info, GameAccountOptimized>,
    
    #[account(mut)]
    pub config: Account<'info, crate::state::ConfigurationAccount>,
    
    pub token_config: Account<'info, TokenConfig>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = creator
    )]
    pub creator_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = token_mint,
        associated_token::authority = game
    )]
    pub game_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/// Join token game context
#[derive(Accounts)]
pub struct JoinTokenGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    
    #[account(
        mut
    )]
    pub game: AccountLoader<'info, GameAccountOptimized>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = player
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = game
    )]
    pub game_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Distribute token winnings context
#[derive(Accounts)]
pub struct DistributeTokenWinnings<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut
    )]
    pub game: AccountLoader<'info, GameAccountOptimized>,
    
    pub config: Account<'info, crate::state::ConfigurationAccount>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = game
    )]
    pub game_vault: Account<'info, TokenAccount>,
    
    /// CHECK: Winner pubkey from game account
    pub winner: AccountInfo<'info>,
    
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = token_mint,
        associated_token::authority = winner
    )]
    pub winner_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: Treasury pubkey from config
    pub treasury: AccountInfo<'info>,
    
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = token_mint,
        associated_token::authority = treasury
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// TokenError is imported from crate::errors

use crate::constants::MAX_PLAYERS;