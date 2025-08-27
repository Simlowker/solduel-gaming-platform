use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::GameError;

pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    
    config.admin = ctx.accounts.admin.key();
    config.treasury = ctx.accounts.treasury.key();
    config.min_stake = DEFAULT_MIN_STAKE;
    config.max_stake = DEFAULT_MAX_STAKE;
    config.max_rounds = MAX_ROUNDS;
    config.fold_penalty = DEFAULT_FOLD_PENALTY;
    config.randomness_method = 0; // commit-reveal by default
    config.platform_fee = DEFAULT_PLATFORM_FEE;
    config.item_prices = vec![100_000_000; MAX_ITEMS]; // 0.1 SOL per item
    config.timeout = DEFAULT_TIMEOUT;
    config.ticket_conversion = 1; // 1 ticket per unit
    config.game_counter = 0;
    config.reserved = [0; 128];
    
    Ok(())
}

pub fn update_config(
    ctx: Context<UpdateConfig>,
    min_stake: Option<u64>,
    max_stake: Option<u64>,
    platform_fee: Option<u8>,
    timeout: Option<u64>,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    
    // Only admin can update
    require_keys_eq!(
        ctx.accounts.admin.key(),
        config.admin,
        GameError::UnauthorizedPlayer
    );
    
    if let Some(min) = min_stake {
        config.min_stake = min;
    }
    
    if let Some(max) = max_stake {
        require!(max > config.min_stake, GameError::InvalidConfig);
        config.max_stake = max;
    }
    
    if let Some(fee) = platform_fee {
        require!(fee <= 10, GameError::InvalidConfig); // Max 10% fee
        config.platform_fee = fee;
    }
    
    if let Some(t) = timeout {
        require!(t >= 300, GameError::InvalidConfig); // Min 5 minutes
        config.timeout = t;
    }
    
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = ConfigurationAccount::LEN,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, ConfigurationAccount>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    /// CHECK: Treasury account for fees
    pub treasury: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, ConfigurationAccount>,
    
    pub admin: Signer<'info>,
}