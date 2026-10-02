"""rename paddle columns to razorpay columns

Revision ID: a1f3c8e72d59
Revises: 9a3b8d6f5c8e
Create Date: 2026-10-02 13:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1f3c8e72d59'
down_revision: Union[str, None] = 'e3d2a45a2b16'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename paddle_subscription_id -> razorpay_payment_id
    op.alter_column('subscriptions', 'paddle_subscription_id', new_column_name='razorpay_payment_id')
    # Rename paddle_customer_id -> razorpay_order_id
    op.alter_column('subscriptions', 'paddle_customer_id', new_column_name='razorpay_order_id')


def downgrade() -> None:
    op.alter_column('subscriptions', 'razorpay_payment_id', new_column_name='paddle_subscription_id')
    op.alter_column('subscriptions', 'razorpay_order_id', new_column_name='paddle_customer_id')
