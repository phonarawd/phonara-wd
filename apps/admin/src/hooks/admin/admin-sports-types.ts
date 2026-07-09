export type SportsFixtureStatus = 'live' | 'ft' | 'scheduled';

export interface SportsFixtureRow {
  id: string;
  league: string;
  home: string;
  away: string;
  kickoff: string;
  unsettledMarkets: number;
  exposure: string;
  status: SportsFixtureStatus;
}

export interface MarketSuspension {
  fixtureId: string;
  reason: string;
  at: string;
}

export type RiskSeverity = 'info' | 'warn' | 'crit';

export interface RiskEvent {
  id: string;
  severity: RiskSeverity;
  labelKey: string;
  at: string;
}

export interface ExposureAggregate {
  total: string;
  max: string;
  openBets: number;
}

export type RiskTier = 'A' | 'B' | 'C';

export interface AdminSportsState {
  featureEnabled: boolean;
  fixtures: SportsFixtureRow[];
  suspended: MarketSuspension[];
  risk: RiskEvent[];
  exposure: ExposureAggregate;
  tier: RiskTier;
}

export type SportsUserRiskTier = 'normal' | 'restricted' | 'sharp' | 'banned';

export interface AdminSportsActions {
  setFeatureEnabled: (enabled: boolean, reason: string) => void;
  suspendMarket: (fixtureId: string, reason: string) => void;
  unsuspendMarket: (fixtureId: string, reason: string) => Promise<boolean>;
  settleFixtureQuorum: (
    fixtureId: string,
    homeGoals: number,
    awayGoals: number,
    reason: string,
    forceQuorum: boolean,
  ) => Promise<boolean>;
  voidFixtureMarket: (fixtureId: string, reason: string) => Promise<boolean>;
  setSportsRiskTier: (userId: string, tier: SportsUserRiskTier, reason: string) => Promise<boolean>;
  resetForTest: () => void;
}
