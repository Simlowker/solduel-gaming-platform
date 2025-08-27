use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;
use crate::state::{GameAccountOptimized, GameType, GameState, GameMove};
use crate::errors::GameError;
use crate::events::*;

pub fn commit_move(ctx: Context<CommitMove>, move_hash: [u8; 32]) -> Result<()> {
    let mut game = ctx.accounts.game.load_mut()?;
    let clock = Clock::get()?;
    
    // Validate game state
    require!(
        game.game_state() == GameState::Active,
        GameError::InvalidGameState
    );
    
    require!(
        game.game_type() == GameType::SimpleDuel,
        GameError::InvalidGameType
    );
    
    // Check if player is in the game
    let player_key = ctx.accounts.player.key();
    let mut player_index = None;
    for i in 0..game.player_count as usize {
        if game.players[i] == player_key {
            player_index = Some(i);
            break;
        }
    }
    let player_index = player_index.ok_or(GameError::UnauthorizedPlayer)?;
    
    // Check if move already submitted
    require!(
        game.commit_hashes[player_index] == [0; 32],
        GameError::MoveAlreadySubmitted
    );
    
    // Store commit hash
    game.commit_hashes[player_index] = move_hash;
    let start_time = game.start_time();
    game.set_timestamps(start_time, clock.unix_timestamp as u32);
    
    // Check if all players have committed
    let mut all_committed = true;
    for i in 0..game.player_count as usize {
        if game.commit_hashes[i] == [0; 32] {
            all_committed = false;
            break;
        }
    }
    
    if all_committed {
        let game_type = game.game_type();
        game.set_type_and_state(game_type, GameState::Resolving);
    }
    
    // Emit event
    emit!(MoveCommitted {
        game_id: game.game_id,
        player: player_key,
        move_hash,
        round: game.current_round(),
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

pub fn reveal_move(
    ctx: Context<RevealMove>,
    game_move: GameMove,
    nonce: [u8; 32],
) -> Result<()> {
    let mut game = ctx.accounts.game.load_mut()?;
    let clock = Clock::get()?;
    
    // Validate game state
    require!(
        game.game_state() == GameState::Resolving,
        GameError::InvalidGameState
    );
    
    // Get player index
    let player_key = ctx.accounts.player.key();
    let mut player_index = None;
    for i in 0..game.player_count as usize {
        if game.players[i] == player_key {
            player_index = Some(i);
            break;
        }
    }
    let player_index = player_index.ok_or(GameError::UnauthorizedPlayer)?;
    
    // Verify commitment
    let move_bytes = game_move.try_to_vec()?;
    let mut data_to_hash = move_bytes;
    data_to_hash.extend_from_slice(&nonce);
    let computed_hash = hash(&data_to_hash);
    
    require!(
        computed_hash.to_bytes() == game.commit_hashes[player_index],
        GameError::InvalidReveal
    );
    
    // Store revealed move (pack into single byte)
    let move_byte = match game_move {
        GameMove::None => 0,
        GameMove::Rock => 1,
        GameMove::Paper => 2,
        GameMove::Scissors => 3,
        GameMove::Heads => 4,
        GameMove::Tails => 5,
        GameMove::Number(n) => 6 + n,
    };
    game.reveals_packed[player_index] = move_byte;
    let start_time = game.start_time();
    game.set_timestamps(start_time, clock.unix_timestamp as u32);
    
    // Check if all players have revealed
    let mut all_revealed = true;
    for i in 0..game.player_count as usize {
        if game.reveals_packed[i] == 0 {
            all_revealed = false;
            break;
        }
    }
    
    if all_revealed {
        // Determine winner
        determine_winner(&mut *game)?;
        let game_type = game.game_type();
        game.set_type_and_state(game_type, GameState::Completed);
        let start = game.start_time();
        game.set_timestamps(start, clock.unix_timestamp as u32);
    }
    
    // Emit event
    emit!(MoveRevealed {
        game_id: game.game_id,
        player: player_key,
        game_move,
        round: game.current_round(),
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

// Helper function to unpack move from byte
fn unpack_move(byte: u8) -> GameMove {
    match byte {
        0 => GameMove::None,
        1 => GameMove::Rock,
        2 => GameMove::Paper,
        3 => GameMove::Scissors,
        4 => GameMove::Heads,
        5 => GameMove::Tails,
        n if n >= 6 => GameMove::Number(n - 6),
        _ => GameMove::None,
    }
}

fn determine_winner(game: &mut GameAccountOptimized) -> Result<()> {
    if game.player_count != 2 {
        return Err(GameError::InvalidGameState.into());
    }
    
    // Unpack moves from bytes
    let move1 = unpack_move(game.reveals_packed[0]);
    let move2 = unpack_move(game.reveals_packed[1]);
    
    let winner_index = match (move1, move2) {
        (GameMove::Rock, GameMove::Scissors) |
        (GameMove::Paper, GameMove::Rock) |
        (GameMove::Scissors, GameMove::Paper) => Some(0),
        
        (GameMove::Scissors, GameMove::Rock) |
        (GameMove::Rock, GameMove::Paper) |
        (GameMove::Paper, GameMove::Scissors) => Some(1),
        
        _ => None, // Draw
    };
    
    if let Some(idx) = winner_index {
        game.winner = game.players[idx];
        game.has_winner = 1;
    }
    
    Ok(())
}

#[derive(Accounts)]
pub struct CommitMove<'info> {
    #[account(mut)]
    pub game: AccountLoader<'info, GameAccountOptimized>,
    
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct RevealMove<'info> {
    #[account(mut)]
    pub game: AccountLoader<'info, GameAccountOptimized>,
    
    pub player: Signer<'info>,
}