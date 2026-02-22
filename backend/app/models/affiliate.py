from datetime import datetime
from sqlalchemy import String, Integer, DECIMAL, TIMESTAMP, TEXT, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Affiliate(Base):
    __tablename__ = "affiliates"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)

    # Relationships
    commissions: Mapped[list["AffiliateCommission"]] = relationship("AffiliateCommission", back_populates="affiliate")
    payouts: Mapped[list["AffiliatePayout"]] = relationship("AffiliatePayout", back_populates="affiliate")
    milestones: Mapped[list["AffiliateMilestone"]] = relationship("AffiliateMilestone", back_populates="affiliate")
    clicks: Mapped[list["AffiliateClick"]] = relationship("AffiliateClick", back_populates="affiliate")


class AffiliateCommission(Base):
    __tablename__ = "affiliate_commissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    affiliate_id: Mapped[int] = mapped_column(Integer, ForeignKey("affiliates.user_id"), nullable=False, index=True)
    order_id: Mapped[int] = mapped_column(Integer, nullable=False)
    customer_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(190), nullable=True)
    unique_customer_key: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default='approved')  # approved, revoked
    product_summary: Mapped[str | None] = mapped_column(TEXT, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)

    # Relationships
    affiliate: Mapped["Affiliate"] = relationship("Affiliate", back_populates="commissions")

    __table_args__ = (
        {'mysql_engine': 'InnoDB'}
    )


class AffiliatePayout(Base):
    __tablename__ = "affiliate_payouts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    affiliate_id: Mapped[int] = mapped_column(Integer, ForeignKey("affiliates.user_id"), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False, default=0.00)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default='pending')  # pending, approved, rejected
    requested_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    approved_at: Mapped[datetime | None] = mapped_column(TIMESTAMP, nullable=True)

    # Relationships
    affiliate: Mapped["Affiliate"] = relationship("Affiliate", back_populates="payouts")

    __table_args__ = (
        {'mysql_engine': 'InnoDB'}
    )


class AffiliateMilestone(Base):
    __tablename__ = "affiliate_milestones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    affiliate_id: Mapped[int] = mapped_column(Integer, ForeignKey("affiliates.user_id"), nullable=False, index=True)
    level: Mapped[int] = mapped_column(Integer, nullable=False)  # target number (20, 30, 40, 50)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default='pending')  # pending, approved, rejected
    requested_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    processed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP, nullable=True)

    # Relationships
    affiliate: Mapped["Affiliate"] = relationship("Affiliate", back_populates="milestones")

    __table_args__ = (
        {'mysql_engine': 'InnoDB'}
    )


class AffiliateClick(Base):
    __tablename__ = "affiliate_clicks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    affiliate_id: Mapped[int] = mapped_column(Integer, ForeignKey("affiliates.user_id"), nullable=False, index=True)
    ip_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    ua_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)

    # Relationships
    affiliate: Mapped["Affiliate"] = relationship("Affiliate", back_populates="clicks")

    __table_args__ = (
        {'mysql_engine': 'InnoDB'}
    )