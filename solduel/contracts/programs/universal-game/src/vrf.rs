use anchor_lang::prelude::*;
// Note: VRF types commented out - may need adjustment for Switchboard version
// use switchboard_solana::{
//     VrfAccountData, VrfRequestRandomness, OracleQueueAccountData,
//     PermissionAccountData, SbState, VrfLiteAccountData, VrfLiteRequestRandomness
// };
use crate::state::GameAccountOptimized;
use crate::events::{VrfRequested, VrfFulfilled};

/// VRF integration for verifiable randomness
pub struct VrfManager;

impl VrfManager {
    /* VRF functions commented out - need to update for Switchboard version compatibility
    /// Request randomness from Switchboard VRF
    pub fn request_randomness<'info>(
        game: &mut Account<'info, GameAccountOptimized>,
        vrf: &AccountLoader<'info, VrfAccountData>,
        oracle_queue: &AccountLoader<'info, OracleQueueAccountData>,
        queue_authority: &AccountInfo<'info>,
        data_buffer: &AccountInfo<'info>,
        permission: &AccountLoader<'info, PermissionAccountData>,
        escrow: &AccountInfo<'info>,
        payer: &AccountInfo<'info>,
        payer_authority: &Signer<'info>,
        recent_blockhashes: &AccountInfo<'info>,
        program_state: &AccountLoader<'info, SbState>,
        switchboard_program: &AccountInfo<'info>,
    ) -> Result<()> {
        // Set VRF flag
        game.set_flag(crate::state::game_optimized::FLAG_USES_VRF, true);
        
        // Build VRF request
        let vrf_request_randomness = VrfRequestRandomness {
            authority: payer_authority.to_account_info(),
            vrf: vrf.to_account_info(),
            oracle_queue: oracle_queue.to_account_info(),
            queue_authority: queue_authority.clone(),
            data_buffer: data_buffer.clone(),
            permission: permission.to_account_info(),
            escrow: escrow.clone(),
            payer_wallet: payer.clone(),
            payer_authority: payer_authority.to_account_info(),
            recent_blockhashes: recent_blockhashes.clone(),
            program_state: program_state.to_account_info(),
            switchboard_program: switchboard_program.clone(),
        };
        
        // Request randomness
        vrf_request_randomness.invoke()?;
        
        // Emit event
        emit!(VrfRequested {
            game_id: game.game_id,
            vrf_account: vrf.key(),
            max_result: game.player_count as u64,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Request randomness using VRF Lite (cheaper option)
    pub fn request_randomness_lite<'info>(
        game: &mut Account<'info, GameAccountOptimized>,
        vrf_lite: &AccountLoader<'info, VrfLiteAccountData>,
        queue: &AccountInfo<'info>,
        queue_authority: &AccountInfo<'info>,
        payer: &Signer<'info>,
        recent_blockhashes: &AccountInfo<'info>,
        switchboard_program: &AccountInfo<'info>,
    ) -> Result<()> {
        // Set VRF flag
        game.set_flag(crate::state::game_optimized::FLAG_USES_VRF, true);
        
        // Build VRF Lite request
        let vrf_lite_request = VrfLiteRequestRandomness {
            authority: payer.to_account_info(),
            vrf_lite: vrf_lite.to_account_info(),
            queue: queue.clone(),
            queue_authority: queue_authority.clone(),
            payer: payer.to_account_info(),
            recent_blockhashes: recent_blockhashes.clone(),
            switchboard_program: switchboard_program.clone(),
        };
        
        // Request randomness
        vrf_lite_request.invoke_signed(&[])?;
        
        // Emit event
        emit!(VrfRequested {
            game_id: game.game_id,
            vrf_account: vrf_lite.key(),
            max_result: game.player_count as u64,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Consume VRF result and store in game account
    pub fn consume_randomness<'info>(
        game: &mut Account<'info, GameAccountOptimized>,
        vrf: &AccountLoader<'info, VrfAccountData>,
    ) -> Result<u64> {
        // Load VRF account
        let vrf_account = vrf.load()?;
        
        // Get the result buffer
        let result_buffer = vrf_account.get_result()?;
        
        // Store raw result
        game.vrf_result = result_buffer;
        
        // Convert to usable randomness value
        let randomness = Self::bytes_to_u64(&result_buffer);
        
        // Emit event
        emit!(VrfFulfilled {
            game_id: game.game_id,
            vrf_result: result_buffer,
            randomness_value: randomness,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(randomness)
    }
    
    /// Consume VRF Lite result
    pub fn consume_randomness_lite<'info>(
        game: &mut Account<'info, GameAccountOptimized>,
        vrf_lite: &AccountLoader<'info, VrfLiteAccountData>,
    ) -> Result<u64> {
        // Load VRF Lite account
        let vrf_lite_account = vrf_lite.load()?;
        
        // Get the result buffer
        let result_buffer = vrf_lite_account.get_result()?;
        
        // Store raw result
        game.vrf_result = result_buffer;
        
        // Convert to usable randomness value
        let randomness = Self::bytes_to_u64(&result_buffer);
        
        // Emit event
        emit!(VrfFulfilled {
            game_id: game.game_id,
            vrf_result: result_buffer,
            randomness_value: randomness,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(randomness)
    }
    */
    
    /// Select lottery winner using VRF result
    pub fn select_lottery_winner(
        game: &GameAccountOptimized,
        randomness: u64,
    ) -> Result<(usize, Pubkey)> {
        let total_tickets = game.stakes.iter()
            .take(game.player_count as usize)
            .sum::<u64>();
        
        require!(total_tickets > 0, crate::errors::GameError::NoLotteryParticipants);
        
        // Use modulo to get winning ticket number
        let winning_ticket = randomness % total_tickets;
        
        // Find winner based on ticket ranges
        let mut accumulated_tickets = 0u64;
        for i in 0..game.player_count as usize {
            accumulated_tickets += game.stakes[i];
            if winning_ticket < accumulated_tickets {
                return Ok((i, game.players[i]));
            }
        }
        
        // Should never reach here, but return last player as fallback
        Ok((
            (game.player_count - 1) as usize,
            game.players[(game.player_count - 1) as usize]
        ))
    }
    
    /// Convert bytes to u64 for randomness
    fn bytes_to_u64(bytes: &[u8; 32]) -> u64 {
        let mut result = 0u64;
        for i in 0..8 {
            result |= (bytes[i] as u64) << (i * 8);
        }
        result
    }
    
    /// Generate deterministic randomness for simple games (fallback)
    pub fn generate_simple_randomness(
        game: &GameAccountOptimized,
        recent_blockhash: &[u8; 32],
    ) -> u64 {
        use anchor_lang::solana_program::keccak;
        
        // Combine game data with blockhash for randomness
        let mut data = Vec::new();
        data.extend_from_slice(&game.game_id.to_le_bytes());
        data.extend_from_slice(recent_blockhash);
        data.extend_from_slice(&game.timestamps.to_le_bytes());
        
        // Hash the combined data
        let hash = keccak::hash(&data);
        
        // Convert to u64
        Self::bytes_to_u64(&hash.to_bytes())
    }
}

#[error_code]
pub enum VrfError {
    #[msg("No tickets sold for lottery")]
    NoTicketsSold,
    #[msg("VRF result not yet available")]
    VrfNotReady,
    #[msg("VRF already consumed for this game")]
    VrfAlreadyConsumed,
    #[msg("VRF not enabled for this game")]
    VrfNotEnabled,
}