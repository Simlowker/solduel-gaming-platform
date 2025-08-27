use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;
use crate::constants::*;
use crate::errors::GameError;

pub fn enter_lottery(ctx: Context<EnterLottery>, num_tickets: u32) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;
    
    // Validate game state
    require!(
        game.state == GameState::Waiting || game.state == GameState::Active,
        GameError::InvalidGameState
    );
    
    require!(
        game.game_type == GameType::Lottery,
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
        if game.players.len() >= MAX_PLAYERS {
            break;
        }
        game.players.push(ctx.accounts.player.key());
        game.stakes.push(LOTTERY_TICKET_PRICE);
    }
    
    game.pot_total += total_cost;
    game.last_action_time = clock.unix_timestamp;
    
    // Activate lottery if first entry
    if game.state == GameState::Waiting {
        game.state = GameState::Active;
    }
    
    Ok(())
}

pub fn draw_lottery(ctx: Context<DrawLottery>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;
    
    // Validate lottery is ready for drawing
    require!(
        game.state == GameState::Active,
        GameError::InvalidGameState
    );
    
    require!(
        game.game_type == GameType::Lottery,
        GameError::InvalidGameType
    );
    
    // Check if enough time has passed
    let elapsed = clock.unix_timestamp - game.start_time;
    require!(
        elapsed >= LOTTERY_DRAW_INTERVAL,
        GameError::LotteryNotReady
    );
    
    // Need participants
    require!(
        !game.players.is_empty(),
        GameError::NoLotteryParticipants
    );
    
    // Use simple randomness for now (should use VRF in production)
    let random_seed = clock.unix_timestamp as u64;
    let winner_index = (random_seed % game.players.len() as u64) as usize;
    
    // Set winner
    game.winner = Some(game.players[winner_index]);
    game.state = GameState::Completed;
    game.end_time = Some(clock.unix_timestamp);
    
    Ok(())
}

pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
    let game = &ctx.accounts.game;
    let config = &ctx.accounts.config;
    
    // Game must be completed
    require!(
        game.state == GameState::Completed,
        GameError::InvalidGameState
    );
    
    // Player must be the winner
    require!(
        Some(ctx.accounts.player.key()) == game.winner,
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
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;
    
    // Must be in resolving state
    require!(
        game.state == GameState::Resolving,
        GameError::InvalidGameState
    );
    
    // For multi-round games, determine winner based on final reveal
    if game.game_type == GameType::MultiRound {
        // Simple random selection for now
        let random_seed = clock.unix_timestamp as u64;
        let winner_index = (random_seed % game.players.len() as u64) as usize;
        game.winner = Some(game.players[winner_index]);
    }
    
    game.state = GameState::Completed;
    game.end_time = Some(clock.unix_timestamp);
    
    Ok(())
}

#[derive(Accounts)]
pub struct EnterLottery<'info> {
    #[account(mut)]
    pub game: Account<'info, GameAccount>,
    
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
    pub game: Account<'info, GameAccount>,
    
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub game: Account<'info, GameAccount>,
    
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
    pub game: Account<'info, GameAccount>,
    
    pub player: Signer<'info>,
}