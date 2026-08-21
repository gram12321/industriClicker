import type { Recipe } from '@/game/recipes';

export type TutorialState = { completedWelcome: boolean };

export const DEFAULT_TUTORIAL_STATE: TutorialState = { completedWelcome: true };

export type WelcomeTutorialStep = 1 | 2 | 3 | 4 | 5;

export type FirstFacilityTutorialStep = 'overview' | 'header' | 'footprint' | 'efficiency' | 'repair' | 'research' | 'recipe-card' | 'recipe-automation' | 'recipe-economics' | 'upgrades' | 'inventory-transition';

export type TutorialStage =
  | { kind: 'welcome'; step: WelcomeTutorialStep }
  | { kind: 'production' }
  | { kind: 'build-facility' }
  | { kind: 'construction' }
  | { kind: 'facility-choice' }
  | { kind: 'construction-confirmation' }
  | { kind: 'first-facility' }
  | { kind: 'first-facility-header' }
  | { kind: 'first-facility-footprint' }
  | { kind: 'first-facility-efficiency' }
  | { kind: 'first-facility-repair' }
  | { kind: 'first-facility-research' }
  | { kind: 'first-facility-recipe-card' }
  | { kind: 'first-facility-recipe-automation' }
  | { kind: 'first-facility-recipe-economics' }
  | { kind: 'first-facility-upgrades' }
  | { kind: 'first-facility-inventory-transition' }
  | { kind: 'inventory' };

export type TutorialProductionPresentation = {
  firstFacilityFocus: 'header' | 'efficiency' | 'recipe' | null;
  firstFacilityRecipeName: Recipe['name'] | null;
  firstFacilityStep: FirstFacilityTutorialStep | null;
  isBuildFacilityTutorial: boolean;
  isFirstFacilityTutorial: boolean;
  isProductionTutorial: boolean;
};

const FIRST_FACILITY_STAGES: Readonly<Record<Extract<TutorialStage['kind'], `first-facility${string}`>, FirstFacilityTutorialStep>> = {
  'first-facility': 'overview',
  'first-facility-header': 'header',
  'first-facility-footprint': 'efficiency',
  'first-facility-efficiency': 'footprint',
  'first-facility-repair': 'repair',
  'first-facility-research': 'research',
  'first-facility-recipe-card': 'recipe-card',
  'first-facility-recipe-automation': 'recipe-automation',
  'first-facility-recipe-economics': 'recipe-economics',
  'first-facility-upgrades': 'upgrades',
  'first-facility-inventory-transition': 'inventory-transition',
};

export function getTutorialProductionPresentation(stage: TutorialStage | null, recipeName: Recipe['name'] | null, isRecipeFocusActive: boolean): TutorialProductionPresentation {
  const firstFacilityStep = stage?.kind.startsWith('first-facility')
    ? FIRST_FACILITY_STAGES[stage.kind as keyof typeof FIRST_FACILITY_STAGES]
    : null;
  return {
    firstFacilityFocus: firstFacilityStep === 'header' ? 'header'
      : firstFacilityStep === 'efficiency' || firstFacilityStep === 'repair' ? 'efficiency'
        : firstFacilityStep === 'research' && isRecipeFocusActive ? 'recipe' : null,
    firstFacilityRecipeName: recipeName,
    firstFacilityStep,
    isBuildFacilityTutorial: stage?.kind === 'build-facility',
    isFirstFacilityTutorial: firstFacilityStep !== null,
    isProductionTutorial: stage?.kind === 'production',
  };
}

export function getNextFirstFacilityTutorialStage(stage: TutorialStage): TutorialStage | null {
  switch (stage.kind) {
    case 'first-facility': return { kind: 'first-facility-header' };
    case 'first-facility-header': return { kind: 'first-facility-footprint' };
    case 'first-facility-footprint': return { kind: 'first-facility-repair' };
    case 'first-facility-repair': return { kind: 'first-facility-efficiency' };
    case 'first-facility-efficiency': return { kind: 'first-facility-research' };
    case 'first-facility-research': return { kind: 'first-facility-recipe-card' };
    case 'first-facility-recipe-card': return { kind: 'first-facility-recipe-automation' };
    case 'first-facility-recipe-automation': return { kind: 'first-facility-recipe-economics' };
    case 'first-facility-recipe-economics': return { kind: 'first-facility-upgrades' };
    case 'first-facility-upgrades': return { kind: 'first-facility-inventory-transition' };
    case 'first-facility-inventory-transition': return { kind: 'inventory' };
    case 'inventory': return null;
    default: return null;
  }
}

export function getPreviousFirstFacilityTutorialStage(stage: TutorialStage): TutorialStage {
  switch (stage.kind) {
    case 'inventory': return { kind: 'first-facility-inventory-transition' };
    case 'first-facility-header': return { kind: 'first-facility' };
    case 'first-facility-footprint': return { kind: 'first-facility-header' };
    case 'first-facility-repair': return { kind: 'first-facility-footprint' };
    case 'first-facility-efficiency': return { kind: 'first-facility-repair' };
    case 'first-facility-research': return { kind: 'first-facility-efficiency' };
    case 'first-facility-recipe-card': return { kind: 'first-facility-research' };
    case 'first-facility-recipe-automation': return { kind: 'first-facility-recipe-card' };
    case 'first-facility-recipe-economics': return { kind: 'first-facility-recipe-automation' };
    case 'first-facility-upgrades': return { kind: 'first-facility-recipe-economics' };
    case 'first-facility-inventory-transition': return { kind: 'first-facility-upgrades' };
    default: return { kind: 'build-facility' };
  }
}

export function recoverTutorialStage(lastStage: TutorialStage, hasFirstFacility: boolean, hasPendingConstruction: boolean): TutorialStage {
  if (lastStage.kind === 'construction-confirmation') return hasFirstFacility ? { kind: 'first-facility' } : hasPendingConstruction ? lastStage : { kind: 'build-facility' };
  if (lastStage.kind.startsWith('first-facility') && !hasFirstFacility) return { kind: 'build-facility' };
  return lastStage;
}
