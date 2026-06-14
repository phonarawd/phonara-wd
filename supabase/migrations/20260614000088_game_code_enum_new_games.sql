-- Enum extension: new casino game codes (must be separate from implementation DDL).
ALTER TYPE game_code ADD VALUE IF NOT EXISTS 'mint_reels';
ALTER TYPE game_code ADD VALUE IF NOT EXISTS 'gold_rush';
ALTER TYPE game_code ADD VALUE IF NOT EXISTS 'roulette';
ALTER TYPE game_code ADD VALUE IF NOT EXISTS 'blackjack';
