use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{ConfigurationAccount, GameAccountOptimized, GameType, GameState};
use crate::constants::*;
use crate::errors::GameError;

pub fn enter_lottery(ctx: Context<EnterLottery>, num_tickets: u32) -> Result<()> {
    let mut game = ctx.accounts.game.load_mut()?;
    let clock = Clock::get()?;
    
    // Validate game state
    let game_state = game.game_state();
    require!(
        game_state == GameState::Waiting || game_state == GameState::Active,
        GameError::InvalidGameState
    );
    
    require!(
        game.game_type() == GameType::Lottery,
        GameError::InvalidGameType
    );
    
    // Check ticket limits
    require!(
        num_tickets > 0 && num_tickets <= LOTTERY_MAX_TICKETS_PER_PLAYER,
        GameError::InvalidConfig
    );
    
    // Calculate total cost
    let total_cost = LOTTERY_TICKET_PRICE
        .checked_mul(num_tickets as u64)
        .ok_or(GameError::ArithmeticOverflow)?;
    
    // Transfer payment
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.player.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        total_cost,
    )?;
    
    // Add tickets (each entry is one ticket)
    for _ in 0..num_tickets {
        if game.player_count as usize >= MAX_PLAYERS {
            break;
        }
        let player_index = game.player_count as usize;
        game.players[player_index] = ctx.accounts.player.key();
        game.stakes[player_index] = LOTTERY_TICKET_PRICE;
        game.player_count += 1;
    }
    
    game.pot_total += total_cost;
    let current_time = clock.unix_timestamp as u32;
    let start_time = if game.game_state() == GameState::Waiting {
        current_time
    } else {
        game.start_time()
    };
    game.set_timestamps(start_time, current_time);
    
    // Activate lottery if first entry
    if game_state == GameState::Waiting {
        game.set_type_and_state(GameType::Lottery, GameState::Active);
    }
    
    Ok(())
}

pub fn draw_lottery(ctx: Context<DrawLottery>) -> Result<()> {
    let mut game = ctx.accounts.game.load_mut()?;
    let clock = Clock::get()?;
    
    // Validate lottery is ready for drawing
    require!(
        game.game_state() == GameState::Active,
        GameError::InvalidGameState
    );
    
    require!(
        game.game_type() == GameType::Lottery,
        GameError::InvalidGameType
    );
    
    // Check if enough time has passed
    let elapsed = clock.unix_timestamp - game.start_time() as i64;
    require!(
        elapsed >= LOTTERY_DRAW_INTERVAL,
        GameError::LotteryNotReady
    );
    
    // Need participants
    require!(
        game.player_count > 0,
        GameError::NoLotteryParticipants
    );
    
    // Use simple randomness for now (should use VRF in production)
    let random_seed = clock.unix_timestamp as u64;
    let winner_index = (random_seed % game.player_count as u64) as usize;
    
    // Set winner
    game.winner = game.players[winner_index];
    game.has_winner = 1;
    let game_type = game.game_type();
    game.set_type_and_state(game_type, GameState::Completed);
    let current_time = clock.unix_timestamp as u32;
    let start_time = game.start_time();
    game.set_timestamps(start_time, current_time);
    
    Ok(())
}

pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
    let game = ctx.accounts.game.load()?;
    let config = &ctx.accounts.config;
    
    // Game must be completed
    require!(
        game.game_state() == GameState::Completed,
        GameError::InvalidGameState
    );
    
    // Player must be the winner
    require!(
        game.has_winner == 1 && ctx.accounts.player.key() == game.winner,
        GameError::UnauthorizedPlayer
    );
    
    // Calculate winnings (pot minus platform fee)
    let platform_fee = game.pot_total
        .checked_mul(config.platform_fee as u64)
        .ok_or(GameError::ArithmeticOverflow)?
        .checked_div(100)
        .ok_or(GameError::ArithmeticOverflow)?;
    
    let winnings = game.pot_total
        .checked_sub(platform_fee)
        .ok_or(GameError::ArithmeticOverflow)?;
    
    // Transfer winnings from vault to winner
    **ctx.accounts.vault.try_borrow_mut_lamports()? -= winnings;
    **ctx.accounts.player.try_borrow_mut_lamports()? += winnings;
    
    // Transfer platform fee to treasury
    if platform_fee > 0 {
        **ctx.accounts.vault.try_borrow_mut_lamports()? -= platform_fee;
        **ctx.accounts.treasury.try_borrow_mut_lamports()? += platform_fee;
    }
    
    Ok(())
}

pub fn resolve_game(ctx: Context<ResolveGame>) -> Result<()> {
    let mut game = ctx.accounts.game.load_mut()?;
    let clock = Clock::get()?;
    
    // Must be in resolving state
    require!(
        game.game_state() == GameState::Resolving,
        GameError::InvalidGameState
    );
    
    // For multi-round games, determine winner based on final reveal
    if game.game_type() == GameType::MultiRound {
        // Simple random selection for now
        let random_seed = clock.unix_timestamp as u64;
        let winner_index = (random_seed % game.player_count as u64) as usize;
        game.winner = game.players[winner_index];
        game.has_winner = 1;
    }
    
    let game_type = game.game_type();
    game.set_type_and_state(game_type, GameState::Completed);
    let current_time = clock.unix_timestamp as u32;
    let start_time = game.start_time();
    game.set_timestamps(start_time, current_time);
    
    Ok(())
}

#[derive(Accounts)]
pub struct EnterLottery<'info> {
    #[account(mut)]
    pub game: AccountLoader<'info, GameAccountOptimized>,
    
    /// CHECK: Vault account for holding stakes
    #[account(mut)]
    pub vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DrawLottery<'info> {
    #[account(mut)]
    pub game: AccountLoader<'info, GameAccountOptimized>,
    
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub game: AccountLoader<'info, GameAccountOptimized>,
    
    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, ConfigurationAccount>,
    
    /// CHECK: Vault account holding the pot
    #[account(mut)]
    pub vault: AccountInfo<'info>,
    
    /// CHECK: Treasury account for platform fees
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    
    #[account(mut)]
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveGame<'info> {
    #[account(mut)]
    pub game: AccountLoader<'info, GameAccountOptimized>,
    
    pub player: Signer<'info>,
}