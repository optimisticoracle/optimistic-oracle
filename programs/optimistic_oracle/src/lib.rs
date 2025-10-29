use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

declare_id!("4qdXVoVkqjHWXKTMii1kk98e8mCw3Ps7ctsgGNMgdkFU");

#[program]
pub mod optimistic_oracle {
    use super::*;

    /// Initialize the oracle program
    pub fn initialize(ctx: Context<Initialize>, admin: Pubkey) -> Result<()> {
        let oracle_state = &mut ctx.accounts.oracle_state;
        oracle_state.admin = admin;
        oracle_state.request_count = 0;
        oracle_state.total_volume = 0;
        oracle_state.bump = ctx.bumps.oracle_state;
        
        msg!("Optimistic Oracle initialized!");
        msg!("Admin: {}", admin);
        
        Ok(())
    }

    /// Create a new oracle request
    pub fn create_request(
        ctx: Context<CreateRequest>,
        question: String,
        answer_type: AnswerType,
        reward_amount: u64,
        bond_amount: u64,
        expiry_timestamp: i64,
        challenge_period: i64,
        data_source: Option<String>,
        metadata: Option<String>,
    ) -> Result<()> {
        require!(question.len() <= 500, OracleError::QuestionTooLong);
        require!(reward_amount > 0, OracleError::InvalidReward);
        require!(bond_amount > 0, OracleError::InvalidBond);
        require!(expiry_timestamp > Clock::get()?.unix_timestamp, OracleError::InvalidExpiry);
        require!(challenge_period >= 3600, OracleError::ChallengePeriodTooShort);
        require!(challenge_period <= 604800, OracleError::ChallengePeriodTooLong);

        let request = &mut ctx.accounts.request;
        let oracle_state = &mut ctx.accounts.oracle_state;
        
        oracle_state.request_count += 1;
        request.request_id = oracle_state.request_count;
        
        request.creator = ctx.accounts.creator.key();
        request.question = question.clone();
        request.answer_type = answer_type;
        request.reward_amount = reward_amount;
        request.bond_amount = bond_amount;
        request.expiry_timestamp = expiry_timestamp;
        request.challenge_period = challenge_period;
        request.data_source = data_source.clone();
        request.metadata = metadata;
        request.status = RequestStatus::Created;
        request.created_at = Clock::get()?.unix_timestamp;
        request.proposer = None;
        request.proposal_time = None;
        request.answer = None;
        request.disputer = None;
        request.dispute_time = None;
        request.resolved_at = None;
        request.bump = ctx.bumps.request;

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.request_escrow.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, reward_amount)?;

        oracle_state.total_volume += reward_amount;

        msg!("Request created!");
        msg!("Request ID: {}", request.request_id);
        msg!("Question: {}", question);
        
        emit!(RequestCreated {
            request_id: request.request_id,
            creator: ctx.accounts.creator.key(),
            question,
            reward_amount,
            bond_amount,
            expiry_timestamp,
        });

        Ok(())
    }

    /// Propose an answer to a request
    pub fn propose_answer(
        ctx: Context<ProposeAnswer>,
        answer: String,
    ) -> Result<()> {
        let request = &mut ctx.accounts.request;
        let clock = Clock::get()?;

        require!(request.status == RequestStatus::Created, OracleError::InvalidStatus);
        require!(clock.unix_timestamp >= request.expiry_timestamp, OracleError::RequestNotExpired);
        require!(answer.len() <= 200, OracleError::AnswerTooLong);

        match request.answer_type {
            AnswerType::YesNo => {
                require!(
                    answer == "YES" || answer == "NO",
                    OracleError::InvalidAnswer
                );
            }
            AnswerType::MultipleChoice => {}
            AnswerType::Numeric => {
                require!(
                    answer.parse::<f64>().is_ok(),
                    OracleError::InvalidAnswer
                );
            }
        }

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.proposer.to_account_info(),
                to: ctx.accounts.proposal_escrow.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, request.bond_amount)?;

        request.proposer = Some(ctx.accounts.proposer.key());
        request.proposal_time = Some(clock.unix_timestamp);
        request.answer = Some(answer.clone());
        request.status = RequestStatus::Proposed;

        msg!("Answer proposed!");
        msg!("Request ID: {}", request.request_id);
        
        emit!(AnswerProposed {
            request_id: request.request_id,
            proposer: ctx.accounts.proposer.key(),
            answer: answer.clone(),
            proposal_time: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Dispute a proposed answer
    pub fn dispute_answer(
        ctx: Context<DisputeAnswer>,
        counter_answer: Option<String>,
    ) -> Result<()> {
        let request = &mut ctx.accounts.request;
        let clock = Clock::get()?;

        require!(request.status == RequestStatus::Proposed, OracleError::InvalidStatus);
        
        let proposal_time = request.proposal_time.ok_or(OracleError::NoProposal)?;
        let challenge_end = proposal_time + request.challenge_period;
        
        require!(
            clock.unix_timestamp <= challenge_end,
            OracleError::ChallengePeriodExpired
        );

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.disputer.to_account_info(),
                to: ctx.accounts.dispute_escrow.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, request.bond_amount)?;

        request.disputer = Some(ctx.accounts.disputer.key());
        request.dispute_time = Some(clock.unix_timestamp);
        request.status = RequestStatus::Disputed;

        msg!("Answer disputed!");
        
        emit!(AnswerDisputed {
            request_id: request.request_id,
            disputer: ctx.accounts.disputer.key(),
            dispute_time: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Resolve request without dispute
    pub fn resolve_undisputed(ctx: Context<ResolveUndisputed>) -> Result<()> {
        let request = &mut ctx.accounts.request;
        let clock = Clock::get()?;

        require!(request.status == RequestStatus::Proposed, OracleError::InvalidStatus);
        
        let proposal_time = request.proposal_time.ok_or(OracleError::NoProposal)?;
        let challenge_end = proposal_time + request.challenge_period;
        
        require!(
            clock.unix_timestamp > challenge_end,
            OracleError::ChallengePeriodNotExpired
        );

        let proposer = request.proposer.ok_or(OracleError::NoProposer)?;
        let total_payout = request.reward_amount + request.bond_amount;

        **ctx.accounts.request_escrow.to_account_info().try_borrow_mut_lamports()? -= request.reward_amount;
        **ctx.accounts.proposer_account.to_account_info().try_borrow_mut_lamports()? += request.reward_amount;

        **ctx.accounts.proposal_escrow.to_account_info().try_borrow_mut_lamports()? -= request.bond_amount;
        **ctx.accounts.proposer_account.to_account_info().try_borrow_mut_lamports()? += request.bond_amount;

        request.status = RequestStatus::Resolved;
        request.resolved_at = Some(clock.unix_timestamp);

        msg!("Request resolved!");
        
        emit!(RequestResolved {
            request_id: request.request_id,
            answer: request.answer.clone().unwrap(),
            winner: proposer,
            payout: total_payout,
        });

        Ok(())
    }

    /// Resolve disputed request
    pub fn resolve_disputed_via_vote(
        ctx: Context<ResolveDisputed>,
        proposer_wins: bool,
    ) -> Result<()> {
        let request = &mut ctx.accounts.request;
        let clock = Clock::get()?;

        require!(
            ctx.accounts.resolver.key() == ctx.accounts.oracle_state.admin,
            OracleError::Unauthorized
        );

        require!(request.status == RequestStatus::Disputed, OracleError::InvalidStatus);

        let proposer = request.proposer.ok_or(OracleError::NoProposer)?;
        let disputer = request.disputer.ok_or(OracleError::NoDisputer)?;

        let (winner, loser) = if proposer_wins {
            (proposer, disputer)
        } else {
            (disputer, proposer)
        };

        let bond_payout = request.bond_amount * 2;
        let total_payout = request.reward_amount + bond_payout;

        **ctx.accounts.request_escrow.to_account_info().try_borrow_mut_lamports()? -= request.reward_amount;
        **ctx.accounts.winner_account.to_account_info().try_borrow_mut_lamports()? += request.reward_amount;

        **ctx.accounts.proposal_escrow.to_account_info().try_borrow_mut_lamports()? -= request.bond_amount;
        **ctx.accounts.dispute_escrow.to_account_info().try_borrow_mut_lamports()? -= request.bond_amount;
        **ctx.accounts.winner_account.to_account_info().try_borrow_mut_lamports()? += bond_payout;

        request.status = RequestStatus::Resolved;
        request.resolved_at = Some(clock.unix_timestamp);

        msg!("Disputed request resolved!");
        
        emit!(DisputeResolved {
            request_id: request.request_id,
            winner,
            loser,
            proposer_wins,
        });

        Ok(())
    }

    /// Cancel request
    pub fn cancel_request(ctx: Context<CancelRequest>) -> Result<()> {
        let request = &mut ctx.accounts.request;
        
        require!(request.status == RequestStatus::Created, OracleError::CannotCancel);
        require!(
            ctx.accounts.creator.key() == request.creator,
            OracleError::Unauthorized
        );

        **ctx.accounts.request_escrow.to_account_info().try_borrow_mut_lamports()? -= request.reward_amount;
        **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += request.reward_amount;

        request.status = RequestStatus::Cancelled;

        msg!("Request cancelled!");

        Ok(())
    }
}

#[account]
pub struct OracleState {
    pub admin: Pubkey,
    pub request_count: u64,
    pub total_volume: u64,
    pub bump: u8,
}

#[account]
pub struct Request {
    pub request_id: u64,
    pub creator: Pubkey,
    pub question: String,
    pub answer_type: AnswerType,
    pub reward_amount: u64,
    pub bond_amount: u64,
    pub expiry_timestamp: i64,
    pub challenge_period: i64,
    pub data_source: Option<String>,
    pub metadata: Option<String>,
    pub status: RequestStatus,
    pub created_at: i64,
    pub proposer: Option<Pubkey>,
    pub proposal_time: Option<i64>,
    pub answer: Option<String>,
    pub disputer: Option<Pubkey>,
    pub dispute_time: Option<i64>,
    pub resolved_at: Option<i64>,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 8 + 8 + 1,
        seeds = [b"oracle_state"],
        bump
    )]
    pub oracle_state: Account<'info, OracleState>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateRequest<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 8 + 32 + 500 + 1 + 8 + 8 + 8 + 8 + 200 + 500 + 1 + 8 + 33 + 9 + 200 + 33 + 9 + 9 + 1,
        seeds = [b"request", oracle_state.request_count.checked_add(1).unwrap().to_le_bytes().as_ref()],
        bump
    )]
    pub request: Account<'info, Request>,
    
    #[account(
        mut,
        seeds = [b"oracle_state"],
        bump = oracle_state.bump
    )]
    pub oracle_state: Account<'info, OracleState>,
    
    /// CHECK: This is a PDA used as an escrow account to hold the reward amount for this request
    #[account(
        mut,
        seeds = [b"request_escrow", request.key().as_ref()],
        bump
    )]
    pub request_escrow: AccountInfo<'info>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProposeAnswer<'info> {
    #[account(
        mut,
        seeds = [b"request", request.request_id.to_le_bytes().as_ref()],
        bump = request.bump
    )]
    pub request: Account<'info, Request>,
    
    /// CHECK: This is a PDA used as an escrow account to hold the proposer's bond
    #[account(
        mut,
        seeds = [b"proposal_escrow", request.key().as_ref()],
        bump
    )]
    pub proposal_escrow: AccountInfo<'info>,
    
    #[account(mut)]
    pub proposer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DisputeAnswer<'info> {
    #[account(
        mut,
        seeds = [b"request", request.request_id.to_le_bytes().as_ref()],
        bump = request.bump
    )]
    pub request: Account<'info, Request>,
    
    /// CHECK: This is a PDA used as an escrow account to hold the disputer's bond
    #[account(
        mut,
        seeds = [b"dispute_escrow", request.key().as_ref()],
        bump
    )]
    pub dispute_escrow: AccountInfo<'info>,
    
    #[account(mut)]
    pub disputer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveUndisputed<'info> {
    #[account(
        mut,
        seeds = [b"request", request.request_id.to_le_bytes().as_ref()],
        bump = request.bump
    )]
    pub request: Account<'info, Request>,
    
    /// CHECK: This is a PDA escrow account that holds the request reward, verified by seeds
    #[account(
        mut,
        seeds = [b"request_escrow", request.key().as_ref()],
        bump
    )]
    pub request_escrow: AccountInfo<'info>,
    
    /// CHECK: This is a PDA escrow account that holds the proposer's bond, verified by seeds
    #[account(
        mut,
        seeds = [b"proposal_escrow", request.key().as_ref()],
        bump
    )]
    pub proposal_escrow: AccountInfo<'info>,
    
    /// CHECK: This is the proposer's account to receive the payout, validated by matching request.proposer
    #[account(mut)]
    pub proposer_account: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveDisputed<'info> {
    #[account(
        mut,
        seeds = [b"request", request.request_id.to_le_bytes().as_ref()],
        bump = request.bump
    )]
    pub request: Account<'info, Request>,
    
    #[account(
        seeds = [b"oracle_state"],
        bump = oracle_state.bump
    )]
    pub oracle_state: Account<'info, OracleState>,
    
    /// CHECK: This is a PDA escrow account that holds the request reward, verified by seeds
    #[account(
        mut,
        seeds = [b"request_escrow", request.key().as_ref()],
        bump
    )]
    pub request_escrow: AccountInfo<'info>,
    
    /// CHECK: This is a PDA escrow account that holds the proposer's bond, verified by seeds
    #[account(
        mut,
        seeds = [b"proposal_escrow", request.key().as_ref()],
        bump
    )]
    pub proposal_escrow: AccountInfo<'info>,
    
    /// CHECK: This is a PDA escrow account that holds the disputer's bond, verified by seeds
    #[account(
        mut,
        seeds = [b"dispute_escrow", request.key().as_ref()],
        bump
    )]
    pub dispute_escrow: AccountInfo<'info>,
    
    /// CHECK: This is the winner's account to receive the payout, validated in instruction logic
    #[account(mut)]
    pub winner_account: AccountInfo<'info>,
    
    pub resolver: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelRequest<'info> {
    #[account(
        mut,
        seeds = [b"request", request.request_id.to_le_bytes().as_ref()],
        bump = request.bump
    )]
    pub request: Account<'info, Request>,
    
    /// CHECK: This is a PDA escrow account that holds the request reward, verified by seeds
    #[account(
        mut,
        seeds = [b"request_escrow", request.key().as_ref()],
        bump
    )]
    pub request_escrow: AccountInfo<'info>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AnswerType {
    YesNo,
    MultipleChoice,
    Numeric,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum RequestStatus {
    Created,
    Proposed,
    Disputed,
    Resolved,
    Cancelled,
}

#[event]
pub struct RequestCreated {
    pub request_id: u64,
    pub creator: Pubkey,
    pub question: String,
    pub reward_amount: u64,
    pub bond_amount: u64,
    pub expiry_timestamp: i64,
}

#[event]
pub struct AnswerProposed {
    pub request_id: u64,
    pub proposer: Pubkey,
    pub answer: String,
    pub proposal_time: i64,
}

#[event]
pub struct AnswerDisputed {
    pub request_id: u64,
    pub disputer: Pubkey,
    pub dispute_time: i64,
}

#[event]
pub struct RequestResolved {
    pub request_id: u64,
    pub answer: String,
    pub winner: Pubkey,
    pub payout: u64,
}

#[event]
pub struct DisputeResolved {
    pub request_id: u64,
    pub winner: Pubkey,
    pub loser: Pubkey,
    pub proposer_wins: bool,
}

#[error_code]
pub enum OracleError {
    #[msg("Question too long (max 500 characters)")]
    QuestionTooLong,
    #[msg("Answer too long (max 200 characters)")]
    AnswerTooLong,
    #[msg("Invalid reward amount")]
    InvalidReward,
    #[msg("Invalid bond amount")]
    InvalidBond,
    #[msg("Invalid expiry timestamp")]
    InvalidExpiry,
    #[msg("Challenge period too short (min 1 hour)")]
    ChallengePeriodTooShort,
    #[msg("Challenge period too long (max 7 days)")]
    ChallengePeriodTooLong,
    #[msg("Invalid request status")]
    InvalidStatus,
    #[msg("Request has not expired yet")]
    RequestNotExpired,
    #[msg("Invalid answer format")]
    InvalidAnswer,
    #[msg("No proposal exists")]
    NoProposal,
    #[msg("No proposer exists")]
    NoProposer,
    #[msg("No disputer exists")]
    NoDisputer,
    #[msg("Challenge period has expired")]
    ChallengePeriodExpired,
    #[msg("Challenge period has not expired")]
    ChallengePeriodNotExpired,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Cannot cancel request")]
    CannotCancel,
}
