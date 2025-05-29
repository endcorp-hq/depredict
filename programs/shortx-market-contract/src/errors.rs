use anchor_lang::prelude::*;

#[error_code]
pub enum 
ShortxError {
    #[msg("Unauthorized Instruction")]
    Unauthorized,

    #[msg("Insufficient funds")]
    InsufficientFunds,

    #[msg("Invalid price")]
    InvalidPrice,

    #[msg("No available order slot")]
    NoAvailableOrderSlot,

    #[msg("Invalid oracle")]
    InvalidOracle,

    #[msg("Oracle not resolved")]
    OracleNotResolved,

    #[msg("Market is inactive")]
    MarketInactive,

    #[msg("Order not found")]
    OrderNotFound,

    #[msg("Question period not started")]
    QuestionPeriodNotStarted,

    #[msg("Question period ended")]
    QuestionPeriodEnded,

    #[msg("Market still active")]
    MarketStillActive,

    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,

    #[msg("Market already resolved")]
    MarketAlreadyResolved,

    #[msg("Concurrent transaction")]
    ConcurrentTransaction,

    #[msg("Market Not allowed to payout")]
    MarketNotAllowedToPayout,

    #[msg("User trade is sub user")]
    UserTradeIsSubUser,

    #[msg("Prize not found")]
    PrizeNotFound,

    #[msg("No Prize Available")]
    NoPrizesAvailable,

    #[msg("Already linked")]
    AlreadyLinked,

    #[msg("Not linked")]
    NotLinked,

    #[msg("Invalid customer")]
    InvalidCustomer,

    #[msg("Invalid mint")]
    InvalidMint,

    #[msg("Invalid fee vault")]
    InvalidFeeVault,

    #[msg("Invalid shares")]
    InvalidShares,

    #[msg("Unauthorized to order book")]
    UnauthorizedToOrderBook,

    #[msg("Order is full filled")]
    OrderIsFullFilled,

    #[msg("Overflow")]
    Overflow,

    #[msg("Market already aggregated")]
    MarketAlreadyAggregated,

    #[msg("Invalid market id")]
    InvalidMarketId,
}
