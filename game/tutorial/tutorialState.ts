import type { Recipe } from '@/game/recipes';

export type TutorialState = { completedWelcome: boolean };

export const DEFAULT_TUTORIAL_STATE: TutorialState = { completedWelcome: true };

const TUTORIAL_STAGES = [
  { flow: 'welcome', kind: 'welcome-company', title: 'Welcome to Industri Clicker' },
  { flow: 'welcome', kind: 'welcome-balance', title: 'Your company balance' },
  { flow: 'welcome', kind: 'welcome-time', title: 'Your company time' },
  { flow: 'welcome', kind: 'welcome-overview', title: 'Your company overview' },
  { flow: 'welcome', kind: 'welcome-production', nextKind: 'production', title: 'Production' },
  { flow: 'facility', kind: 'production', previousKind: 'welcome-production', title: 'Production' },
  { flow: 'facility', kind: 'build-facility', title: 'Build a facility' },
  { flow: 'facility', kind: 'construction', title: 'Choose your first facility' },
  { flow: 'facility', kind: 'facility-choice', title: 'Comparing facilities' },
  { flow: 'facility', kind: 'construction-confirmation', title: 'Confirm construction' },
  { flow: 'facility', kind: 'first-facility', firstFacilityStep: 'overview', previousKind: 'build-facility', title: 'Your first facility' },
  { flow: 'facility', kind: 'first-facility-header', firstFacilityStep: 'header', title: 'Your facility header' },
  { flow: 'facility', kind: 'first-facility-footprint', firstFacilityStep: 'efficiency', title: 'Facility efficiency' },
  { flow: 'facility', kind: 'first-facility-staff-management', firstFacilityStep: 'staff-management', title: 'Staff management' },
  { flow: 'facility', kind: 'first-facility-staff-training', firstFacilityStep: 'staff-training', title: 'Staff Quality and wages' },
  { flow: 'facility', kind: 'first-facility-repair', firstFacilityStep: 'repair', title: 'Repair and condition' },
  { flow: 'facility', kind: 'first-facility-efficiency', firstFacilityStep: 'footprint', title: 'Industrial Footprint' },
  { flow: 'facility', kind: 'first-facility-research', firstFacilityStep: 'research', title: 'First Recipe' },
  { flow: 'facility', kind: 'first-facility-recipe-card', firstFacilityStep: 'recipe-card', title: 'Recipe and production cycle' },
  { flow: 'facility', kind: 'first-facility-recipe-automation', firstFacilityStep: 'recipe-automation', title: 'Automatic production' },
  { flow: 'facility', kind: 'first-facility-recipe-optional-inputs', firstFacilityStep: 'recipe-optional-inputs', title: 'Optional inputs' },
  { flow: 'facility', kind: 'first-facility-recipe-economics', firstFacilityStep: 'recipe-economics', title: 'Recipe economics' },
  { flow: 'facility', kind: 'first-facility-upgrades', firstFacilityStep: 'upgrades', title: 'Facility upgrades' },
  { flow: 'facility', kind: 'first-facility-inventory-transition', firstFacilityStep: 'inventory-transition', nextKind: 'inventory', title: 'Your facility is ready' },
  { flow: 'inventory', kind: 'inventory', previousKind: 'first-facility-upgrades', title: 'Inventory and markets' },
  { flow: 'inventory', kind: 'inventory-resource', previousKind: 'inventory', title: 'Open a produced resource' },
] as const;

type TutorialStageDefinition = (typeof TUTORIAL_STAGES)[number];
type TutorialStageFromDefinition<Definition> = Definition extends { kind: infer Kind extends string } ? { kind: Kind } : never;
type FirstFacilityTutorialStageDefinition = Extract<TutorialStageDefinition, { firstFacilityStep: string }>;

export type TutorialFlow = TutorialStageDefinition['flow'];
export type TutorialStage = TutorialStageFromDefinition<TutorialStageDefinition>;
export type WelcomeTutorialStage = Extract<TutorialStageDefinition, { flow: 'welcome' }>['kind'];
export type FirstFacilityTutorialStep = FirstFacilityTutorialStageDefinition['firstFacilityStep'];
export type TutorialProgress = { step: number; total: number };
export type TutorialStagePresentation = {
  firstFacilityStep: FirstFacilityTutorialStep | null;
  flow: TutorialFlow;
  kind: TutorialStage['kind'];
  progress: TutorialProgress;
  title: string;
};

function getTutorialStageDefinition(stage: TutorialStage | null): TutorialStageDefinition | undefined {
  return TUTORIAL_STAGES.find((candidate) => candidate.kind === stage?.kind);
}

function getTutorialFlowStages(flow: TutorialFlow): readonly TutorialStageDefinition[] {
  return TUTORIAL_STAGES.filter((candidate) => candidate.flow === flow);
}

export function getTutorialStagePresentation(stage: TutorialStage | null): TutorialStagePresentation | null {
  const definition = getTutorialStageDefinition(stage);
  if (!definition) return null;
  const flowStages = getTutorialFlowStages(definition.flow);
  const step = flowStages.findIndex((candidate) => candidate.kind === definition.kind) + 1;
  return {
    firstFacilityStep: 'firstFacilityStep' in definition ? definition.firstFacilityStep : null,
    flow: definition.flow,
    kind: definition.kind,
    progress: { step, total: flowStages.length },
    title: definition.title,
  };
}

export function getNextTutorialStage(stage: TutorialStage): TutorialStage | null {
  const definition = getTutorialStageDefinition(stage);
  if (!definition) return null;
  const flowStages = getTutorialFlowStages(definition.flow);
  const index = flowStages.findIndex((candidate) => candidate.kind === definition.kind);
  const nextStage = flowStages[index + 1];
  if (nextStage) return { kind: nextStage.kind } as TutorialStage;
  return 'nextKind' in definition ? { kind: definition.nextKind } as TutorialStage : null;
}

export function getPreviousTutorialStage(stage: TutorialStage): TutorialStage | null {
  const definition = getTutorialStageDefinition(stage);
  if (!definition) return null;
  if ('previousKind' in definition) return { kind: definition.previousKind } as TutorialStage;
  const flowStages = getTutorialFlowStages(definition.flow);
  const index = flowStages.findIndex((candidate) => candidate.kind === definition.kind);
  const previousStage = flowStages[index - 1];
  return previousStage ? { kind: previousStage.kind } as TutorialStage : null;
}

export type TutorialProductionPresentation = {
  firstFacilityFocus: 'header' | 'efficiency' | 'recipe' | null;
  firstFacilityRecipeName: Recipe['name'] | null;
  firstFacilityStep: FirstFacilityTutorialStep | null;
  isBuildFacilityTutorial: boolean;
  isFirstFacilityTutorial: boolean;
  isProductionTutorial: boolean;
  inventoryResource?: import('@/game/resources').ResourceType | null;
  tutorialStageKind?: TutorialStage['kind'];
};

export function getTutorialProductionPresentation(stage: TutorialStage | null, recipeName: Recipe['name'] | null, isRecipeFocusActive: boolean): TutorialProductionPresentation {
  const firstFacilityStep = getTutorialStagePresentation(stage)?.firstFacilityStep ?? null;
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

export function recoverTutorialStage(lastStage: TutorialStage, hasFirstFacility: boolean, hasPendingConstruction: boolean): TutorialStage {
  if (lastStage.kind === 'construction-confirmation') return hasFirstFacility ? { kind: 'first-facility' } : hasPendingConstruction ? lastStage : { kind: 'build-facility' };
  if (lastStage.kind.startsWith('first-facility') && !hasFirstFacility) return { kind: 'build-facility' };
  return lastStage;
}
