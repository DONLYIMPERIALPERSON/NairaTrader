#!/usr/bin/env python3
"""
Feed test data to funded account 10452202 to generate ~11% profit
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Load environment variables
load_dotenv('backend/.env')

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.db.deps import get_db
from app.models.mt5_account import MT5Account
from app.models.challenge_account import ChallengeAccount
from app.services.challenge_objectives import process_challenge_feed
from datetime import datetime, timezone

def main():
    db: Session = next(get_db())

    # Find the funded account
    account = db.query(MT5Account).filter(MT5Account.account_number == '10452202').first()
    if not account:
        print("❌ Account 10452202 not found")
        return

    print(f"📋 Found account: {account.account_number} (ID: {account.id})")

    # Find its challenge
    challenge = db.query(ChallengeAccount).filter(ChallengeAccount.active_mt5_account_id == account.id).first()
    if not challenge:
        print("❌ No active challenge found for this account")
        return

    print(f"🎯 Challenge: {challenge.challenge_id}")
    print(f"📊 Current stage: {challenge.current_stage}")
    print(f"🎯 Objective status: {challenge.objective_status}")
    print(f"💰 Initial balance: ₦{challenge.initial_balance:,.2f}")
    print(f"📈 Current balance: ₦{challenge.latest_balance or 0:,.2f}")
    print(f"🎯 Profit target: ₦{challenge.profit_target_balance:,.2f}")

    # Calculate 11% profit target
    target_profit_percentage = 11.0
    target_balance = challenge.initial_balance * (1 + target_profit_percentage / 100)

    print(f"\n🎯 Target: {target_profit_percentage}% profit = ₦{target_balance:,.2f}")

    # Check if already funded
    if challenge.current_stage == "Funded":
        print("✅ Account is already funded!")

        # Calculate current profit
        current_profit = ((challenge.latest_balance or 0) - challenge.initial_balance) / challenge.initial_balance * 100
        print(f"📊 Current profit: {current_profit:.2f}%")

        # If no profit yet, continue to feed data
        if current_profit < target_profit_percentage:
            print(f"🚀 Account has {current_profit:.2f}% profit, feeding data to reach {target_profit_percentage}%...")
        else:
            # Check available payout
            from app.services.challenge_objectives import compute_funded_payout_metrics
            compute_funded_payout_metrics(db, challenge, challenge.latest_balance or 0)

            available_payout = challenge.funded_user_payout_amount or 0
            print(f"💵 Available payout: ₦{available_payout:,.2f}")
            return

    print(f"\n🚀 Feeding data to reach balance: ₦{target_balance:,.2f}")

    # Process the feed - this should trigger progression to funded
    result_challenge, next_stage = process_challenge_feed(
        db=db,
        challenge=challenge,
        balance=target_balance,
        equity=target_balance,
        closed_trade_durations_seconds=[300, 400, 350, 280, 420],  # Valid trade durations
        scalping_breach_increment=None,
        equity_breach_signal=None,
        balance_breach_signal=None,
        stage_pass_signal=True,  # Signal that stage has passed
        closed_trades_count_increment=8,
        winning_trades_count_increment=6,
        lots_traded_increment=4.2,
        today_closed_pnl=target_balance - challenge.initial_balance,
        today_trades_count=8,
        today_lots_total=4.2,
        observed_at=datetime.now(timezone.utc)
    )

    db.commit()

    print("\n✅ Feed processed!")
    print(f"📊 New stage: {result_challenge.current_stage}")
    print(f"🎯 New objective status: {result_challenge.objective_status}")
    print(f"💰 New balance: ₦{result_challenge.latest_balance or 0:,.2f}")

    if next_stage:
        print(f"🎉 Progressed to: {next_stage}")

        # Calculate actual profit percentage
        final_balance = result_challenge.latest_balance or 0
        profit_amount = final_balance - challenge.initial_balance
        profit_percentage = (profit_amount / challenge.initial_balance) * 100

        print(f"💰 Profit: ₦{profit_amount:,.2f} ({profit_percentage:.2f}%)")

        # Check available payout
        from app.services.challenge_objectives import compute_funded_payout_metrics
        compute_funded_payout_metrics(db, result_challenge, final_balance)

        available_payout = result_challenge.funded_user_payout_amount or 0
        print(f"💵 Available payout: ₦{available_payout:,.2f}")

        # Check if certificate was created
        from app.models.certificate import Certificate
        certificates = db.query(Certificate).filter(
            Certificate.user_id == challenge.user_id,
            Certificate.related_entity_id == challenge.challenge_id
        ).all()

        if certificates:
            print(f"🏆 Certificate(s) created: {len(certificates)}")
            for cert in certificates:
                print(f"   - {cert.title}: {cert.certificate_url}")
        else:
            print("❌ No certificates found")

if __name__ == "__main__":
    main()