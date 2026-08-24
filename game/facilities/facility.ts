import type { RecipeName } from '@/game/recipes';
import { calculateAsymmetricalScaler01 } from '@/game/core/math/scaling';
import { calculateProgressFromQuality, calculateUpgradeMaxQ } from '@/game/quality';
import { FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE, FACILITY_INITIAL_STAFF_QUALITY, FACILITY_REPAIR_EFFICIENCY_MULTIPLIER, FACILITY_STAFF_QUALITY_EXPERIENCE_PROGRESS_PER_WORK, FACILITY_STAFF_QUALITY_TREND_DECAY_RATE, FACILITY_STAFF_QUALITY_TREND_MEMORY_MINUTES, FACILITY_STAFF_TRAINING_QUALITY_PROGRESS_PER_WORKER, FARM_DEFAULT_SIZE_HECTARES, getFacilityDefinition, getFacilityMaxStaffWage, getFacilitySizeMultiplier, isValidFacilitySize } from './facilityConstants';
import { FacilityType } from './facilityTypes';
import { getConditionDecayMultiplier, getFacilityConditionEfficiency, getFacilityEfficiency, getFacilityStaffTargetWage, getOutputUpgradeMultiplier, getOverstaffingConditionDecayMultiplier, getRequiredWorkers, getSpeedUpgradeWorkSpeedMultiplier, getStaffingEfficiency, getStaffQualityFromProgress, getStaffQualityWagePressurePerMinute, getStaffQualityWageProgressChangePerMinute, getWageEfficiency } from './facilityUpgrades';

/** Plain data used by the game snapshot and Expo SQLite adapter. */
export type FacilitySnapshot = {
  id: string;
  facilityType: FacilityType;
  sizeHectares: number;
  activeRecipeName: RecipeName | null;
  productionCycle: RecipeName[];
  productionCycleIndex: number;
  isActive: boolean;
  recipeProgress: Partial<Record<RecipeName, number>>;
  recipeInputQ: number | null;
  recipeInputSourceCost: number | null;
  qualityUpgradeLevel: number;
  speedUpgradeLevel?: number;
  outputUpgradeLevel?: number;
  conditionDecayUpgradeLevel?: number;
  assignedWorkers?: number;
  staffQualityProgress: number;
  staffQualityTrend: 'rising' | 'falling' | 'steady';
  pendingStaffingChange: { targetWorkers: number; initialWorkers: number; startedAtGameTimeMs: number; completesAtGameTimeMs: number } | null;
  staffTraining: { workers: number; startedAtGameTimeMs: number; completesAtGameTimeMs: number } | null;
  pendingRepair?: { targetCondition: number; startedAtGameTimeMs: number; completesAtGameTimeMs: number } | null;
  staffWagePerWorkerPerMinute: number;
  facilityCondition: number;
  autoRepairEnabled: boolean;
  autoRepairThreshold: number;
  autoRepairTarget: number;
};

/** Immutable facility state and derived values for game rules and UI rendering. */
export type FacilityView = {
  id: string;
  facilityType: FacilityType;
  sizeHectares: number;
  sizeMultiplier: number;
  displayName: string;
  activeRecipeName: RecipeName | null;
  productionCycle: readonly RecipeName[];
  productionCycleIndex: number;
  isActive: boolean;
  recipeProgress: Readonly<Partial<Record<RecipeName, number>>>;
  recipeInputQ: number | null;
  recipeInputSourceCost: number | null;
  qualityUpgradeLevel: number;
  upgradeMaxQ: number;
  speedUpgradeLevel: number;
  outputUpgradeLevel: number;
  conditionDecayUpgradeLevel: number;
  conditionDecayMultiplier: number;
  overstaffingConditionDecayMultiplier: number;
  assignedWorkers: number;
  staffQuality: number;
  staffQualityProgress: number;
  staffQualityTrend: 'rising' | 'falling' | 'steady';
  staffQualityWageTrend: 'rising' | 'falling' | 'steady';
  staffQualityWagePressurePerMinute: number;
  staffWageTargetPerWorkerPerMinute: number;
  pendingStaffingChange: { targetWorkers: number; initialWorkers: number; startedAtGameTimeMs: number; completesAtGameTimeMs: number } | null;
  staffTraining: { workers: number; startedAtGameTimeMs: number; completesAtGameTimeMs: number } | null;
  pendingRepair: { targetCondition: number; startedAtGameTimeMs: number; completesAtGameTimeMs: number } | null;
  staffWagePerWorkerPerMinute: number;
  requiredWorkers: number;
  staffingEfficiency: number;
  facilityCondition: number;
  conditionEfficiency: number;
  facilityEfficiency: number;
  autoRepairEnabled: boolean;
  autoRepairThreshold: number;
  autoRepairTarget: number;
  speedUpgradeWorkSpeedMultiplier: number;
  outputMultiplier: number;
};

/** Player-owned state for one constructed facility. */
export class Facility {
  private sizeHectares: number;
  private activeRecipeName: RecipeName | null = null;
  private productionCycle: RecipeName[] = [];
  private productionCycleIndex = 0;
  private active = false;
  private recipeProgress: Partial<Record<RecipeName, number>> = {};
  private recipeInputQ: number | null = null;
  private recipeInputSourceCost: number | null = null;
  private qualityUpgradeLevel = 1;
  private speedUpgradeLevel = 0;
  private outputUpgradeLevel = 0;
  private conditionDecayUpgradeLevel = 0;
  private assignedWorkers = 0;
  private staffQualityProgress = 0;
  private staffQualityTrend: 'rising' | 'falling' | 'steady' = 'steady';
  private staffQualityTrendScore = 0;
  private pendingStaffingChange: { targetWorkers: number; initialWorkers: number; startedAtGameTimeMs: number; completesAtGameTimeMs: number } | null = null;
  private staffTraining: { workers: number; startedAtGameTimeMs: number; completesAtGameTimeMs: number } | null = null;
  private pendingRepair: { targetCondition: number; startedAtGameTimeMs: number; completesAtGameTimeMs: number } | null = null;
  private staffWagePerWorkerPerMinute = FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE;
  private staffWageBaseMultiplier = 1;
  private facilityCondition = 1;
  private autoRepairEnabled = false;
  private autoRepairThreshold = 0.7;
  private autoRepairTarget = 1;

  constructor(
    public readonly id: string,
    public readonly facilityType: FacilityType,
    sizeHectaresOrSnapshot: number | FacilitySnapshot = facilityType === FacilityType.Farm ? FARM_DEFAULT_SIZE_HECTARES : 1,
    snapshot?: FacilitySnapshot,
  ) {
    const suppliedSnapshot = typeof sizeHectaresOrSnapshot === 'object' ? sizeHectaresOrSnapshot : snapshot;
    const suppliedSize = typeof sizeHectaresOrSnapshot === 'number' ? sizeHectaresOrSnapshot : suppliedSnapshot?.sizeHectares;
    this.sizeHectares = isValidFacilitySize(facilityType, suppliedSize)
      ? suppliedSize
      : (facilityType === FacilityType.Farm ? FARM_DEFAULT_SIZE_HECTARES : 1);
    if (suppliedSnapshot) {
      this.restore(suppliedSnapshot);
    } else {
      this.assignedWorkers = this.calculateRequiredWorkers();
      this.staffQualityProgress = calculateProgressFromQuality(FACILITY_INITIAL_STAFF_QUALITY);
    }
  }

  getView(): FacilityView {
    const requiredWorkers = this.calculateRequiredWorkers();
    const staffQuality = getStaffQualityFromProgress(this.staffQualityProgress);
    const targetWage = getFacilityStaffTargetWage(staffQuality, this.staffWageBaseMultiplier);
    const staffQualityWageTrend = this.assignedWorkers <= 0
      ? 'steady'
      : this.staffWagePerWorkerPerMinute > targetWage
      ? 'rising'
      : this.staffWagePerWorkerPerMinute < targetWage ? 'falling' : 'steady';
    const staffQualityWagePressurePerMinute = this.assignedWorkers <= 0
      ? 0
      : getStaffQualityWagePressurePerMinute(this.staffQualityProgress, this.staffWagePerWorkerPerMinute, targetWage);
    const availableWorkers = Math.max(0, this.assignedWorkers - (this.staffTraining?.workers ?? 0));
    const staffingEfficiency = getStaffingEfficiency(availableWorkers, requiredWorkers, this.staffWagePerWorkerPerMinute, staffQuality, targetWage);
    const facilityEfficiency = getFacilityEfficiency(staffingEfficiency, this.facilityCondition) * (this.pendingRepair ? FACILITY_REPAIR_EFFICIENCY_MULTIPLIER : 1);
    return {
      id: this.id,
      facilityType: this.facilityType,
      sizeHectares: this.sizeHectares,
      sizeMultiplier: getFacilitySizeMultiplier(this.facilityType, this.sizeHectares),
      displayName: `${getFacilityDefinition(this.facilityType).name} #${this.id.split('-').at(-1)}`,
      activeRecipeName: this.activeRecipeName,
      productionCycle: [...this.productionCycle],
      productionCycleIndex: this.productionCycleIndex,
      isActive: this.active,
      recipeProgress: { ...this.recipeProgress },
      recipeInputQ: this.recipeInputQ,
      recipeInputSourceCost: this.recipeInputSourceCost,
      qualityUpgradeLevel: this.qualityUpgradeLevel,
      upgradeMaxQ: calculateUpgradeMaxQ(this.qualityUpgradeLevel),
      speedUpgradeLevel: this.speedUpgradeLevel,
      outputUpgradeLevel: this.outputUpgradeLevel,
      conditionDecayUpgradeLevel: this.conditionDecayUpgradeLevel,
      conditionDecayMultiplier: getConditionDecayMultiplier(this.conditionDecayUpgradeLevel),
      overstaffingConditionDecayMultiplier: getOverstaffingConditionDecayMultiplier(this.assignedWorkers, requiredWorkers),
      assignedWorkers: this.assignedWorkers,
      staffQuality,
      staffQualityProgress: this.staffQualityProgress,
      staffQualityTrend: this.staffQualityTrend,
      staffQualityWageTrend,
      staffQualityWagePressurePerMinute,
      staffWageTargetPerWorkerPerMinute: targetWage,
      pendingStaffingChange: this.pendingStaffingChange ? { ...this.pendingStaffingChange } : null,
      staffTraining: this.staffTraining ? { ...this.staffTraining } : null,
      pendingRepair: this.pendingRepair ? { ...this.pendingRepair } : null,
      staffWagePerWorkerPerMinute: this.staffWagePerWorkerPerMinute,
      requiredWorkers,
      staffingEfficiency,
      facilityCondition: this.facilityCondition,
      conditionEfficiency: getFacilityConditionEfficiency(this.facilityCondition) * (this.pendingRepair ? FACILITY_REPAIR_EFFICIENCY_MULTIPLIER : 1),
      facilityEfficiency,
      autoRepairEnabled: this.autoRepairEnabled,
      autoRepairThreshold: this.autoRepairThreshold,
      autoRepairTarget: this.autoRepairTarget,
      speedUpgradeWorkSpeedMultiplier: getSpeedUpgradeWorkSpeedMultiplier(this.speedUpgradeLevel),
      outputMultiplier: getOutputUpgradeMultiplier(this.outputUpgradeLevel),
    };
  }

  private calculateRequiredWorkers(): number {
    return Math.ceil(getRequiredWorkers(
      getFacilityDefinition(this.facilityType).baseWorkers,
      this.speedUpgradeLevel,
      this.outputUpgradeLevel,
    ) * getFacilitySizeMultiplier(this.facilityType, this.sizeHectares));
  }

  setAssignedWorkers(workerCount: number): boolean {
    if (!Number.isInteger(workerCount) || workerCount < 0) {
      return false;
    }

    this.assignedWorkers = workerCount;
    return true;
  }

  upgradeSpeed(): void {
    this.speedUpgradeLevel += 1;
  }

  upgradeOutput(): void {
    this.outputUpgradeLevel += 1;
  }

  upgradeConditionDecay(): void {
    this.conditionDecayUpgradeLevel += 1;
  }

  setActiveRecipe(recipeName: RecipeName | null): boolean {
    if (recipeName === null) {
      this.activeRecipeName = null;
      this.productionCycle = [];
      this.productionCycleIndex = 0;
      this.active = false;
      this.recipeInputQ = null;
      this.recipeInputSourceCost = null;
      return true;
    }

    return this.setProductionCycle([recipeName]);
  }

  scheduleStaffingChange(targetWorkers: number, startedAtGameTimeMs: number, completesAtGameTimeMs: number): boolean {
    if (!Number.isInteger(targetWorkers) || targetWorkers < 0 || !Number.isFinite(startedAtGameTimeMs) || startedAtGameTimeMs < 0 || !Number.isFinite(completesAtGameTimeMs) || completesAtGameTimeMs <= startedAtGameTimeMs || this.pendingStaffingChange || this.staffTraining) return false;
    this.pendingStaffingChange = { targetWorkers, initialWorkers: this.assignedWorkers, startedAtGameTimeMs, completesAtGameTimeMs };
    return true;
  }

  setStaffWageBaseMultiplier(multiplier: number): void {
    this.staffWageBaseMultiplier = Number.isFinite(multiplier) ? Math.max(0.1, multiplier) : 1;
  }

  getStaffWageBaseMultiplier(): number {
    return this.staffWageBaseMultiplier;
  }

  processStaffingChange(currentGameTimeMs: number): boolean {
    if (!this.pendingStaffingChange || currentGameTimeMs < this.pendingStaffingChange.startedAtGameTimeMs) return false;
    const change = this.pendingStaffingChange;
    const progress = Math.min(1, Math.max(0, (currentGameTimeMs - change.startedAtGameTimeMs) / (change.completesAtGameTimeMs - change.startedAtGameTimeMs)));
    const targetWorkers = Math.round(change.initialWorkers + (change.targetWorkers - change.initialWorkers) * progress);
    const previousQuality = getStaffQualityFromProgress(this.staffQualityProgress);
    if (targetWorkers > this.assignedWorkers) {
      const hiredWorkers = targetWorkers - this.assignedWorkers;
      const currentQuality = getStaffQualityFromProgress(this.staffQualityProgress);
      const hireQuality = Math.max(1, Math.min(FACILITY_INITIAL_STAFF_QUALITY, getWageEfficiency(this.staffWagePerWorkerPerMinute, getFacilityStaffTargetWage(currentQuality, this.staffWageBaseMultiplier)) * FACILITY_INITIAL_STAFF_QUALITY));
      const mixedQuality = (this.assignedWorkers * currentQuality + hiredWorkers * hireQuality) / targetWorkers;
      this.staffQualityProgress = calculateProgressFromQuality(mixedQuality);
    } else if (targetWorkers < this.assignedWorkers && this.assignedWorkers > 0) {
      // Staff Quality represents pooled facility knowledge. Firing removes the
      // fired workers' proportional share of that knowledge from the group.
      const currentQuality = getStaffQualityFromProgress(this.staffQualityProgress);
      const remainingQuality = currentQuality * (targetWorkers / this.assignedWorkers);
      this.staffQualityProgress = calculateProgressFromQuality(remainingQuality);
    }
    this.recordStaffQualityChange(previousQuality);
    const changed = this.assignedWorkers !== targetWorkers;
    this.assignedWorkers = targetWorkers;
    if (progress >= 1) this.pendingStaffingChange = null;
    return changed;
  }

  scheduleStaffTraining(workers: number, startedAtGameTimeMs: number, completesAtGameTimeMs: number): boolean {
    if (!Number.isInteger(workers) || workers <= 0 || this.pendingStaffingChange || !Number.isFinite(startedAtGameTimeMs) || !Number.isFinite(completesAtGameTimeMs) || completesAtGameTimeMs <= startedAtGameTimeMs) return false;
    const durationMs = completesAtGameTimeMs - startedAtGameTimeMs;
    if (this.staffTraining) {
      if (this.staffTraining.workers + workers > this.assignedWorkers) return false;
      this.staffTraining = { ...this.staffTraining, workers: this.staffTraining.workers + workers };
      return true;
    }
    if (workers > this.assignedWorkers) return false;
    this.staffTraining = { workers, startedAtGameTimeMs, completesAtGameTimeMs };
    return true;
  }

  scheduleRepair(targetCondition: number, startedAtGameTimeMs: number, completesAtGameTimeMs: number): boolean {
    if (this.pendingRepair || !Number.isFinite(targetCondition) || targetCondition <= this.facilityCondition || targetCondition > 1 || !Number.isFinite(startedAtGameTimeMs) || !Number.isFinite(completesAtGameTimeMs) || completesAtGameTimeMs <= startedAtGameTimeMs) return false;
    this.pendingRepair = { targetCondition, startedAtGameTimeMs, completesAtGameTimeMs };
    return true;
  }

  processRepair(currentGameTimeMs: number): boolean {
    if (!this.pendingRepair || currentGameTimeMs < this.pendingRepair.completesAtGameTimeMs) return false;
    this.facilityCondition = Math.max(this.facilityCondition, this.pendingRepair.targetCondition);
    this.pendingRepair = null;
    return true;
  }

  processStaffTraining(currentGameTimeMs: number): boolean {
    if (!this.staffTraining || currentGameTimeMs < this.staffTraining.completesAtGameTimeMs) return false;
    const workers = this.staffTraining.workers;
    const previousQuality = getStaffQualityFromProgress(this.staffQualityProgress);
    this.staffQualityProgress += workers * FACILITY_STAFF_TRAINING_QUALITY_PROGRESS_PER_WORKER;
    this.recordStaffQualityChange(previousQuality);
    this.staffTraining = null;
    return true;
  }

  pauseStaffTraining(elapsedMilliseconds: number): boolean {
    if (!this.staffTraining || !Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds <= 0) return false;
    this.staffTraining.completesAtGameTimeMs += elapsedMilliseconds;
    return true;
  }

  advanceStaffQuality(elapsedMinutes: number): boolean {
    if (!Number.isFinite(elapsedMinutes) || elapsedMinutes <= 0) {
      return false;
    }
    this.staffQualityTrendScore *= Math.exp(-FACILITY_STAFF_QUALITY_TREND_DECAY_RATE * elapsedMinutes / FACILITY_STAFF_QUALITY_TREND_MEMORY_MINUTES);
    if (this.assignedWorkers <= 0) {
      this.updateStaffQualityTrend();
      return false;
    }
    const previousQuality = getStaffQualityFromProgress(this.staffQualityProgress);
    const currentQuality = previousQuality;
    const change = getStaffQualityWageProgressChangePerMinute(this.staffWagePerWorkerPerMinute, getFacilityStaffTargetWage(currentQuality, this.staffWageBaseMultiplier)) * elapsedMinutes;
    const next = Math.max(0, this.staffQualityProgress + change);
    if (next === this.staffQualityProgress) {
      this.updateStaffQualityTrend();
      return false;
    }
    this.staffQualityProgress = next;
    this.recordStaffQualityChange(previousQuality);
    return true;
  }

  gainStaffExperience(recipeRequiredWork: number): void {
    const availableWorkers = Math.max(0, this.assignedWorkers - (this.staffTraining?.workers ?? 0));
    if (!Number.isFinite(recipeRequiredWork) || recipeRequiredWork <= 0 || availableWorkers <= 0) return;
    const previousQuality = getStaffQualityFromProgress(this.staffQualityProgress);
    this.staffQualityProgress += Math.sqrt(recipeRequiredWork) * FACILITY_STAFF_QUALITY_EXPERIENCE_PROGRESS_PER_WORK;
    this.recordStaffQualityChange(previousQuality);
  }

  private updateStaffQualityTrend(): void {
    this.staffQualityTrend = this.staffQualityTrendScore > 0.0001
      ? 'rising'
      : this.staffQualityTrendScore < -0.0001 ? 'falling' : 'steady';
  }

  private recordStaffQualityChange(previousQuality: number): void {
    const nextQuality = getStaffQualityFromProgress(this.staffQualityProgress);
    this.staffQualityTrendScore += nextQuality - previousQuality;
    this.updateStaffQualityTrend();
  }

  setStaffWagePerWorkerPerMinute(wage: number): boolean {
    const targetWage = getFacilityStaffTargetWage(getStaffQualityFromProgress(this.staffQualityProgress), this.staffWageBaseMultiplier);
    if (!Number.isFinite(wage) || wage < 0 || wage > getFacilityMaxStaffWage(targetWage)) return false;
    this.staffWagePerWorkerPerMinute = wage;
    return true;
  }

  setAutoRepair(enabled: boolean, threshold: number, target: number): boolean {
    if (typeof enabled !== 'boolean' || !Number.isFinite(threshold) || !Number.isFinite(target)) return false;
    const normalizedThreshold = Math.min(1, Math.max(0, threshold));
    const normalizedTarget = Math.min(1, Math.max(0, target));
    if (normalizedTarget <= normalizedThreshold) return false;
    this.autoRepairEnabled = enabled;
    this.autoRepairThreshold = normalizedThreshold;
    this.autoRepairTarget = normalizedTarget;
    return true;
  }

  upgradeQuality(): void {
    this.qualityUpgradeLevel += 1;
  }

  setProductionCycle(recipeNames: readonly RecipeName[]): boolean {
    if (recipeNames.length === 0) return this.setActiveRecipe(null);
    if (!recipeNames.every((recipeName) => getFacilityDefinition(this.facilityType).recipes.some((recipe) => recipe.name === recipeName))) return false;

    this.productionCycle = [...recipeNames];
    this.productionCycleIndex = 0;
    this.activeRecipeName = this.productionCycle[0] ?? null;
    this.active = this.activeRecipeName !== null;
    this.recipeInputQ = null;
    this.recipeInputSourceCost = null;
    return true;
  }

  /** Internal production-state command that selects the next recipe in the configured cycle. */
  advanceProductionCycle(): boolean {
    if (!this.activeRecipeName || this.productionCycle.length === 0) return false;
    this.productionCycleIndex = (this.productionCycleIndex + 1) % this.productionCycle.length;
    this.activeRecipeName = this.productionCycle[this.productionCycleIndex] ?? null;
    return this.activeRecipeName !== null;
  }

  setProductionActive(active: boolean): boolean {
    if (!this.activeRecipeName) return false;
    this.active = active;
    return true;
  }

  /** Applies condition-scaled wear while keeping the player-owned value in its 0–1 range. */
  applyConditionLoss(loss: number): boolean {
    if (!Number.isFinite(loss) || loss <= 0 || this.facilityCondition === 0) {
      return false;
    }

    const scaledLoss = loss
      * calculateAsymmetricalScaler01(this.facilityCondition)
      * getConditionDecayMultiplier(this.conditionDecayUpgradeLevel)
      * getOverstaffingConditionDecayMultiplier(this.assignedWorkers, this.calculateRequiredWorkers());
    this.facilityCondition = Math.max(0, this.facilityCondition - scaledLoss);
    return true;
  }

  repairCondition(targetCondition = 1): boolean {
    const target = Number.isFinite(targetCondition) ? Math.min(1, Math.max(0, targetCondition)) : 1;
    if (target <= this.facilityCondition) return false;
    this.facilityCondition = target;
    return true;
  }

  /** Internal production-state command used by the facility production engine. */
  setRecipeProgress(recipeName: RecipeName, progress: number): boolean {
    const recipe = getFacilityDefinition(this.facilityType).recipes.find((candidate) => candidate.name === recipeName);
    if (!recipe || !Number.isFinite(progress) || progress < 0 || progress >= recipe.requiredWork * getFacilitySizeMultiplier(this.facilityType, this.sizeHectares)) {
      return false;
    }

    this.recipeProgress[recipeName] = progress;
    return true;
  }

  /** Records the weighted quality of inputs consumed for the in-progress cycle. */
  setRecipeInputQ(inputQ: number | null): void {
    this.recipeInputQ = inputQ !== null && Number.isFinite(inputQ) && inputQ > 0 ? inputQ : null;
  }

  /** Records direct-material source cost paid for the in-progress cycle. */
  setRecipeInputSourceCost(sourceCost: number | null): void {
    this.recipeInputSourceCost = sourceCost !== null && Number.isFinite(sourceCost) && sourceCost >= 0
      ? sourceCost
      : null;
  }

  toSnapshot(): FacilitySnapshot {
    return {
      id: this.id,
      facilityType: this.facilityType,
      sizeHectares: this.sizeHectares,
      activeRecipeName: this.activeRecipeName,
      productionCycle: [...this.productionCycle],
      productionCycleIndex: this.productionCycleIndex,
      isActive: this.active,
      recipeProgress: { ...this.recipeProgress },
      recipeInputQ: this.recipeInputQ,
      recipeInputSourceCost: this.recipeInputSourceCost,
      qualityUpgradeLevel: this.qualityUpgradeLevel,
      speedUpgradeLevel: this.speedUpgradeLevel,
      outputUpgradeLevel: this.outputUpgradeLevel,
      conditionDecayUpgradeLevel: this.conditionDecayUpgradeLevel,
      assignedWorkers: this.assignedWorkers,
      staffQualityProgress: this.staffQualityProgress,
      staffQualityTrend: this.staffQualityTrend,
      pendingStaffingChange: this.pendingStaffingChange ? { ...this.pendingStaffingChange } : null,
      staffTraining: this.staffTraining ? { ...this.staffTraining } : null,
      pendingRepair: this.pendingRepair ? { ...this.pendingRepair } : null,
      staffWagePerWorkerPerMinute: this.staffWagePerWorkerPerMinute,
      facilityCondition: this.facilityCondition,
      autoRepairEnabled: this.autoRepairEnabled,
      autoRepairThreshold: this.autoRepairThreshold,
      autoRepairTarget: this.autoRepairTarget,
    };
  }

  static fromSnapshot(snapshot: FacilitySnapshot): Facility {
    return new Facility(snapshot.id, snapshot.facilityType, snapshot.sizeHectares, snapshot);
  }

  private restore(snapshot: FacilitySnapshot): void {
    if (snapshot.facilityType !== this.facilityType) {
      return;
    }

    this.setProductionCycle(snapshot.productionCycle);
    this.productionCycleIndex = snapshot.productionCycleIndex;
    this.activeRecipeName = this.productionCycle[this.productionCycleIndex] ?? null;
    this.active = snapshot.isActive;

    this.recipeProgress = {};
    const recipeInputQ = snapshot.recipeInputQ;
    this.recipeInputQ = typeof recipeInputQ === 'number' && Number.isFinite(recipeInputQ) && recipeInputQ > 0
      ? recipeInputQ
      : null;
    const recipeInputSourceCost = snapshot.recipeInputSourceCost;
    this.recipeInputSourceCost = typeof recipeInputSourceCost === 'number' && Number.isFinite(recipeInputSourceCost) && recipeInputSourceCost >= 0
      ? recipeInputSourceCost
      : null;
    this.qualityUpgradeLevel = isValidUpgradeLevel(snapshot.qualityUpgradeLevel) ? Math.max(1, snapshot.qualityUpgradeLevel) : 1;
    this.speedUpgradeLevel = isValidUpgradeLevel(snapshot.speedUpgradeLevel) ? snapshot.speedUpgradeLevel : 0;
    this.outputUpgradeLevel = isValidUpgradeLevel(snapshot.outputUpgradeLevel) ? snapshot.outputUpgradeLevel : 0;
    this.conditionDecayUpgradeLevel = isValidUpgradeLevel(snapshot.conditionDecayUpgradeLevel) ? snapshot.conditionDecayUpgradeLevel : 0;
    this.assignedWorkers = isValidWorkerCount(snapshot.assignedWorkers)
      ? snapshot.assignedWorkers
      : this.calculateRequiredWorkers();
    this.staffQualityProgress = isValidQualityProgress(snapshot.staffQualityProgress)
      ? snapshot.staffQualityProgress
      : calculateProgressFromQuality(FACILITY_INITIAL_STAFF_QUALITY);
    this.staffQualityTrendScore = snapshot.staffQualityTrend === 'rising' ? 1 : snapshot.staffQualityTrend === 'falling' ? -1 : 0;
    this.updateStaffQualityTrend();
    this.pendingStaffingChange = isValidPendingStaffingChange(snapshot.pendingStaffingChange) ? { ...snapshot.pendingStaffingChange } : null;
    this.staffTraining = snapshot.staffTraining && Number.isInteger(snapshot.staffTraining.workers) && snapshot.staffTraining.workers > 0 && Number.isFinite(snapshot.staffTraining.startedAtGameTimeMs) && Number.isFinite(snapshot.staffTraining.completesAtGameTimeMs) && snapshot.staffTraining.completesAtGameTimeMs > snapshot.staffTraining.startedAtGameTimeMs ? { ...snapshot.staffTraining } : null;
    this.staffWagePerWorkerPerMinute = isValidStaffWage(snapshot.staffWagePerWorkerPerMinute)
      ? snapshot.staffWagePerWorkerPerMinute
      : FACILITY_BASE_STAFF_WAGE_PER_WORKER_PER_MINUTE;
    this.facilityCondition = isValidFacilityCondition(snapshot.facilityCondition)
      ? snapshot.facilityCondition
      : 1;
    this.pendingRepair = snapshot.pendingRepair && Number.isFinite(snapshot.pendingRepair.targetCondition) && snapshot.pendingRepair.targetCondition > this.facilityCondition && snapshot.pendingRepair.targetCondition <= 1 && Number.isFinite(snapshot.pendingRepair.startedAtGameTimeMs) && Number.isFinite(snapshot.pendingRepair.completesAtGameTimeMs) && snapshot.pendingRepair.completesAtGameTimeMs > snapshot.pendingRepair.startedAtGameTimeMs ? { ...snapshot.pendingRepair } : null;
    this.autoRepairEnabled = snapshot.autoRepairEnabled;
    this.autoRepairThreshold = snapshot.autoRepairThreshold;
    this.autoRepairTarget = snapshot.autoRepairTarget;

    for (const recipe of getFacilityDefinition(this.facilityType).recipes) {
      const progress = snapshot.recipeProgress[recipe.name];

      if (Number.isFinite(progress) && progress !== undefined && progress >= 0 && progress < recipe.requiredWork * getFacilitySizeMultiplier(this.facilityType, this.sizeHectares)) {
        this.recipeProgress[recipe.name] = progress;
      }
    }
  }
}

function isValidUpgradeLevel(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isValidWorkerCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isValidFacilityCondition(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isValidStaffWage(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= getFacilityMaxStaffWage();
}

function isValidQualityProgress(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isValidPendingStaffingChange(value: unknown): value is { targetWorkers: number; initialWorkers: number; startedAtGameTimeMs: number; completesAtGameTimeMs: number } {
  return typeof value === 'object' && value !== null
    && isValidWorkerCount((value as { targetWorkers?: unknown }).targetWorkers)
    && isValidWorkerCount((value as { initialWorkers?: unknown }).initialWorkers)
    && typeof (value as { startedAtGameTimeMs?: unknown }).startedAtGameTimeMs === 'number'
    && Number.isFinite((value as { startedAtGameTimeMs: number }).startedAtGameTimeMs)
    && (value as { startedAtGameTimeMs: number }).startedAtGameTimeMs >= 0
    && typeof (value as { completesAtGameTimeMs?: unknown }).completesAtGameTimeMs === 'number'
    && Number.isFinite((value as { completesAtGameTimeMs: number }).completesAtGameTimeMs)
    && (value as { completesAtGameTimeMs: number }).completesAtGameTimeMs > (value as { startedAtGameTimeMs: number }).startedAtGameTimeMs;
}
