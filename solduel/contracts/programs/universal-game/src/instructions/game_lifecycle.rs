use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{ConfigurationAccount, GameAccountOptimized, GameType, GameState};
use crate::constants::*;
use crate::errors::GameError;
use crate::events::*;

pub fn create_game(
    ctx: Context<CreateGame>,
    game_type: GameType,
    stake_amount: u64,
    max_players: Option<u8>,
) -> Result<()> {
    let config = &ctx.accounts.config;
    let mut game = ctx.accounts.game.load_init()?;
    let clock = Clock::get()?;
    
    // Validate stake amount
    require!(
        stake_amount >= config.min_stake && stake_amount <= config.max_stake,
        GameError::InvalidConfig
    );
    
    // Initialize game with optimized structure
    game.game_id = config.game_counter;
    game.set_type_and_state(game_type, GameState::Waiting);
    game.creator = ctx.accounts.player.key();
    
    // Initialize player arrays
    game.players[0] = ctx.accounts.player.key();
    game.stakes[0] = stake_amount;
    game.player_count = 1;
    game.pot_total = stake_amount;
    
    // Set rounds
    let max_rounds = match game_type {
        GameType::SimpleDuel => 1,
        GameType::MultiRound => config.max_rounds,
        GameType::Lottery => 1,
    };
    game.set_rounds(0, max_rounds);
    
    // Initialize other fields
    game.action_count = 0;
    game.winner = Pubkey::default();
    game.has_winner = 0;
    game.vrf_result = [0u8; 32];
    game.set_timestamps(clock.unix_timestamp as u32, clock.unix_timestamp as u32);
    game.entry_fee = stake_amount;
    game.platform_fee_collected = 0;
    game.treasury = config.treasury;
    game.flags = 0;
    
    // Transfer stake to vault
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.player.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        stake_amount,
    )?;
    
    // Update game counter
    let config = &mut ctx.accounts.config;
    config.game_counter += 1;
    
    // Get default max players for game type
    let max_default = match game_type {
        GameType::SimpleDuel | GameType::MultiRound => 2,
        GameType::Lottery => MAX_PLAYERS as u8,
    };
    
    // Emit event
    emit!(GameCreated {
        game_id: game.game_id,
        creator: ctx.accounts.player.key(),
        game_type,
        stake_amount,
        max_players: max_players.unwrap_or(max_default),
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
    let mut game = ctx.accounts.game.load_mut()?;
    let clock = Clock::get()?;
    
    // Check game state
    require!(
        game.game_state() == GameState::Waiting,
        GameError::InvalidGameState
    );
    
    // Check if player already joined
    let player_key = ctx.accounts.player.key();
    let mut already_joined = false;
    for i in 0..game.player_count as usize {
        if game.players[i] == player_key {
            already_joined = true;
            break;
        }
    }
    require!(
        !already_joined,
        GameError::PlayerAlreadyJoined
    );
    
    // Check max players
    let max = match game.game_type() {
        GameType::SimpleDuel | GameType::MultiRound => 2,
        GameType::Lottery => MAX_PLAYERS as u8,
    };
    require!(
        game.player_count < max,
        GameError::GameFull
    );
    
    // Add player
    let entry_fee = game.entry_fee;
    let player_index = game.player_count as usize;
    game.players[player_index] = player_key;
    game.stakes[player_index] = entry_fee;
    game.player_count += 1;
    game.pot_total += entry_fee;
    
    // Update timestamp
    let start_time = game.start_time();
    game.set_timestamps(start_time, clock.unix_timestamp as u32);
    
    // Transfer stake to vault
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.player.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        game.entry_fee,
    )?;
    
    // Start game if ready
    if game.game_type() != GameType::Lottery && game.player_count == 2 {
        let game_type = game.game_type();
        game.set_type_and_state(game_type, GameState::Active);
        let max_rounds = game.max_rounds();
        game.set_rounds(1, max_rounds);
    }
    
    // Emit event
    emit!(PlayerJoined {
        game_id: game.game_id,
        player: player_key,
        stake_amount: entry_fee,
        player_count: game.player_count,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

pub fn cancel_game(ctx: Context<CancelGame>) -> Result<()> {
    let mut game = ctx.accounts.game.load_mut()?;
    let clock = Clock::get()?;
    
    // Only creator can cancel waiting games
    require!(
        game.creator == ctx.accounts.player.key(),
        GameError::UnauthorizedPlayer
    );
    
    require!(
        game.game_state() == GameState::Waiting,
        GameError::InvalidGameState
    );
    
    // Mark as cancelled
    let game_type = game.game_type();
    game.set_type_and_state(game_type, GameState::Cancelled);
    let start_time = game.start_time();
    game.set_timestamps(start_time, clock.unix_timestamp as u32);
    
    // Emit event
    emit!(GameCancelled {
        game_id: game.game_id,
        reason: crate::events::CancelReason::CreatorCancelled,
        refund_amount: game.pot_total,
        timestamp: clock.unix_timestamp,
    });
    
    // Refund will be handled separately
    
    Ok(())
}

pub fn force_finish(ctx: Context<ForceFinish>) -> Result<()> {
    let mut game = ctx.accounts.game.load_mut()?;
    let config = &ctx.accounts.config;
    let clock = Clock::get()?;
    
    // Check timeout
    let last_action = game.last_action_time() as i64;
    let elapsed = clock.unix_timestamp - last_action;
    require!(
        elapsed > config.timeout as i64,
        GameError::InvalidGameState
    );
    
    // Determine winner based on last active player
    // (Implementation depends on game type)
    
    let game_type = game.game_type();
    game.set_type_and_state(game_type, GameState::Completed);
    let start_time = game.start_time();
    game.set_timestamps(start_time, clock.unix_timestamp as u32);
    
    // Emit event
    emit!(PlayerTimedOut {
        game_id: game.game_id,
        player: game.creator, // Placeholder - should determine actual player
        penalty_amount: 0,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

#[derive(Accounts)]
pub struct CreateGame<'info> {
    #[account(
        init,
        payer = player,
        space = GameAccountOptimized::LEN,
        seeds = [
            GAME_SEED,
            player.key().as_ref(),
            &config.game_counter.to_le_bytes()
        ],
        bump
    )]
    pub game: AccountLoader<'info, GameAccountOptimized>,
    
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, ConfigurationAccount>,
    
    /// CHECK: Vault account for holding stakes
    #[account(
        mut,
        seeds = [
            VAULT_SEED,
            &config.game_counter.to_le_bytes()
        ],
        bump
    )]
    pub vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
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
pub struct CancelGame<'info> {
    #[account(mut)]
    pub game: AccountLoader<'info, GameAccountOptimized>,
    
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct ForceFinish<'info> {
    #[account(mut)]
    pub game: AccountLoader<'info, GameAccountOptimized>,
    
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, ConfigurationAccount>,
    
    pub player: Signer<'info>,
}