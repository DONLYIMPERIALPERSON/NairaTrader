#!/usr/bin/env python3
import os
import sys
import requests

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

os.environ['DATABASE_URL'] = 'postgresql://postgres:password@localhost:5432/nairatrader'

from app.db.session import get_db
from sqlalchemy.orm import Session
from app.models.mt5_account import MT5Account
from app.models.challenge_account import ChallengeAccount
from app.services.challenge_objectives import process_challenge_feed
from datetime import datetime, timezone

def main():
    db: Session = next(get_db())

    # Find the Phase 2 account
    account = db.query(MT5Account).filter(MT5Account.account_number == '10452211').first()
    if not account:
        print("Account 10452211 not found")
        return

    print(f"Found account: {account.account_number} (ID: {account.id})")

    # Find its challenge
    challenge = db.query(ChallengeAccount).filter(ChallengeAccount.active_mt5_account_id == account.id).first()
    if not challenge:
        print("No active challenge found for this account")
        return

    print(f"Challenge: {challenge.challenge_id}")
    print(f"Current stage: {challenge.current_stage}")
    print(f"Objective status: {challenge.objective_status}")
    print(f"Profit target: {challenge.profit_target_balance}")
    print(f"Current balance: {challenge.latest_balance}")

    # Feed data that will make it pass to funded stage
    # Set balance to exceed profit target + some trades
    target_balance = challenge.profit_target_balance + 1000  # Exceed target

    print(f"Feeding data to reach balance: {target_balance}")

    # Process the feed - this should trigger progression to funded
    result_challenge, next_stage = process_challenge_feed(
        db=db,
        challenge=challenge,
        balance=target_balance,
        equity=target_balance,
        closed_trade_durations_seconds=[300, 400, 350],  # Valid trade durations
        scalping_breach_increment=None,
        equity_breach_signal=None,
        balance_breach_signal=None,
        stage_pass_signal=True,  # Signal that stage has passed
        closed_trades_count_increment=5,
        winning_trades_count_increment=4,
        lots_traded_increment=2.5,
        today_closed_pnl=1500,
        today_trades_count=5,
        today_lots_total=2.5,
        observed_at=datetime.now(timezone.utc)
    )

    db.commit()

    print(f"After feed - Stage: {result_challenge.current_stage}")
    print(f"Objective status: {result_challenge.objective_status}")

    if next_stage:
        print(f"Progressed to: {next_stage}")
        print("✅ Auto certificate generation should have been triggered!")

    # Check if certificate was created
    from app.models.certificate import Certificate
    certificates = db.query(Certificate).filter(
        Certificate.user_id == challenge.user_id,
        Certificate.related_entity_id == challenge.challenge_id
    ).all()

    if certificates:
        print(f"✅ Certificate(s) created: {len(certificates)}")
        for cert in certificates:
            print(f"   - {cert.title}: {cert.certificate_url}")
    else:
        print("❌ No certificates found")

if __name__ == "__main__":
    main()