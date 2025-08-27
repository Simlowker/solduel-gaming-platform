use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;
use crate::errors::GameError;

pub fn place_bet(ctx: Context<PlaceBet>, action: BetAction) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;
    
    // Validate game state
    require!(
        game.state == GameState::Active,
        GameError::InvalidGameState
    );
    
    require!(
        game.game_type == GameType::MultiRound,
        GameError::InvalidGameType
    );
    
    // Get player index
    let player_index = game.players
        .iter()
        .position(|p| p == &ctx.accounts.player.key())
        .ok_or(GameError::UnauthorizedPlayer)?;
    
    // Process betting action
    match action {
        BetAction::Check => {
            // Check is allowed if no bet is pending
            game.action_history.push(action);
        },
        BetAction::Call => {
            // Match the current bet
            let current_bet = calculate_current_bet(game)?;
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
            
            game.action_history.push(action);
        },
        BetAction::Raise(amount) => {
            // Raise the bet
            let current_bet = calculate_current_bet(game)?;
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
            game.action_history.push(action);
        },
        BetAction::Fold => {
            // Folding forfeits the game
            require!(
                game.current_round < game.max_rounds,
                GameError::CannotFoldFinalRound
            );
            
            // Other player wins
            let winner_index = if player_index == 0 { 1 } else { 0 };
            game.winner = Some(game.players[winner_index]);
            game.state = GameState::Completed;
            game.end_time = Some(clock.unix_timestamp);
            game.action_history.push(action);
        },
    }
    
    game.last_action_time = clock.unix_timestamp;
    
    // Check if round is complete
    if should_advance_round(game) {
        game.current_round += 1;
        
        if game.current_round > game.max_rounds {
            // Game complete - determine winner based on random reveal
            game.state = GameState::Resolving;
        }
    }
    
    Ok(())
}

fn calculate_current_bet(game: &GameAccount) -> Result<u64> {
    // Find the highest stake among active players
    Ok(game.stakes.iter().max().copied().unwrap_or(0))
}

fn should_advance_round(game: &GameAccount) -> bool {
    // Round advances when all players have acted equally
    // This is simplified - real implementation would track betting rounds properly
    game.action_history.len() % game.players.len() == 0
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub game: Account<'info, GameAccount>,
    
    /// CHECK: Vault account for holding stakes
    #[account(mut)]
    pub vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}