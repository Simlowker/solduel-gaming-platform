use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;
use crate::constants::*;
use crate::errors::GameError;

pub fn create_game(
    ctx: Context<CreateGame>,
    game_type: GameType,
    stake_amount: u64,
    max_players: Option<u8>,
) -> Result<()> {
    let config = &ctx.accounts.config;
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;
    
    // Validate stake amount
    require!(
        stake_amount >= config.min_stake && stake_amount <= config.max_stake,
        GameError::InvalidConfig
    );
    
    // Initialize game
    game.game_id = config.game_counter;
    game.game_type = game_type;
    game.state = GameState::Waiting;
    game.creator = ctx.accounts.player.key();
    game.players = vec![ctx.accounts.player.key()];
    game.stakes = vec![stake_amount];
    game.pot_total = stake_amount;
    game.current_round = 0;
    game.max_rounds = match game_type {
        GameType::SimpleDuel => 1,
        GameType::MultiRound => config.max_rounds,
        GameType::Lottery => 1,
    };
    game.commit_hashes = vec![];
    game.reveals = vec![];
    game.action_history = vec![];
    game.winner = None;
    game.random_result = None;
    game.start_time = clock.unix_timestamp;
    game.end_time = None;
    game.last_action_time = clock.unix_timestamp;
    game.entry_fee = stake_amount;
    game.reserved = [0; 64];
    
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
    
    Ok(())
}

pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;
    
    // Check game state
    require!(
        game.state == GameState::Waiting,
        GameError::InvalidGameState
    );
    
    // Check if player already joined
    require!(
        !game.players.contains(&ctx.accounts.player.key()),
        GameError::PlayerAlreadyJoined
    );
    
    // Check max players
    let max = match game.game_type {
        GameType::SimpleDuel | GameType::MultiRound => 2,
        GameType::Lottery => MAX_PLAYERS,
    };
    require!(
        game.players.len() < max,
        GameError::GameFull
    );
    
    // Add player
    let entry_fee = game.entry_fee;
    game.players.push(ctx.accounts.player.key());
    game.stakes.push(entry_fee);
    game.pot_total += entry_fee;
    game.last_action_time = clock.unix_timestamp;
    
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
    if game.game_type != GameType::Lottery && game.players.len() == 2 {
        game.state = GameState::Active;
        game.current_round = 1;
    }
    
    Ok(())
}

pub fn cancel_game(ctx: Context<CancelGame>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;
    
    // Only creator can cancel waiting games
    require!(
        game.creator == ctx.accounts.player.key(),
        GameError::UnauthorizedPlayer
    );
    
    require!(
        game.state == GameState::Waiting,
        GameError::InvalidGameState
    );
    
    // Mark as cancelled
    game.state = GameState::Cancelled;
    game.end_time = Some(clock.unix_timestamp);
    
    // Refund will be handled separately
    
    Ok(())
}

pub fn force_finish(ctx: Context<ForceFinish>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let config = &ctx.accounts.config;
    let clock = Clock::get()?;
    
    // Check timeout
    let elapsed = clock.unix_timestamp - game.last_action_time;
    require!(
        elapsed > config.timeout as i64,
        GameError::InvalidGameState
    );
    
    // Determine winner based on last active player
    // (Implementation depends on game type)
    
    game.state = GameState::Completed;
    game.end_time = Some(clock.unix_timestamp);
    
    Ok(())
}

#[derive(Accounts)]
pub struct CreateGame<'info> {
    #[account(
        init,
        payer = player,
        space = GameAccount::LEN,
        seeds = [
            GAME_SEED,
            player.key().as_ref(),
            &config.game_counter.to_le_bytes()
        ],
        bump
    )]
    pub game: Account<'info, GameAccount>,
    
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
    pub game: Account<'info, GameAccount>,
    
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
    pub game: Account<'info, GameAccount>,
    
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct ForceFinish<'info> {
    #[account(mut)]
    pub game: Account<'info, GameAccount>,
    
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, ConfigurationAccount>,
    
    pub player: Signer<'info>,
}