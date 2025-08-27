use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{ConfigurationAccount, GameAccountOptimized};
use crate::events::FeesCollected;
use crate::errors::TreasuryError;

/// Treasury fee collection and distribution logic
pub fn collect_platform_fee<'info>(
    game: &mut Account<'info, GameAccountOptimized>,
    config: &Account<'info, ConfigurationAccount>,
    treasury: &AccountInfo<'info>,
    system_program: &Program<'info, System>,
) -> Result<()> {
    // Check if fees have already been distributed
    require!(
        !game.get_flag(crate::state::game_optimized::FLAG_FEES_DISTRIBUTED),
        TreasuryError::FeesAlreadyDistributed
    );
    
    // Calculate platform fee
    let platform_fee_percentage = config.platform_fee as u64;
    let platform_fee_amount = (game.pot_total * platform_fee_percentage) / 100;
    
    // Store fee amount in game account
    game.platform_fee_collected = platform_fee_amount;
    game.treasury = treasury.key();
    
    // Transfer fee to treasury
    if platform_fee_amount > 0 {
        let cpi_context = CpiContext::new(
            system_program.to_account_info(),
            system_program::Transfer {
                from: game.to_account_info(),
                to: treasury.clone(),
            },
        );
        
        system_program::transfer(cpi_context, platform_fee_amount)?;
        
        // Emit event
        emit!(FeesCollected {
            game_id: game.game_id,
            treasury: treasury.key(),
            amount: platform_fee_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
    }
    
    // Mark fees as distributed
    game.set_flag(crate::state::game_optimized::FLAG_FEES_DISTRIBUTED, true);
    
    Ok(())
}

/// Calculate winner payout after fees
pub fn calculate_winner_payout(
    pot_total: u64,
    platform_fee_percentage: u8,
) -> (u64, u64) {
    let platform_fee = (pot_total * platform_fee_percentage as u64) / 100;
    let winner_payout = pot_total - platform_fee;
    
    (winner_payout, platform_fee)
}

/// Distribute winnings with automatic fee collection
pub fn distribute_winnings_with_fees<'info>(
    game: &mut Account<'info, GameAccountOptimized>,
    config: &Account<'info, ConfigurationAccount>,
    winner: &AccountInfo<'info>,
    treasury: &AccountInfo<'info>,
    system_program: &Program<'info, System>,
) -> Result<()> {
    // Ensure game is completed
    require!(
        game.game_state() == crate::state::GameState::Completed,
        TreasuryError::GameNotCompleted
    );
    
    // Ensure winner is set
    require!(
        game.winner.is_some(),
        TreasuryError::NoWinnerSet
    );
    
    // Verify winner account
    require!(
        game.winner.unwrap() == winner.key(),
        TreasuryError::InvalidWinner
    );
    
    // Calculate payouts
    let (winner_payout, platform_fee) = calculate_winner_payout(
        game.pot_total,
        config.platform_fee,
    );
    
    // Transfer platform fee to treasury
    if platform_fee > 0 {
        let treasury_transfer = CpiContext::new(
            system_program.to_account_info(),
            system_program::Transfer {
                from: game.to_account_info(),
                to: treasury.clone(),
            },
        );
        
        system_program::transfer(treasury_transfer, platform_fee)?;
        
        game.platform_fee_collected = platform_fee;
        
        emit!(FeesCollected {
            game_id: game.game_id,
            treasury: treasury.key(),
            amount: platform_fee,
            timestamp: Clock::get()?.unix_timestamp,
        });
    }
    
    // Transfer winnings to winner
    if winner_payout > 0 {
        let winner_transfer = CpiContext::new(
            system_program.to_account_info(),
            system_program::Transfer {
                from: game.to_account_info(),
                to: winner.clone(),
            },
        );
        
        system_program::transfer(winner_transfer, winner_payout)?;
    }
    
    // Mark fees as distributed
    game.set_flag(crate::state::game_optimized::FLAG_FEES_DISTRIBUTED, true);
    
    Ok(())
}

/// Refund players with fee deduction for cancelled games
pub fn refund_with_penalty<'info>(
    game: &mut Account<'info, GameAccountOptimized>,
    config: &Account<'info, ConfigurationAccount>,
    player: &AccountInfo<'info>,
    treasury: &AccountInfo<'info>,
    system_program: &Program<'info, System>,
    apply_penalty: bool,
) -> Result<()> {
    // Find player index
    let player_index = game.players
        .iter()
        .take(game.player_count as usize)
        .position(|p| p == &player.key())
        .ok_or(TreasuryError::PlayerNotInGame)?;
    
    // Get player's stake
    let stake = game.stakes[player_index];
    require!(stake > 0, TreasuryError::NoStakeToRefund);
    
    let refund_amount = if apply_penalty {
        // Apply cancellation penalty
        let penalty_percentage = config.fold_penalty as u64;
        let penalty_amount = (stake * penalty_percentage) / 100;
        
        // Transfer penalty to treasury
        if penalty_amount > 0 {
            let penalty_transfer = CpiContext::new(
                system_program.to_account_info(),
                system_program::Transfer {
                    from: game.to_account_info(),
                    to: treasury.clone(),
                },
            );
            
            system_program::transfer(penalty_transfer, penalty_amount)?;
            
            emit!(FeesCollected {
                game_id: game.game_id,
                treasury: treasury.key(),
                amount: penalty_amount,
                timestamp: Clock::get()?.unix_timestamp,
            });
        }
        
        stake - penalty_amount
    } else {
        stake
    };
    
    // Transfer refund to player
    if refund_amount > 0 {
        let refund_transfer = CpiContext::new(
            system_program.to_account_info(),
            system_program::Transfer {
                from: game.to_account_info(),
                to: player.clone(),
            },
        );
        
        system_program::transfer(refund_transfer, refund_amount)?;
    }
    
    // Clear player's stake
    game.stakes[player_index] = 0;
    
    Ok(())
}

/// Batch refund all players (for cancelled games)
pub fn batch_refund_all_players<'info>(
    ctx: Context<BatchRefund<'info>>,
) -> Result<()> {
    let game = &mut ctx.accounts.game;
    
    // Ensure game is cancelled
    require!(
        game.game_state() == crate::state::GameState::Cancelled,
        TreasuryError::GameNotCancelled
    );
    
    // Refund each player
    for i in 0..game.player_count as usize {
        if game.stakes[i] > 0 {
            // Transfer full stake back (no penalty for cancellation)
            let refund_amount = game.stakes[i];
            
            // Direct lamports transfer from game PDA
            **game.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
            **ctx.remaining_accounts[i].try_borrow_mut_lamports()? += refund_amount;
            
            // Clear stake
            game.stakes[i] = 0;
        }
    }
    
    // Mark as refunded
    game.pot_total = 0;
    
    Ok(())
}

#[derive(Accounts)]
pub struct BatchRefund<'info> {
    #[account(mut)]
    pub game: Account<'info, GameAccountOptimized>,
    pub config: Account<'info, ConfigurationAccount>,
    pub system_program: Program<'info, System>,
    // remaining_accounts contains all players to refund
}

// TreasuryError is imported from crate::errors