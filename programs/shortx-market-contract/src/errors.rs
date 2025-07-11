use anchor_lang::prelude::*;

#[error_code]
pub enum 
ShortxError {
    #[msg("Unauthorized Instruction")]
    Unauthorized,

    #[msg("Config account in use, cannot close it")]
    ConfigInUse,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("Insufficient funds")]
    InsufficientFunds,

    #[msg("Invalid price")]
    InvalidPrice,

    #[msg("No available position slot")]
    NoAvailablePositionSlot,

    #[msg("Invalid oracle")]
    InvalidOracle,

    #[msg("Oracle not resolved")]
    OracleNotResolved,

    #[msg("Market is inactive")]
    MarketInactive,

    #[msg("Invalid betting start")]
    InvalidBettingStart,

    #[msg("Position not found")]
    PositionNotFound,

    #[msg("Betting period not started")]
    BettingPeriodNotStarted,

    #[msg("Betting period exceeded")]
    BettingPeriodExceeded,

    #[msg("Betting period ended")]
    BettingPeriodEnded,

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

    #[msg("Invalid collection")]
    InvalidCollection,

    #[msg("Invalid collection mint")]
    InvalidCollectionMint,

    #[msg("Invalid collection authority")]
    InvalidAuthority,

    #[msg("Invalid mpl core program")]
    InvalidMplCoreProgram,

    #[msg("Invalid NFT")]
    InvalidNft,
}
