use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;
use crate::state::*;
use crate::errors::GameError;

pub fn commit_move(ctx: Context<CommitMove>, move_hash: [u8; 32]) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;
    
    // Validate game state
    require!(
        game.state == GameState::Active,
        GameError::InvalidGameState
    );
    
    require!(
        game.game_type == GameType::SimpleDuel,
        GameError::InvalidGameType
    );
    
    // Check if player is in the game
    let player_index = game.players
        .iter()
        .position(|p| p == &ctx.accounts.player.key())
        .ok_or(GameError::UnauthorizedPlayer)?;
    
    // Check if move already submitted
    if player_index < game.commit_hashes.len() {
        require!(
            game.commit_hashes[player_index] == [0; 32],
            GameError::MoveAlreadySubmitted
        );
    }
    
    // Store commit hash
    let players_count = game.players.len();
    if player_index >= game.commit_hashes.len() {
        game.commit_hashes.resize(players_count, [0; 32]);
    }
    game.commit_hashes[player_index] = move_hash;
    game.last_action_time = clock.unix_timestamp;
    
    // Check if all players have committed
    let all_committed = game.commit_hashes
        .iter()
        .all(|h| h != &[0; 32]);
    
    if all_committed {
        game.state = GameState::Resolving;
    }
    
    Ok(())
}

pub fn reveal_move(
    ctx: Context<RevealMove>,
    game_move: GameMove,
    nonce: [u8; 32],
) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;
    
    // Validate game state
    require!(
        game.state == GameState::Resolving,
        GameError::InvalidGameState
    );
    
    // Get player index
    let player_index = game.players
        .iter()
        .position(|p| p == &ctx.accounts.player.key())
        .ok_or(GameError::UnauthorizedPlayer)?;
    
    // Verify commitment
    let move_bytes = game_move.try_to_vec()?;
    let mut data_to_hash = move_bytes;
    data_to_hash.extend_from_slice(&nonce);
    let computed_hash = hash(&data_to_hash);
    
    require!(
        computed_hash.to_bytes() == game.commit_hashes[player_index],
        GameError::InvalidReveal
    );
    
    // Store revealed move
    let players_count = game.players.len();
    if player_index >= game.reveals.len() {
        game.reveals.resize(players_count, GameMove::None);
    }
    game.reveals[player_index] = game_move;
    game.last_action_time = clock.unix_timestamp;
    
    // Check if all players have revealed
    let all_revealed = game.reveals
        .iter()
        .all(|m| !matches!(m, GameMove::None));
    
    if all_revealed {
        // Determine winner
        determine_winner(game)?;
        game.state = GameState::Completed;
        game.end_time = Some(clock.unix_timestamp);
    }
    
    Ok(())
}

fn determine_winner(game: &mut GameAccount) -> Result<()> {
    if game.players.len() != 2 || game.reveals.len() != 2 {
        return Err(GameError::InvalidGameState.into());
    }
    
    let move1 = &game.reveals[0];
    let move2 = &game.reveals[1];
    
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
        game.winner = Some(game.players[idx]);
    }
    
    Ok(())
}

#[derive(Accounts)]
pub struct CommitMove<'info> {
    #[account(mut)]
    pub game: Account<'info, GameAccount>,
    
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct RevealMove<'info> {
    #[account(mut)]
    pub game: Account<'info, GameAccount>,
    
    pub player: Signer<'info>,
}