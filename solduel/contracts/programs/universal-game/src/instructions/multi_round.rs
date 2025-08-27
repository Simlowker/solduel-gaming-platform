use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{GameAccountOptimized, GameType, GameState, BetAction};
use crate::errors::GameError;

pub fn place_bet(ctx: Context<PlaceBet>, action: BetAction) -> Result<()> {
    let mut game = ctx.accounts.game.load_mut()?;
    let clock = Clock::get()?;
    
    // Validate game state
    require!(
        game.game_state() == GameState::Active,
        GameError::InvalidGameState
    );
    
    require!(
        game.game_type() == GameType::MultiRound,
        GameError::InvalidGameType
    );
    
    // Get player index
    let player_index = game.players[..game.player_count as usize]
        .iter()
        .position(|p| p == &ctx.accounts.player.key())
        .ok_or(GameError::UnauthorizedPlayer)?;
    
    // Process betting action
    match action {
        BetAction::Check => {
            // Check is allowed if no bet is pending
            let action_count = game.action_count;
            if action_count < 50 {
                game.action_history_packed[action_count as usize] = 0; // Check = 0
                game.action_count += 1;
            }
        },
        BetAction::Call => {
            // Match the current bet
            let current_bet = calculate_current_bet(&*game)?;
            let player_bet = game.stakes[player_index];
            let call_amount = current_bet.saturating_sub(player_bet);
            
            if call_amount > 0 {
                // Transfer additional stake
                system_program::transfer(
                    CpiContext::new(
                        ctx.accounts.system_program.to_account_info(),
                        system_program::Transfer {
                            from: ctx.accounts.player.to_account_info(),
                            to: ctx.accounts.vault.to_account_info(),
                        },
                    ),
                    call_amount,
                )?;
                
                game.stakes[player_index] += call_amount;
                game.pot_total += call_amount;
            }
            
            let action_count = game.action_count;
            if action_count < 50 {
                game.action_history_packed[action_count as usize] = 1; // Call = 1
                game.action_count += 1;
            }
        },
        BetAction::Raise(amount) => {
            // Raise the bet
            let current_bet = calculate_current_bet(&*game)?;
            require!(amount > current_bet, GameError::InvalidBetAction);
            
            let raise_amount = amount - game.stakes[player_index];
            
            // Transfer raise amount
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.player.to_account_info(),
                        to: ctx.accounts.vault.to_account_info(),
                    },
                ),
                raise_amount,
            )?;
            
            game.stakes[player_index] += raise_amount;
            game.pot_total += raise_amount;
            let action_count = game.action_count;
            if action_count < 50 {
                game.action_history_packed[action_count as usize] = 2; // Raise = 2
                game.action_count += 1;
            }
        },
        BetAction::Fold => {
            // Folding forfeits the game
            require!(
                game.current_round() < game.max_rounds(),
                GameError::CannotFoldFinalRound
            );
            
            // Other player wins
            let winner_index = if player_index == 0 { 1 } else { 0 };
            game.winner = game.players[winner_index];
            game.has_winner = 1;
            let game_type = game.game_type();
            game.set_type_and_state(game_type, GameState::Completed);
            let current_time = clock.unix_timestamp as u32;
            let start_time = game.start_time();
    game.set_timestamps(start_time, current_time);
            let action_count = game.action_count;
            if action_count < 50 {
                game.action_history_packed[action_count as usize] = 3; // Fold = 3
                game.action_count += 1;
            }
        },
    }
    
    let current_time = clock.unix_timestamp as u32;
    let start_time = game.start_time();
    game.set_timestamps(start_time, current_time);
    
    // Check if round is complete
    if should_advance_round(&*game) {
        let current_round = game.current_round();
        let max_rounds = game.max_rounds();
        game.set_rounds(current_round + 1, max_rounds);
        
        if current_round + 1 > max_rounds {
            // Game complete - determine winner based on random reveal
            let game_type = game.game_type();
            game.set_type_and_state(game_type, GameState::Resolving);
        }
    }
    
    Ok(())
}

fn calculate_current_bet(game: &GameAccountOptimized) -> Result<u64> {
    // Find the highest stake among active players
    Ok(game.stakes[..game.player_count as usize].iter().max().copied().unwrap_or(0))
}

fn should_advance_round(game: &GameAccountOptimized) -> bool {
    // Round advances when all players have acted equally
    // This is simplified - real implementation would track betting rounds properly
    if game.player_count == 0 {
        return false;
    }
    game.action_count % game.player_count == 0
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub game: AccountLoader<'info, GameAccountOptimized>,
    
    /// CHECK: Vault account for holding stakes
    #[account(mut)]
    pub vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}