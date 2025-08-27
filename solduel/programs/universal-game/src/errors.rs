use anchor_lang::prelude::*;

#[error_code]
pub enum GameError {
    #[msg("Invalid game type specified")]
    InvalidGameType,
    
    #[msg("Game is not in the correct state for this action")]
    InvalidGameState,
    
    #[msg("Player not authorized for this action")]
    UnauthorizedPlayer,
    
    #[msg("Game is already full")]
    GameFull,
    
    #[msg("Stake amount is below minimum")]
    StakeTooLow,
    
    #[msg("Stake amount exceeds maximum")]
    StakeTooHigh,
    
    #[msg("Invalid move submitted")]
    InvalidMove,
    
    #[msg("Move already submitted")]
    MoveAlreadySubmitted,
    
    #[msg("Reveal does not match commitment")]
    InvalidReveal,
    
    #[msg("Game has timed out")]
    GameTimeout,
    
    #[msg("Insufficient funds for this action")]
    InsufficientFunds,
    
    #[msg("Invalid betting action")]
    InvalidBetAction,
    
    #[msg("Cannot fold in final round")]
    CannotFoldFinalRound,
    
    #[msg("Lottery is not ready for drawing")]
    LotteryNotReady,
    
    #[msg("No participants in lottery")]
    NoLotteryParticipants,
    
    #[msg("Player already in game")]
    PlayerAlreadyJoined,
    
    #[msg("Invalid configuration parameter")]
    InvalidConfig,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Invalid randomness source")]
    InvalidRandomness,
    
    #[msg("Game not found")]
    GameNotFound,
    
    #[msg("Action not allowed in current round")]
    ActionNotAllowedInRound,
}