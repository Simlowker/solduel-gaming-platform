use anchor_lang::prelude::*;

#[account]
pub struct PlayerAccount {
    /// Owner of this player account
    pub owner: Pubkey,
    /// Total games played
    pub games_played: u32,
    /// Total wins
    pub wins: u32,
    /// Total losses
    pub losses: u32,
    /// Total draws
    pub draws: u32,
    /// Total amount staked lifetime
    pub total_staked: u64,
    /// Total amount won lifetime
    pub total_won: u64,
    /// Win streak
    pub win_streak: u16,
    /// Best win streak
    pub best_streak: u16,
    /// Favorite game type
    pub favorite_game: u8,
    /// Last played timestamp
    pub last_played: i64,
    /// Reserved for future use
    pub reserved: [u8; 64],
}

impl PlayerAccount {
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        4 + // games_played
        4 + // wins
        4 + // losses
        4 + // draws
        8 + // total_staked
        8 + // total_won
        2 + // win_streak
        2 + // best_streak
        1 + // favorite_game
        8 + // last_played
        64; // reserved
}