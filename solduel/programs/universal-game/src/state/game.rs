use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum GameType {
    SimpleDuel,    // Rock-paper-scissors, coin flip
    MultiRound,    // Poker-style with betting rounds
    Lottery,       // Pool-based lottery
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum GameState {
    Waiting,       // Waiting for players
    Active,        // Game in progress
    Resolving,     // Computing winner
    Completed,     // Game finished
    Cancelled,     // Game cancelled
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum GameMove {
    None,
    Rock,
    Paper,
    Scissors,
    Heads,
    Tails,
    Number(u8),
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BetAction {
    Check,
    Call,
    Raise(u64),
    Fold,
}

#[account]
pub struct GameAccount {
    /// Unique game identifier
    pub game_id: u64,
    /// Type of game
    pub game_type: GameType,
    /// Current state of the game
    pub state: GameState,
    /// Creator of the game
    pub creator: Pubkey,
    /// List of players (max 100 for lottery, 2 for duels)
    pub players: Vec<Pubkey>,
    /// Stakes for each player
    pub stakes: Vec<u64>,
    /// Total pot amount
    pub pot_total: u64,
    /// Current round number (for multi-round games)
    pub current_round: u8,
    /// Maximum rounds
    pub max_rounds: u8,
    /// Commit hashes for moves (commit-reveal)
    pub commit_hashes: Vec<[u8; 32]>,
    /// Revealed moves
    pub reveals: Vec<GameMove>,
    /// Betting action history
    pub action_history: Vec<BetAction>,
    /// Winner of the game
    pub winner: Option<Pubkey>,
    /// Random result (for VRF/VDF)
    pub random_result: Option<[u8; 32]>,
    /// Game creation timestamp
    pub start_time: i64,
    /// Game end timestamp
    pub end_time: Option<i64>,
    /// Last action timestamp (for timeout)
    pub last_action_time: i64,
    /// Entry fee per player (for lottery)
    pub entry_fee: u64,
    /// Reserved for future use
    pub reserved: [u8; 64],
}

impl GameAccount {
    pub const MAX_PLAYERS: usize = 100;
    pub const MAX_ACTIONS: usize = 50;
    
    pub const LEN: usize = 8 + // discriminator
        8 + // game_id
        1 + // game_type
        1 + // state
        32 + // creator
        (4 + 32 * Self::MAX_PLAYERS) + // players
        (4 + 8 * Self::MAX_PLAYERS) + // stakes
        8 + // pot_total
        1 + // current_round
        1 + // max_rounds
        (4 + 32 * Self::MAX_PLAYERS) + // commit_hashes
        (4 + 2 * Self::MAX_PLAYERS) + // reveals (simplified size)
        (4 + 9 * Self::MAX_ACTIONS) + // action_history
        33 + // winner (Option<Pubkey>)
        33 + // random_result (Option<[u8; 32]>)
        8 + // start_time
        9 + // end_time (Option<i64>)
        8 + // last_action_time
        8 + // entry_fee
        64; // reserved
}