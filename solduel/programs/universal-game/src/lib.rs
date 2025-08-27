use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;
use state::*;

declare_id!("EH2W2Yxww1jLAySWFo2GjLJWeV7UQcumQSuuZkfAyUsn");

#[program]
pub mod universal_game {
    use super::*;

    /// Initialize the global configuration (admin only)
    pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
        instructions::admin::initialize_config(ctx)
    }

    /// Update configuration parameters (admin only)
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        min_stake: Option<u64>,
        max_stake: Option<u64>,
        platform_fee: Option<u8>,
        timeout: Option<u64>,
    ) -> Result<()> {
        instructions::admin::update_config(ctx, min_stake, max_stake, platform_fee, timeout)
    }

    /// Create a new game of any type
    pub fn create_game(
        ctx: Context<CreateGame>,
        game_type: GameType,
        stake_amount: u64,
        max_players: Option<u8>,
    ) -> Result<()> {
        instructions::game_lifecycle::create_game(ctx, game_type, stake_amount, max_players)
    }

    /// Join an existing game
    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        instructions::game_lifecycle::join_game(ctx)
    }

    /// Cancel a waiting game (creator only)
    pub fn cancel_game(ctx: Context<CancelGame>) -> Result<()> {
        instructions::game_lifecycle::cancel_game(ctx)
    }

    /// Force finish a timed-out game
    pub fn force_finish(ctx: Context<ForceFinish>) -> Result<()> {
        instructions::game_lifecycle::force_finish(ctx)
    }

    /// Submit a hashed move (commit phase for simple duels)
    pub fn commit_move(ctx: Context<CommitMove>, move_hash: [u8; 32]) -> Result<()> {
        instructions::simple_duel::commit_move(ctx, move_hash)
    }

    /// Reveal a previously committed move
    pub fn reveal_move(
        ctx: Context<RevealMove>,
        game_move: GameMove,
        nonce: [u8; 32],
    ) -> Result<()> {
        instructions::simple_duel::reveal_move(ctx, game_move, nonce)
    }

    /// Place a bet in multi-round games
    pub fn place_bet(ctx: Context<PlaceBet>, action: BetAction) -> Result<()> {
        instructions::multi_round::place_bet(ctx, action)
    }

    /// Enter the lottery pool
    pub fn enter_lottery(ctx: Context<EnterLottery>, num_tickets: u32) -> Result<()> {
        instructions::lottery::enter_lottery(ctx, num_tickets)
    }

    /// Draw lottery winner (anyone can call when ready)
    pub fn draw_lottery(ctx: Context<DrawLottery>) -> Result<()> {
        instructions::lottery::draw_lottery(ctx)
    }

    /// Claim winnings from completed games
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        instructions::claim_winnings(ctx)
    }

    /// Resolve a completed game
    pub fn resolve_game(ctx: Context<ResolveGame>) -> Result<()> {
        instructions::resolve_game(ctx)
    }
}