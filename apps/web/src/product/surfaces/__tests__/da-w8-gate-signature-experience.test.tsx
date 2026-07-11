import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MessageKey } from '@phonara/i18n';

import {
  DA_W8_SIGNATURE_MOMENTS,
  DA_W8_SIGNATURE_SURFACES,
} from '@/domain/da-w8-signature-surfaces-display-contract';
import {
  DA_W8_GATE_EMOTION_MAP_FORBIDDEN,
  DA_W8_GATE_EMOTION_MAP_TARGETS,
  DA_W8_GATE_SIGNATURE_DISTINGUISH_MARKERS,
  DA_W8_GATE_SIGNATURE_SCAN_CUES,
  daW8GateEmotionTarget,
  daW8GateSignatureMoment,
} from '@/domain/da-w8-gate-signature-experience-display-contract';
import { SportsKickoffCountdown } from '@/product/surfaces/sports/sports-kickoff-countdown';

describe('da-w8-gate-signature-experience · Emotion Map + signature scan (§34.2 · YAML #228)', () => {
  it('keeps seven signature scan cues unique so W8 artifacts do not collide', () => {
    const cues = Object.values(DA_W8_GATE_SIGNATURE_SCAN_CUES);
    expect(new Set(cues).size).toBe(7);
    expect(cues).toHaveLength(7);

    for (const surface of DA_W8_SIGNATURE_SURFACES) {
      expect(DA_W8_GATE_SIGNATURE_SCAN_CUES[surface]).toBe(DA_W8_SIGNATURE_MOMENTS[surface]);
      expect(daW8GateSignatureMoment(surface)).toBe(DA_W8_SIGNATURE_MOMENTS[surface]);
    }
  });

  it('aligns each signature surface with §34.2 Emotion Map target and forbidden set', () => {
    for (const surface of DA_W8_SIGNATURE_SURFACES) {
      const target = daW8GateEmotionTarget(surface);
      expect(target).toBe(DA_W8_GATE_EMOTION_MAP_TARGETS[surface]);
      expect(target.length).toBeGreaterThan(0);
      expect(DA_W8_GATE_EMOTION_MAP_FORBIDDEN[surface].length).toBeGreaterThanOrEqual(2);
      // Forbidden cues must not equal the Emotion Map target id.
      expect(DA_W8_GATE_EMOTION_MAP_FORBIDDEN[surface]).not.toContain(target);
    }

    expect(DA_W8_GATE_EMOTION_MAP_TARGETS.home).toBe('achievement-restrained');
    expect(DA_W8_GATE_EMOTION_MAP_TARGETS.wallet).toBe('stability-control');
    expect(DA_W8_GATE_EMOTION_MAP_TARGETS.trade).toBe('focus-professional');
    expect(DA_W8_GATE_EMOTION_MAP_TARGETS.sports).toBe('scan-tension-restrained');
    expect(DA_W8_GATE_EMOTION_MAP_TARGETS.casino).toBe('discovery-delight');
    expect(DA_W8_GATE_EMOTION_MAP_TARGETS.vip).toBe('upgrade-celebration-restrained');
  });

  it('renders kickoff countdown with distinct sports signature marker', () => {
    const t = (key: MessageKey, params?: Record<string, string | number>) => {
      if (key === 'sports.fixture.kickoffIn' && params?.countdown) {
        return `In ${params.countdown}`;
      }
      if (key === 'sports.fixture.kickoffStarted') return 'Started';
      return String(key);
    };

    render(
      <div data-testid="da-w8-signature-board">
        <SportsKickoffCountdown
          kickoffAt="2099-01-01T00:00:00.000Z"
          staticLabel="2099-01-01"
          t={t}
          data-testid="gate-kickoff"
        />
      </div>,
    );

    const board = screen.getByTestId('da-w8-signature-board');
    const kickoff = screen.getByTestId('gate-kickoff');
    expect(kickoff).toHaveAttribute('data-signature', 'kickoff-countdown');
    expect(DA_W8_GATE_SIGNATURE_DISTINGUISH_MARKERS.sports).toContain(
      "data-signature='kickoff-countdown'",
    );
    expect(board.querySelector('[data-signature="kickoff-countdown"]')).toBeTruthy();
  });

  it('pins distinguish marker fingerprints for all six surfaces + sound DOC', () => {
    expect(DA_W8_GATE_SIGNATURE_DISTINGUISH_MARKERS.home).toContain(
      "data-signature='greeting-day-flow'",
    );
    expect(DA_W8_GATE_SIGNATURE_DISTINGUISH_MARKERS.wallet).toContain(
      "data-signature='living-balance'",
    );
    expect(DA_W8_GATE_SIGNATURE_DISTINGUISH_MARKERS.trade).toContain(
      "data-signature='market-heat-volume-pulse'",
    );
    expect(DA_W8_GATE_SIGNATURE_DISTINGUISH_MARKERS.casino).toContain(
      "data-signature='tile-float-glow'",
    );
    expect(DA_W8_GATE_SIGNATURE_DISTINGUISH_MARKERS.sports).toContain(
      "data-signature='kickoff-countdown'",
    );
    expect(DA_W8_GATE_SIGNATURE_DISTINGUISH_MARKERS.vip).toContain("data-signature='xp-fill'");
    expect(DA_W8_GATE_SIGNATURE_DISTINGUISH_MARKERS.sound_doc_defer).toContain('E-Wave');
  });
});
