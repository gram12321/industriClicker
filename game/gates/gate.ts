/** A pure progression condition. Callers own the authoritative context. */
export type GateRequirement =
  | { kind: 'achievement'; achievementId: string; label: string }
  | { kind: 'minimum-prestige'; minimumPrestige: number }
  | { kind: 'research'; projectId: string; label: string }
  | { kind: 'starting-condition'; startingConditionId: string; label: string };

export type GateContext = {
  completedAchievementIds: readonly string[];
  completedResearchProjectIds: readonly string[];
  currentPrestige: number;
  startingConditionId: string | null;
};

export type GateEvaluation = {
  allowed: boolean;
  unmetReasons: string[];
};

/** Evaluates every supplied condition without reading application state. */
export function evaluateGateRequirements(
  requirements: readonly GateRequirement[],
  context: GateContext,
): GateEvaluation {
  const unmetReasons = requirements.flatMap((requirement) => {
    switch (requirement.kind) {
      case 'achievement':
        return context.completedAchievementIds.includes(requirement.achievementId)
          ? []
          : [`Requires achievement: ${requirement.label}.`];
      case 'minimum-prestige':
        return Number.isFinite(context.currentPrestige) && context.currentPrestige >= requirement.minimumPrestige
          ? []
          : [`Requires current prestige of ${requirement.minimumPrestige}.`];
      case 'research':
        return context.completedResearchProjectIds.includes(requirement.projectId)
          ? []
          : [`Requires research: ${requirement.label}.`];
      case 'starting-condition':
        return context.startingConditionId === requirement.startingConditionId
          ? []
          : [`Requires starting condition: ${requirement.label}.`];
    }
  });

  return { allowed: unmetReasons.length === 0, unmetReasons };
}
