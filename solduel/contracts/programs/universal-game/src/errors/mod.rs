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

#[error_code]
pub enum TreasuryError {
    #[msg("Platform fees have already been distributed")]
    FeesAlreadyDistributed,
    
    #[msg("Game is not completed")]
    GameNotCompleted,
    
    #[msg("No winner set for this game")]
    NoWinnerSet,
    
    #[msg("Invalid winner account")]
    InvalidWinner,
    
    #[msg("Player not found in game")]
    PlayerNotInGame,
    
    #[msg("No stake to refund")]
    NoStakeToRefund,
    
    #[msg("Game is not cancelled")]
    GameNotCancelled,
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

#[error_code]
pub enum TokenError {
    #[msg("Invalid stake amount")]
    InvalidStakeAmount,
    
    #[msg("Game is full")]
    GameFull,
    
    #[msg("Insufficient token balance")]
    InsufficientBalance,
    
    #[msg("Token mint mismatch")]
    MintMismatch,
    
    #[msg("Token transfer failed")]
    TransferFailed,
}