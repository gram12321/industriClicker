import { describe, expect, it } from 'vitest';
import { getNextTutorialStage, getPreviousTutorialStage, getTutorialStagePresentation, getTutorialProductionPresentation, recoverTutorialStage, type TutorialStage } from '@/game/tutorial';

describe('tutorial flow', () => {
  it('derives every tutorial flow from the shared stage catalogue', () => {
    const facilityStages: TutorialStage[] = [
      { kind: 'production' },
      { kind: 'build-facility' },
      { kind: 'construction' },
      { kind: 'facility-choice' },
      { kind: 'construction-confirmation' },
      { kind: 'first-facility' },
      { kind: 'first-facility-header' },
      { kind: 'first-facility-footprint' },
      { kind: 'first-facility-staff-management' },
      { kind: 'first-facility-staff-training' },
      { kind: 'first-facility-repair' },
      { kind: 'first-facility-efficiency' },
      { kind: 'first-facility-research' },
      { kind: 'first-facility-recipe-card' },
      { kind: 'first-facility-recipe-automation' },
      { kind: 'first-facility-recipe-optional-inputs' },
      { kind: 'first-facility-recipe-economics' },
      { kind: 'first-facility-upgrades' },
      { kind: 'first-facility-inventory-transition' },
    ];

    expect(facilityStages.map((stage) => getTutorialStagePresentation(stage)?.progress)).toEqual(
      facilityStages.map((_, index) => ({ step: index + 1, total: facilityStages.length })),
    );
    expect(getTutorialStagePresentation({ kind: 'inventory' })).toMatchObject({
      flow: 'inventory',
      progress: { step: 1, total: 1 },
      title: 'Inventory and markets',
    });
    expect(getTutorialStagePresentation({ kind: 'welcome-production' })).toMatchObject({
      flow: 'welcome',
      progress: { step: 5, total: 5 },
      title: 'Production',
    });
  });

  it('preserves the first-facility step order', () => {
    const stages: TutorialStage[] = [
      { kind: 'first-facility' },
      { kind: 'first-facility-header' },
      { kind: 'first-facility-footprint' },
      { kind: 'first-facility-staff-management' },
      { kind: 'first-facility-staff-training' },
      { kind: 'first-facility-repair' },
      { kind: 'first-facility-efficiency' },
      { kind: 'first-facility-research' },
      { kind: 'first-facility-recipe-card' },
      { kind: 'first-facility-recipe-automation' },
      { kind: 'first-facility-recipe-optional-inputs' },
      { kind: 'first-facility-recipe-economics' },
      { kind: 'first-facility-upgrades' },
      { kind: 'first-facility-inventory-transition' },
      { kind: 'inventory' },
    ];

    expect(stages.map((stage) => getNextTutorialStage(stage)?.kind ?? null)).toEqual([
      'first-facility-header',
      'first-facility-footprint',
      'first-facility-staff-management',
      'first-facility-staff-training',
      'first-facility-repair',
      'first-facility-efficiency',
      'first-facility-research',
      'first-facility-recipe-card',
      'first-facility-recipe-automation',
      'first-facility-recipe-optional-inputs',
      'first-facility-recipe-economics',
      'first-facility-upgrades',
      'first-facility-inventory-transition',
      'inventory',
      null,
    ]);
    expect(getPreviousTutorialStage({ kind: 'first-facility-research' })).toEqual({ kind: 'first-facility-efficiency' });
    expect(getPreviousTutorialStage({ kind: 'first-facility-recipe-economics' })).toEqual({ kind: 'first-facility-recipe-optional-inputs' });
  });

  it('uses catalogue links to cross tutorial-flow boundaries', () => {
    expect(getNextTutorialStage({ kind: 'welcome-production' })).toEqual({ kind: 'production' });
    expect(getPreviousTutorialStage({ kind: 'production' })).toEqual({ kind: 'welcome-production' });
    expect(getPreviousTutorialStage({ kind: 'first-facility' })).toEqual({ kind: 'build-facility' });
    expect(getPreviousTutorialStage({ kind: 'inventory' })).toEqual({ kind: 'first-facility-upgrades' });
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
    expect(getTutorialProductionPresentation({ kind: 'first-facility-recipe-optional-inputs' }, null, true)).toMatchObject({
      firstFacilityFocus: null,
      firstFacilityStep: 'recipe-optional-inputs',
      isFirstFacilityTutorial: true,
    });
  });

  it('recovers dismissed construction stages exactly as before', () => {
    expect(recoverTutorialStage({ kind: 'construction-confirmation' }, true, true)).toEqual({ kind: 'first-facility' });
    expect(recoverTutorialStage({ kind: 'construction-confirmation' }, false, false)).toEqual({ kind: 'build-facility' });
    expect(recoverTutorialStage({ kind: 'first-facility-repair' }, false, false)).toEqual({ kind: 'build-facility' });
  });
});
