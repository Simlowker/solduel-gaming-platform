use anchor_lang::prelude::*;
use crate::state::{GameType, GameState, GameMove, BetAction};

/// Event emitted when a new game is created
#[event]
pub struct GameCreated {
    pub game_id: u64,
    pub game_type: GameType,
    pub creator: Pubkey,
    pub stake_amount: u64,
    pub max_players: u8,
    pub timestamp: i64,
}

/// Event emitted when a player joins a game
#[event]
pub struct PlayerJoined {
    pub game_id: u64,
    pub player: Pubkey,
    pub stake_amount: u64,
    pub player_count: u8,
    pub timestamp: i64,
}

/// Event emitted when a game state changes
#[event]
pub struct GameStateChanged {
    pub game_id: u64,
    pub old_state: GameState,
    pub new_state: GameState,
    pub timestamp: i64,
}

/// Event emitted when a player commits a move
#[event]
pub struct MoveCommitted {
    pub game_id: u64,
    pub player: Pubkey,
    pub move_hash: [u8; 32],
    pub round: u8,
    pub timestamp: i64,
}

/// Event emitted when a player reveals a move
#[event]
pub struct MoveRevealed {
    pub game_id: u64,
    pub player: Pubkey,
    pub game_move: GameMove,
    pub round: u8,
    pub timestamp: i64,
}

/// Event emitted when a bet action is placed
#[event]
pub struct BetPlaced {
    pub game_id: u64,
    pub player: Pubkey,
    pub action: BetAction,
    pub round: u8,
    pub pot_total: u64,
    pub timestamp: i64,
}

/// Event emitted when lottery tickets are purchased
#[event]
pub struct LotteryEntered {
    pub game_id: u64,
    pub player: Pubkey,
    pub num_tickets: u32,
    pub total_cost: u64,
    pub timestamp: i64,
}

/// Event emitted when a game is resolved
#[event]
pub struct GameResolved {
    pub game_id: u64,
    pub winner: Option<Pubkey>,
    pub total_pot: u64,
    pub platform_fee: u64,
    pub winner_payout: u64,
    pub timestamp: i64,
}

/// Event emitted when lottery is drawn
#[event]
pub struct LotteryDrawn {
    pub game_id: u64,
    pub winner: Pubkey,
    pub winning_ticket: u32,
    pub total_tickets: u32,
    pub prize_amount: u64,
    pub vrf_result: [u8; 32],
    pub timestamp: i64,
}

/// Event emitted when a game is cancelled
#[event]
pub struct GameCancelled {
    pub game_id: u64,
    pub reason: CancelReason,
    pub refund_amount: u64,
    pub timestamp: i64,
}

/// Event emitted when winnings are claimed
#[event]
pub struct WinningsClaimed {
    pub game_id: u64,
    pub player: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

/// Event emitted when platform fees are collected
#[event]
pub struct FeesCollected {
    pub game_id: u64,
    pub treasury: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

/// Event emitted when VRF request is made
#[event]
pub struct VrfRequested {
    pub game_id: u64,
    pub vrf_account: Pubkey,
    pub max_result: u64,
    pub timestamp: i64,
}

/// Event emitted when VRF result is received
#[event]
pub struct VrfFulfilled {
    pub game_id: u64,
    pub vrf_result: [u8; 32],
    pub randomness_value: u64,
    pub timestamp: i64,
}

/// Event emitted when a player is penalized for timeout
#[event]
pub struct PlayerTimedOut {
    pub game_id: u64,
    pub player: Pubkey,
    pub penalty_amount: u64,
    pub timestamp: i64,
}

/// Reason for game cancellation
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum CancelReason {
    InsufficientPlayers,
    CreatorCancelled,
    Timeout,
    AdminIntervention,
}