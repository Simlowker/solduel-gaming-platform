use anchor_lang::prelude::*;
use crate::constants::MAX_PLAYERS;
use super::game::{GameType, GameState};

/// Optimized game account with fixed arrays for better rent efficiency
#[account]
pub struct GameAccountOptimized {
    /// Unique game identifier
    pub game_id: u64,
    
    /// Type of game (packed with state for efficiency)
    pub game_type_and_state: u8, // Lower 4 bits: type, Upper 4 bits: state
    
    /// Creator of the game
    pub creator: Pubkey,
    
    /// Number of active players (max 100)
    pub player_count: u8,
    
    /// List of players - fixed array
    pub players: [Pubkey; MAX_PLAYERS],
    
    /// Stakes for each player - fixed array
    pub stakes: [u64; MAX_PLAYERS],
    
    /// Total pot amount
    pub pot_total: u64,
    
    /// Current round and max rounds packed
    pub rounds: u8, // Lower 4 bits: current, Upper 4 bits: max
    
    /// Commit hashes for moves (commit-reveal) - fixed array
    pub commit_hashes: [[u8; 32]; MAX_PLAYERS],
    
    /// Revealed moves - packed into bytes for efficiency
    pub reveals_packed: [u8; MAX_PLAYERS], // Each move fits in 1 byte
    
    /// Betting action history - packed
    pub action_history_packed: [u8; 50], // Each action fits in 1 byte
    pub action_count: u8,
    
    /// Winner of the game
    pub winner: Option<Pubkey>,
    
    /// Random result for VRF
    pub vrf_result: [u8; 32],
    
    /// Timestamps packed into single u64
    pub timestamps: u64, // Lower 32 bits: start_time, Upper 32 bits: last_action_time
    
    /// Entry fee per player (for lottery)
    pub entry_fee: u64,
    
    /// Platform fee collected
    pub platform_fee_collected: u64,
    
    /// Treasury pubkey for fee collection
    pub treasury: Pubkey,
    
    /// Flags for various boolean states (bit-packed)
    pub flags: u8, // bit 0: is_resolved, bit 1: fees_distributed, bit 2: uses_vrf, etc.
}

impl GameAccountOptimized {
    pub const LEN: usize = 8 + // discriminator
        8 + // game_id
        1 + // game_type_and_state
        32 + // creator
        1 + // player_count
        (32 * MAX_PLAYERS) + // players
        (8 * MAX_PLAYERS) + // stakes
        8 + // pot_total
        1 + // rounds
        (32 * MAX_PLAYERS) + // commit_hashes
        MAX_PLAYERS + // reveals_packed
        50 + // action_history_packed
        1 + // action_count
        33 + // winner (Option<Pubkey>)
        32 + // vrf_result
        8 + // timestamps
        8 + // entry_fee
        8 + // platform_fee_collected
        32 + // treasury
        1; // flags
    
    /// Unpack game type from packed byte
    pub fn game_type(&self) -> GameType {
        match self.game_type_and_state & 0x0F {
            0 => GameType::SimpleDuel,
            1 => GameType::MultiRound,
            2 => GameType::Lottery,
            _ => GameType::SimpleDuel,
        }
    }
    
    /// Unpack game state from packed byte
    pub fn game_state(&self) -> GameState {
        match (self.game_type_and_state >> 4) & 0x0F {
            0 => GameState::Waiting,
            1 => GameState::Active,
            2 => GameState::Resolving,
            3 => GameState::Completed,
            4 => GameState::Cancelled,
            _ => GameState::Waiting,
        }
    }
    
    /// Pack game type and state into single byte
    pub fn set_type_and_state(&mut self, game_type: GameType, state: GameState) {
        let type_bits = match game_type {
            GameType::SimpleDuel => 0,
            GameType::MultiRound => 1,
            GameType::Lottery => 2,
        };
        let state_bits = match state {
            GameState::Waiting => 0,
            GameState::Active => 1,
            GameState::Resolving => 2,
            GameState::Completed => 3,
            GameState::Cancelled => 4,
        };
        self.game_type_and_state = type_bits | (state_bits << 4);
    }
    
    /// Get current round from packed byte
    pub fn current_round(&self) -> u8 {
        self.rounds & 0x0F
    }
    
    /// Get max rounds from packed byte
    pub fn max_rounds(&self) -> u8 {
        (self.rounds >> 4) & 0x0F
    }
    
    /// Set rounds packed
    pub fn set_rounds(&mut self, current: u8, max: u8) {
        self.rounds = (current & 0x0F) | ((max & 0x0F) << 4);
    }
    
    /// Get start timestamp from packed u64
    pub fn start_time(&self) -> u32 {
        (self.timestamps & 0xFFFFFFFF) as u32
    }
    
    /// Get last action timestamp from packed u64
    pub fn last_action_time(&self) -> u32 {
        ((self.timestamps >> 32) & 0xFFFFFFFF) as u32
    }
    
    /// Set timestamps packed
    pub fn set_timestamps(&mut self, start: u32, last_action: u32) {
        self.timestamps = (start as u64) | ((last_action as u64) << 32);
    }
    
    /// Check flag bit
    pub fn get_flag(&self, bit: u8) -> bool {
        (self.flags & (1 << bit)) != 0
    }
    
    /// Set flag bit
    pub fn set_flag(&mut self, bit: u8, value: bool) {
        if value {
            self.flags |= 1 << bit;
        } else {
            self.flags &= !(1 << bit);
        }
    }
}

impl Default for GameAccountOptimized {
    fn default() -> Self {
        Self {
            game_id: 0,
            game_type_and_state: 0,
            creator: Pubkey::default(),
            player_count: 0,
            players: [Pubkey::default(); MAX_PLAYERS],
            stakes: [0u64; MAX_PLAYERS],
            pot_total: 0,
            rounds: 0,
            commit_hashes: [[0u8; 32]; MAX_PLAYERS],
            reveals_packed: [0u8; MAX_PLAYERS],
            action_history_packed: [0u8; 50],
            action_count: 0,
            winner: None,
            vrf_result: [0u8; 32],
            timestamps: 0,
            platform_fee_collected: 0,
            treasury: Pubkey::default(),
            flags: 0,
            entry_fee: 0,
        }
    }
}

/// Helper constants for flag positions
pub const FLAG_IS_RESOLVED: u8 = 0;
pub const FLAG_FEES_DISTRIBUTED: u8 = 1;
pub const FLAG_USES_VRF: u8 = 2;
pub const FLAG_HAS_TIMEOUT: u8 = 3;
pub const FLAG_AUTO_RESOLVE: u8 = 4;