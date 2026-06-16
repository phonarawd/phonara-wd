/** Wave-S2 normalizer contract (C1 semantics). */
export type FixtureStatus = 'scheduled' | 'live' | 'finished' | 'void' | 'cancelled';

export type MarketType = 'match_1x2' | 'totals_2_5' | (string & {});

export type Selection = 'home' | 'draw' | 'away' | 'over' | 'under' | 'yes' | 'no';

export interface FixturePayload {
  readonly fixtureId: string;
  readonly leagueCode: string;
  readonly homeName: string;
  readonly awayName: string;
  readonly kickoffAt: string;
  readonly status: FixtureStatus;
}

export interface OutcomePayload {
  readonly outcomeId: string;
  readonly selection: Selection;
  readonly line?: string;
}

export interface MarketPayload {
  readonly marketId: string;
  readonly marketType: MarketType;
  readonly status: string;
  readonly line?: string;
  readonly period?: string;
  readonly propKey?: string;
  readonly outcomes: readonly OutcomePayload[];
}

export type IngestMessage =
  | {
      readonly type: 'event_upsert';
      readonly fixture: FixturePayload;
      readonly markets: readonly MarketPayload[];
    }
  | {
      readonly type: 'odds_upsert';
      readonly outcomeId: string;
      readonly odds: string;
      readonly capturedAt: string;
    }
  | {
      readonly type: 'event_remove';
      readonly fixtureId: string;
      readonly reason: string;
    };

export interface BetLegInput {
  readonly outcomeId: string;
  readonly odds: string;
  readonly fixtureId: string;
}
