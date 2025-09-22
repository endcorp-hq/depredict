use crate::errors::DepredictError;
use crate::constants::FEE_BPS_DENOMINATOR;
use anchor_lang::prelude::*;

pub fn compute_fee_bps(amount_lamports: u64, fee_bps: u16) -> Result<u64> {
    require!(fee_bps as u64 <= 10_000, DepredictError::InvalidFeeBps);
    if fee_bps == 0 || amount_lamports == 0 {
        return Ok(0);
    }
    let numerator = (amount_lamports as u128)
        .checked_mul(fee_bps as u128)
        .ok_or(DepredictError::ArithmeticOverflow)?;
    let fee = numerator / FEE_BPS_DENOMINATOR as u128; // deterministic round-down
    u64::try_from(fee).map_err(|_| DepredictError::ArithmeticOverflow.into())
}

pub fn net_of_fee(amount_lamports: u64, fee_bps: u16) -> Result<u64> {
    let fee = compute_fee_bps(amount_lamports, fee_bps)?;
    amount_lamports
        .checked_sub(fee)
        .ok_or(DepredictError::ArithmeticOverflow.into())
}

/// Computes creator fee first on the gross amount, then protocol fee on the remainder (sequential).
/// Returns (creator_fee, protocol_fee, net_amount).
pub fn compute_dual_fees_sequential(
    amount_lamports: u64,
    creator_fee_bps: u16,
    protocol_fee_bps: u16,
) -> Result<(u64, u64, u64)> {
    let creator_fee = compute_fee_bps(amount_lamports, creator_fee_bps)?;
    let after_creator = amount_lamports
        .checked_sub(creator_fee)
        .ok_or(DepredictError::ArithmeticOverflow)?;
    let protocol_fee = compute_fee_bps(after_creator, protocol_fee_bps)?;
    let net = after_creator
        .checked_sub(protocol_fee)
        .ok_or(DepredictError::ArithmeticOverflow)?;
    Ok((creator_fee, protocol_fee, net))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::constants::FEE_BPS_DENOMINATOR;

    #[test]
    fn fee_zero_amount_is_zero() {
        let fee = compute_fee_bps(0, 25).unwrap();
        assert_eq!(fee, 0);
        let net = net_of_fee(0, 25).unwrap();
        assert_eq!(net, 0);
    }

    #[test]
    fn fee_one_lamport_small_bps_floors_to_zero() {
        // 1 lamport at 25 bps (0.25%) floors to 0
        let fee = compute_fee_bps(1, 25).unwrap();
        assert_eq!(fee, 0);
        let net = net_of_fee(1, 25).unwrap();
        assert_eq!(net, 1);
    }

    #[test]
    fn zero_bps_fee_is_zero_and_net_unchanged() {
        let amount = 1_000_000u64;
        let fee = compute_fee_bps(amount, 0).unwrap();
        assert_eq!(fee, 0);
        let net = net_of_fee(amount, 0).unwrap();
        assert_eq!(net, amount);
    }

    #[test]
    fn zero_bps_fee_with_u64_max() {
        let amount = u64::MAX;
        let fee = compute_fee_bps(amount, 0).unwrap();
        assert_eq!(fee, 0);
        let net = net_of_fee(amount, 0).unwrap();
        assert_eq!(net, amount);
    }

    #[test]
    fn fee_u64_max_small_bps_computes_without_overflow() {
        let amount = u64::MAX; // 2^64 - 1
        let bps: u16 = 25; // 0.25%
        let fee = compute_fee_bps(amount, bps).unwrap();

        // Expected computed in u128 to avoid overflow: floor(amount * bps / 10_000)
        let expected = ((amount as u128) * (bps as u128)) / (FEE_BPS_DENOMINATOR as u128);
        assert_eq!(fee as u128, expected);

        // Net amount should be amount - fee
        let net = net_of_fee(amount, bps).unwrap();
        assert_eq!(net as u128, (amount as u128) - expected);
    }

    #[test]
    fn fee_full_bps_is_100_percent() {
        let amount = 123u64;
        let bps: u16 = 10_000; // 100%
        let fee = compute_fee_bps(amount, bps).unwrap();
        assert_eq!(fee, amount);
        let net = net_of_fee(amount, bps).unwrap();
        assert_eq!(net, 0);
    }

    #[test]
    fn invalid_bps_is_rejected() {
        let result = compute_fee_bps(1_000, 10_001);
        assert!(result.is_err());
    }

    #[test]
    fn dual_fees_sequential_basic() {
        let amount = 1_000_000_000u64; // 1 SOL
        let (creator_fee, protocol_fee, net) = compute_dual_fees_sequential(amount, 25, 25).unwrap();
        let expected_creator = compute_fee_bps(amount, 25).unwrap();
        let after_creator = amount - expected_creator;
        let expected_protocol = compute_fee_bps(after_creator, 25).unwrap();
        let expected_net = after_creator - expected_protocol;
        assert_eq!(creator_fee, expected_creator);
        assert_eq!(protocol_fee, expected_protocol);
        assert_eq!(net, expected_net);
    }

    #[test]
    fn dual_fees_sequential_one_lamport() {
        let (creator_fee, protocol_fee, net) = compute_dual_fees_sequential(1, 25, 25).unwrap();
        assert_eq!(creator_fee, 0);
        assert_eq!(protocol_fee, 0);
        assert_eq!(net, 1);
    }

    #[test]
    fn dual_fees_sequential_u64_max_small_bps() {
        let amount = u64::MAX;
        let (creator_fee, protocol_fee, net) = compute_dual_fees_sequential(amount, 25, 25).unwrap();
        // Validate against stepwise reference using u128
        let expected_creator = ((amount as u128) * 25u128) / (FEE_BPS_DENOMINATOR as u128);
        let after_creator = (amount as u128) - expected_creator;
        let expected_protocol = (after_creator * 25u128) / (FEE_BPS_DENOMINATOR as u128);
        let expected_net = after_creator - expected_protocol;
        assert_eq!(creator_fee as u128, expected_creator);
        assert_eq!(protocol_fee as u128, expected_protocol);
        assert_eq!(net as u128, expected_net);
    }

    #[test]
    fn dual_fees_sequential_full_creator_fee() {
        let amount = 987_654_321u64;
        let (creator_fee, protocol_fee, net) = compute_dual_fees_sequential(amount, 10_000, 25).unwrap();
        assert_eq!(creator_fee, amount);
        assert_eq!(protocol_fee, 0);
        assert_eq!(net, 0);
    }

    #[test]
    fn dual_fees_sequential_full_protocol_fee_on_remainder() {
        let amount = 987_654_321u64;
        // creator 25 bps, protocol 100% of remainder
        let (creator_fee, protocol_fee, net) = compute_dual_fees_sequential(amount, 25, 10_000).unwrap();
        let expected_creator = compute_fee_bps(amount, 25).unwrap();
        let after_creator = amount - expected_creator;
        assert_eq!(creator_fee, expected_creator);
        assert_eq!(protocol_fee, after_creator);
        assert_eq!(net, 0);
    }
}