use anchor_lang::prelude::*;

#[account]
pub struct ConfigurationAccount {
    /// Administrator address
    pub admin: Pubkey,
    /// Minimum stake amount in lamports
    pub min_stake: u64,
    /// Maximum stake amount in lamports
    pub max_stake: u64,
    /// Maximum rounds for multi-round games
    pub max_rounds: u8,
    /// Penalty percentage for folding (0-100)
    pub fold_penalty: u8,
    /// Randomness method: 0=commit-reveal, 1=VRF, 2=VDF
    pub randomness_method: u8,
    /// Platform fee percentage (0-100)
    pub platform_fee: u8,
    /// Prices for bonus items in lamports
    pub item_prices: Vec<u64>,
    /// Timeout in seconds before games can be force-finished
    pub timeout: u64,
    /// Number of lottery tickets per stake unit
    pub ticket_conversion: u64,
    /// Counter for generating unique game IDs
    pub game_counter: u64,
    /// Treasury address for platform fees
    pub treasury: Pubkey,
    /// Reserved for future use
    pub reserved: [u8; 128],
}

impl ConfigurationAccount {
    pub const LEN: usize = 8 + // discriminator
        32 + // admin
        8 + // min_stake
        8 + // max_stake
        1 + // max_rounds
        1 + // fold_penalty
        1 + // randomness_method
        1 + // platform_fee
        (4 + 8 * 10) + // item_prices (Vec with max 10 items)
        8 + // timeout
        8 + // ticket_conversion
        8 + // game_counter
        32 + // treasury
        128; // reserved
}