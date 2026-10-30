use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("TrUsT11111111111111111111111111111111111111");

pub const DELIVERY_TIMEOUT: i64 = 48 * 3600; // 48 hours delivery grace period

#[program]
pub mod trustpassz_escrow {
    use super::*;

    /// Initializes escrow PDA and locks buyer's funds into the vault PDA.
    pub fn create_and_deposit(
        ctx: Context<CreateAndDeposit>,
        deal_id: [u8; 32],
        amount: u64,
        inspection_duration: i64,
    ) -> Result<()> {
        require!(amount > 0, EscrowError::ZeroAmount);
        require!(inspection_duration > 0, EscrowError::ZeroDuration);
        require_keys_neq!(ctx.accounts.buyer.key(), ctx.accounts.seller.key(), EscrowError::InvalidParticipant);

        // Transfer funds from Buyer to PDA Vault
        let transfer_cpi = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.vault_account.to_account_info(),
            },
        );
        transfer(transfer_cpi, amount)?;

        let clock = Clock::get()?;
        let escrow = &mut ctx.accounts.escrow_account;
        escrow.deal_id = deal_id;
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.seller = ctx.accounts.seller.key();
        escrow.relayer_oracle = ctx.accounts.relayer_oracle.key();
        escrow.amount = amount;
        escrow.state = EscrowStatus::Deposited;
        escrow.deposited_at = clock.unix_timestamp;
        escrow.inspection_deadline = 0;
        escrow.inspection_duration = inspection_duration;
        escrow.bump = ctx.bumps.escrow_account;
        escrow.vault_bump = ctx.bumps.vault_account;

        emit!(DealDeposited {
            deal_id,
            buyer: escrow.buyer,
            seller: escrow.seller,
            amount,
            deposited_at: escrow.deposited_at,
        });

        Ok(())
    }

    /// Seller or Relayer Oracle starts the buyer's inspection countdown upon asset delivery.
    pub fn start_inspection(ctx: Context<StartInspection>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        let caller = ctx.accounts.authority.key();

        require!(escrow.state == EscrowStatus::Deposited, EscrowError::InvalidState);
        require!(
            caller == escrow.seller || caller == escrow.relayer_oracle,
            EscrowError::Unauthorized
        );

        let clock = Clock::get()?;
        let deadline = clock.unix_timestamp.checked_add(escrow.inspection_duration)
            .ok_or(EscrowError::MathOverflow)?;

        escrow.state = EscrowStatus::InInspection;
        escrow.inspection_deadline = deadline;

        emit!(InspectionStarted {
            deal_id: escrow.deal_id,
            deadline,
        });

        Ok(())
    }

    /// Releases escrowed funds to seller (by buyer early approval or when inspection expires).
    pub fn settle(ctx: Context<Settle>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        let caller = ctx.accounts.authority.key();

        require!(escrow.state == EscrowStatus::InInspection, EscrowError::InvalidState);

        if caller != escrow.buyer {
            let clock = Clock::get()?;
            require!(
                clock.unix_timestamp >= escrow.inspection_deadline,
                EscrowError::InspectionWindowActive
            );
        }

        let amount = escrow.amount;
        let deal_id = escrow.deal_id;
        let vault_bump = escrow.vault_bump;
        let seeds = &[b"vault".as_ref(), deal_id.as_ref(), &[vault_bump]];
        let signer = &[&seeds[..]];

        let transfer_cpi = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_account.to_account_info(),
                to: ctx.accounts.seller.to_account_info(),
            },
            signer,
        );
        transfer(transfer_cpi, amount)?;

        escrow.state = EscrowStatus::Settled;

        emit!(DealSettled {
            deal_id,
            recipient: ctx.accounts.seller.key(),
            amount,
        });

        Ok(())
    }

    /// Buyer claims refund if seller fails to initiate inspection within 48 hours of deposit.
    pub fn cancel_deposited(ctx: Context<CancelDeposited>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        let caller = ctx.accounts.authority.key();

        require!(escrow.state == EscrowStatus::Deposited, EscrowError::InvalidState);
        require!(
            caller == escrow.buyer || caller == escrow.relayer_oracle,
            EscrowError::Unauthorized
        );

        let clock = Clock::get()?;
        let timeout_at = escrow.deposited_at.checked_add(DELIVERY_TIMEOUT)
            .ok_or(EscrowError::MathOverflow)?;

        require!(clock.unix_timestamp >= timeout_at, EscrowError::DeliveryTimeoutNotReached);

        let amount = escrow.amount;
        let deal_id = escrow.deal_id;
        let vault_bump = escrow.vault_bump;
        let seeds = &[b"vault".as_ref(), deal_id.as_ref(), &[vault_bump]];
        let signer = &[&seeds[..]];

        let transfer_cpi = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_account.to_account_info(),
                to: ctx.accounts.buyer.to_account_info(),
            },
            signer,
        );
        transfer(transfer_cpi, amount)?;

        escrow.state = EscrowStatus::Refunded;

        emit!(DealRefunded {
            deal_id,
            recipient: ctx.accounts.buyer.key(),
            amount,
        });

        Ok(())
    }

    /// Relayer Oracle resolves dispute by releasing funds to buyer or seller based on verdict.
    pub fn resolve_dispute(ctx: Context<ResolveDispute>, refund_buyer: bool) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;

        require!(
            escrow.state == EscrowStatus::Disputed || escrow.state == EscrowStatus::InInspection,
            EscrowError::InvalidState
        );
        require_keys_eq!(
            ctx.accounts.relayer_oracle.key(),
            escrow.relayer_oracle,
            EscrowError::Unauthorized
        );

        let amount = escrow.amount;
        let deal_id = escrow.deal_id;
        let vault_bump = escrow.vault_bump;
        let seeds = &[b"vault".as_ref(), deal_id.as_ref(), &[vault_bump]];
        let signer = &[&seeds[..]];

        let recipient_info = if refund_buyer {
            ctx.accounts.buyer.to_account_info()
        } else {
            ctx.accounts.seller.to_account_info()
        };

        let transfer_cpi = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_account.to_account_info(),
                to: recipient_info.clone(),
            },
            signer,
        );
        transfer(transfer_cpi, amount)?;

        let final_state = if refund_buyer {
            EscrowStatus::Refunded
        } else {
            EscrowStatus::Settled
        };
        escrow.state = final_state;

        emit!(DisputeResolved {
            deal_id,
            recipient: recipient_info.key(),
            final_state,
            amount,
        });

        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Account Contexts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(deal_id: [u8; 32])]
pub struct CreateAndDeposit<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: Target seller address receiving payment on settlement
    pub seller: AccountInfo<'info>,
    /// CHECK: Relayer Oracle authorized to orchestrate state updates
    pub relayer_oracle: AccountInfo<'info>,
    #[account(
        init,
        payer = buyer,
        space = 8 + EscrowState::INIT_SPACE,
        seeds = [b"escrow", deal_id.as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowState>,
    #[account(
        mut,
        seeds = [b"vault", deal_id.as_ref()],
        bump
    )]
    pub vault_account: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartInspection<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow_account.deal_id.as_ref()],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, EscrowState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Settle<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow_account.deal_id.as_ref()],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, EscrowState>,
    #[account(
        mut,
        seeds = [b"vault", escrow_account.deal_id.as_ref()],
        bump = escrow_account.vault_bump
    )]
    pub vault_account: SystemAccount<'info>,
    #[account(mut, address = escrow_account.seller)]
    pub seller: SystemAccount<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelDeposited<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow_account.deal_id.as_ref()],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, EscrowState>,
    #[account(
        mut,
        seeds = [b"vault", escrow_account.deal_id.as_ref()],
        bump = escrow_account.vault_bump
    )]
    pub vault_account: SystemAccount<'info>,
    #[account(mut, address = escrow_account.buyer)]
    pub buyer: SystemAccount<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow_account.deal_id.as_ref()],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, EscrowState>,
    #[account(
        mut,
        seeds = [b"vault", escrow_account.deal_id.as_ref()],
        bump = escrow_account.vault_bump
    )]
    pub vault_account: SystemAccount<'info>,
    #[account(mut, address = escrow_account.buyer)]
    pub buyer: SystemAccount<'info>,
    #[account(mut, address = escrow_account.seller)]
    pub seller: SystemAccount<'info>,
    pub relayer_oracle: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ---------------------------------------------------------------------------
// State & Enums
// ---------------------------------------------------------------------------

#[account]
#[derive(InitSpace)]
pub struct EscrowState {
    pub deal_id: [u8; 32],
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub relayer_oracle: Pubkey,
    pub amount: u64,
    pub state: EscrowStatus,
    pub deposited_at: i64,
    pub inspection_deadline: i64,
    pub inspection_duration: i64,
    pub bump: u8,
    pub vault_bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum EscrowStatus {
    Pending,
    Deposited,
    InInspection,
    Settled,
    Refunded,
    Disputed,
}

// ---------------------------------------------------------------------------
// Events & Errors
// ---------------------------------------------------------------------------

#[event]
pub struct DealDeposited {
    pub deal_id: [u8; 32],
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub deposited_at: i64,
}

#[event]
pub struct InspectionStarted {
    pub deal_id: [u8; 32],
    pub deadline: i64,
}

#[event]
pub struct DealSettled {
    pub deal_id: [u8; 32],
    pub recipient: Pubkey,
    pub amount: u64,
}

#[event]
pub struct DealRefunded {
    pub deal_id: [u8; 32],
    pub recipient: Pubkey,
    pub amount: u64,
}

#[event]
pub struct DisputeResolved {
    pub deal_id: [u8; 32],
    pub recipient: Pubkey,
    pub final_state: EscrowStatus,
    pub amount: u64,
}

#[error_code]
pub enum EscrowError {
    #[msg("Amount must be greater than zero.")]
    ZeroAmount,
    #[msg("Inspection duration must be greater than zero.")]
    ZeroDuration,
    #[msg("Buyer and seller cannot be identical.")]
    InvalidParticipant,
    #[msg("Current escrow state does not allow this operation.")]
    InvalidState,
    #[msg("Unauthorized access for instruction execution.")]
    Unauthorized,
    #[msg("Inspection window is still active; buyer has not completed review.")]
    InspectionWindowActive,
    #[msg("48-hour delivery timeout has not been reached yet.")]
    DeliveryTimeoutNotReached,
    #[msg("Arithmetic overflow occurred.")]
    MathOverflow,
}

