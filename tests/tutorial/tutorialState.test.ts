import { describe, expect, it } from 'vitest';
import { getNextFirstFacilityTutorialStage, getPreviousFirstFacilityTutorialStage, getTutorialProductionPresentation, recoverTutorialStage, type TutorialStage } from '@/game/tutorial';

describe('tutorial flow', () => {
  it('preserves the first-facility step order', () => {
    const stages: TutorialStage[] = [
      { kind: 'first-facility' },
      { kind: 'first-facility-header' },
      { kind: 'first-facility-footprint' },
      { kind: 'first-facility-repair' },
      { kind: 'first-facility-efficiency' },
      { kind: 'first-facility-research' },
      { kind: 'first-facility-recipe-card' },
      { kind: 'first-facility-recipe-automation' },
      { kind: 'first-facility-recipe-economics' },
      { kind: 'first-facility-upgrades' },
    ];

    expect(stages.map((stage) => getNextFirstFacilityTutorialStage(stage)?.kind ?? null)).toEqual([
      'first-facility-header',
      'first-facility-footprint',
      'first-facility-repair',
      'first-facility-efficiency',
      'first-facility-research',
      'first-facility-recipe-card',
      'first-facility-recipe-automation',
      'first-facility-recipe-economics',
      'first-facility-upgrades',
      null,
    ]);
    expect(getPreviousFirstFacilityTutorialStage({ kind: 'first-facility-research' })).toEqual({ kind: 'first-facility-efficiency' });
  });

  it('keeps the existing facility view highlights and tabs', () => {
    expect(getTutorialProductionPresentation({ kind: 'first-facility-footprint' }, null, true)).toMatchObject({
      firstFacilityFocus: 'efficiency',
      firstFacilityStep: 'efficiency',
      isFirstFacilityTutorial: true,
    });
    expect(getTutorialProductionPresentation({ kind: 'first-facility-efficiency' }, null, true)).toMatchObject({
      firstFacilityFocus: null,
      firstFacilityStep: 'footprint',
    });
    expect(getTutorialProductionPresentation({ kind: 'first-facility-research' }, null, false).firstFacilityFocus).toBeNull();
  });

  it('recovers dismissed construction stages exactly as before', () => {
    expect(recoverTutorialStage({ kind: 'construction-confirmation' }, true, true)).toEqual({ kind: 'first-facility' });
    expect(recoverTutorialStage({ kind: 'construction-confirmation' }, false, false)).toEqual({ kind: 'build-facility' });
    expect(recoverTutorialStage({ kind: 'first-facility-repair' }, false, false)).toEqual({ kind: 'build-facility' });
  });
});
