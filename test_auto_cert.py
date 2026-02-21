#!/usr/bin/env python3
import os
import sys

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

os.environ['DATABASE_URL'] = 'postgresql://postgres:password@localhost:5432/nairatrader'

from app.db.session import get_db
from sqlalchemy.orm import Session
from app.models.mt5_account import MT5Account
from app.models.challenge_account import ChallengeAccount

def main():
    db: Session = next(get_db())

    # Find the Phase 2 account
    account = db.query(MT5Account).filter(MT5Account.account_number == '10452211').first()
    if not account:
        print("Account 10452211 not found")
        return

    print(f"Found account: {account.account_number} (ID: {account.id})")
    print(f"Status: {account.status}, Size: {account.account_size}")

    # Find its challenge
    challenge = db.query(ChallengeAccount).filter(ChallengeAccount.active_mt5_account_id == account.id).first()
    if not challenge:
        print("No active challenge found for this account")
        return

    print(f"Challenge: {challenge.challenge_id}")
    print(f"Current stage: {challenge.current_stage}")
    print(f"Objective status: {challenge.objective_status}")

    # Set to awaiting next stage
    if challenge.objective_status != "awaiting_next_stage_account":
        challenge.objective_status = "awaiting_next_stage_account"
        db.commit()
        print("Set challenge to awaiting_next_stage_account")

    # Check for ready funded accounts
    ready_funded = db.query(MT5Account).filter(
        MT5Account.status == "Ready",
        MT5Account.account_size == challenge.account_size
    ).count()

    print(f"Ready funded accounts available: {ready_funded}")

    if ready_funded > 0:
        print("Ready to test auto-assignment!")
    else:
        print("No ready funded accounts - need to create some first")

if __name__ == "__main__":
    main()