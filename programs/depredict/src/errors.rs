use anchor_lang::prelude::*;

#[error_code]
pub enum 
DepredictError {
    #[msg("Unauthorized Instruction")]
    Unauthorized,

    #[msg("Config account in use, cannot close it")]
    ConfigInUse,

    #[msg("Same fee amount")]
    SameFeeAmount,

    #[msg("Invalid fee amount")]
    InvalidFeeAmount,

    #[msg("Same fee vault")]
    SameFeeVault,

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

    #[msg("Market not resolved")]
    MarketNotResolved,

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

    #[msg("Market creator is inactive")]
    MarketCreatorInactive,

    #[msg("Invalid program")]
    InvalidProgram,

    #[msg("Invalid tree")]
    InvalidTree,

    #[msg("Market creator already verified")]
    AlreadyVerified,

    #[msg("Invalid market creator")]
    InvalidMarketCreator,
    
    #[msg("Position not prunable (must be Claimed or Closed)")]
    PositionNotPrunable,

    #[msg("Position page not empty")]
    PositionPageNotEmpty,

    #[msg("Invalid fee bps")]
    InvalidFeeBps,
}
