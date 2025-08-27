// use anchor_lang::prelude::*;

/// Seeds for PDAs
pub const CONFIG_SEED: &[u8] = b"config";
pub const GAME_SEED: &[u8] = b"game";
pub const PLAYER_SEED: &[u8] = b"player";
pub const VAULT_SEED: &[u8] = b"vault";

/// Game limits
pub const MAX_PLAYERS: usize = 100;
pub const MAX_ACTIONS: usize = 50;
pub const MAX_ITEMS: usize = 10;
pub const MAX_ROUNDS: u8 = 10;

/// Default values
pub const DEFAULT_MIN_STAKE: u64 = 100_000_000; // 0.1 SOL
pub const DEFAULT_MAX_STAKE: u64 = 10_000_000_000; // 10 SOL
pub const DEFAULT_TIMEOUT: u64 = 3600; // 1 hour
pub const DEFAULT_PLATFORM_FEE: u8 = 2; // 2%
pub const DEFAULT_FOLD_PENALTY: u8 = 10; // 10%

/// Lottery parameters
pub const LOTTERY_TICKET_PRICE: u64 = 50_000_000; // 0.05 SOL
pub const LOTTERY_MAX_TICKETS_PER_PLAYER: u32 = 100;
pub const LOTTERY_DRAW_INTERVAL: i64 = 86400; // 24 hours