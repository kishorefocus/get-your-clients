"""rename stripe to paddle columns

Revision ID: 9a3b8d6f5c8e
Revises: 162747512bab
Create Date: 2026-08-29 14:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a3b8d6f5c8e'
down_revision: Union[str, None] = '162747512bab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('subscriptions', 'stripe_subscription_id', new_column_name='paddle_subscription_id')
    op.alter_column('subscriptions', 'stripe_customer_id', new_column_name='paddle_customer_id')


def downgrade() -> None:
    op.alter_column('subscriptions', 'paddle_subscription_id', new_column_name='stripe_subscription_id')
    op.alter_column('subscriptions', 'paddle_customer_id', new_column_name='stripe_customer_id')
