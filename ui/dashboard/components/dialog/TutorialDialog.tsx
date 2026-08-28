import { Image, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import type { ReactNode } from "react";
import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Dialog, IconButton, Menu, Portal, Text } from "react-native-paper";
import { colors } from "@/theme";
import { getFacilityDefinition, getFacilitySizeOptions, type FacilityType } from "@/game/facilities";
import type { Recipe } from "@/game/recipes";
import {
  getRecipeResearchProjectId,
  type ResearchLedger,
} from "@/game/research";
import { getResource, ResourceType } from "@/game/resources";
import { styles } from "@/ui/dashboard/helpers/dashboard.styles";
import { formatRecipeName } from "@/ui/dashboard/helpers/recipeFormatters";
import { APP_ICONS, RECIPE_ICONS } from "@/icons";
import {
  TooltipMaterialIcon,
  TooltipResourceIcon,
  TooltipTextIcon,
} from "@/ui/dashboard/components/IconTooltip";
import { formatNumber } from "@/utils";
import { isDevAdminSurfaceAvailable } from "@/ui/dashboard/helpers/devAdminGate";

const SIMULUCIUS_IMAGES = {
  balance: require("../../../../assets/simulucius/withlaptop.png"),
  welcome: require("../../../../assets/simulucius/frontremovebg.png"),
} as const;

type HighlightLayout = { height: number; width: number; x: number; y: number };
type NavigationProps = {
  onBack: () => void;
  onExit: () => void;
  onNext: () => void;
  onJumpToTutorial?: (tutorial: TutorialJumpTarget) => void;
};
type TutorialJumpTarget = "company" | "facility" | "inventory";

function TutorialJumpActions({ onJumpToTutorial }: { onJumpToTutorial?: (tutorial: TutorialJumpTarget) => void }) {
  const [menuVisible, setMenuVisible] = useState(false);
  if (!onJumpToTutorial || !isDevAdminSurfaceAvailable()) return null;
  const jumpTo = (tutorial: TutorialJumpTarget) => {
    setMenuVisible(false);
    onJumpToTutorial(tutorial);
  };
  return <View style={styles.tutorialJumpMenu}><Menu anchor={<Button compact icon="tools" onPress={() => setMenuVisible(true)}>Dev jumps</Button>} onDismiss={() => setMenuVisible(false)} visible={menuVisible}><Menu.Item onPress={() => jumpTo("company")} title="Company step 1" /><Menu.Item onPress={() => jumpTo("facility")} title="Facility step 1" /><Menu.Item onPress={() => jumpTo("inventory")} title="Inventory step 1" /></Menu></View>;
}

function TutorialGuideCharacter({
  useBalanceImage = false,
}: {
  useBalanceImage?: boolean;
}) {
  return (
    <Image
      accessibilityLabel="Simulucius, your tutorial guide"
      resizeMode="contain"
      source={
        useBalanceImage ? SIMULUCIUS_IMAGES.balance : SIMULUCIUS_IMAGES.welcome
      }
      style={styles.tutorialGuideCharacterBehind}
    />
  );
}

function TutorialCollapseControl({
  collapsed,
  onPress,
}: {
  collapsed: boolean;
  onPress: () => void;
}) {
  return (
    <IconButton
      accessibilityLabel={collapsed ? "Expand tutorial" : "Collapse tutorial"}
      icon={collapsed ? "chevron-down" : "chevron-up"}
      onPress={onPress}
      size={20}
      style={styles.tutorialCollapseControl}
    />
  );
}

function TutorialActions({ nextLabel = "Next", onBack, onExit, onJumpToTutorial, onNext }: NavigationProps & { nextLabel?: string }) {
  return (
    <>
      <TutorialJumpActions onJumpToTutorial={onJumpToTutorial} />
      <View style={styles.tutorialActions}>
        <Button onPress={onBack}>Back</Button>
        <Button onPress={onExit}>Exit tutorial</Button>
        <Button mode="contained" onPress={onNext}>{nextLabel}</Button>
      </View>
    </>
  );
}

function ChoiceActions({ onBack, onExit, onJumpToTutorial, onNext }: NavigationProps) {
  return (
    <>
      <TutorialJumpActions onJumpToTutorial={onJumpToTutorial} />
      <View style={[styles.tutorialActions, styles.tutorialFacilityChoiceActions]}>
        <Button onPress={onBack}>Back</Button>
        <Button onPress={onExit}>Exit tutorial</Button>
        <Button mode="contained" onPress={onNext}>Next</Button>
      </View>
    </>
  );
}

function SpotlightDimmer({
  onDismiss,
  style,
}: {
  onDismiss?: () => void;
  style: object;
}) {
  if (!onDismiss) {
    return <View pointerEvents="none" style={style} />;
  }

  return <Pressable onPress={onDismiss} style={style} />;
}

function HighlightDimmers({
  layout,
  onDismiss,
}: {
  layout: HighlightLayout;
  onDismiss?: () => void;
}) {
  const dimmer = styles.tutorialBuildFacilityDimmer;
  return (
    <>
      <SpotlightDimmer
        onDismiss={onDismiss}
        style={[dimmer, { bottom: undefined, height: layout.y, top: 0 }]}
      />
      <SpotlightDimmer
        onDismiss={onDismiss}
        style={[dimmer, { bottom: 0, top: layout.y + layout.height }]}
      />
      <SpotlightDimmer
        onDismiss={onDismiss}
        style={[
          dimmer,
          {
            bottom: undefined,
            height: layout.height,
            top: layout.y,
            width: layout.x,
          },
        ]}
      />
      <SpotlightDimmer
        onDismiss={onDismiss}
        style={[
          dimmer,
          {
            bottom: undefined,
            height: layout.height,
            left: layout.x + layout.width,
            right: 0,
            top: layout.y,
          },
        ]}
      />
    </>
  );
}

function FullScreenDimmer({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Pressable
      onPress={onDismiss}
      style={[styles.tutorialBuildFacilityDimmer, { bottom: 0, top: 0 }]}
    />
  );
}

export function TutorialGuideDialog({
  balance,
  companyOverviewLayout,
  elapsedTime,
  onBack,
  onDismiss,
  onExit,
  onJumpToTutorial,
  step,
  visible,
  onNext,
}: {
  balance: string;
  companyOverviewLayout: HighlightLayout | null;
  elapsedTime: string;
  onBack: () => void;
  onDismiss: () => void;
  onExit: () => void;
  step: 1 | 2 | 3 | 4 | 5;
  visible: boolean;
  onNext: () => void;
  onJumpToTutorial?: (tutorial: TutorialJumpTarget) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const isBalanceStep = step === 2;
  const isTimeStep = step === 3;
  const isCompanyStep = step === 4;
  const isProductionStep = step === 5;
  const title = isBalanceStep
    ? "Your company balance"
    : isTimeStep
      ? "Your company time"
      : isCompanyStep
        ? "Your company overview"
        : isProductionStep
          ? "Production"
          : "Welcome to Industri Clicker";
  const description = isProductionStep
    ? "Press the Production tab below. I will introduce that view in the next dialog."
    : isCompanyStep
      ? "This is your company overview. It will become your home base for understanding your company and its progress. I will show you more of this page later."
      : isTimeStep
        ? "The highlighted value shows your company time. It advances while you play, and helps you follow how long your company has been running and how much progress it has made."
        : isBalanceStep
          ? "The highlighted amount at the top is your company balance. You spend it on construction and upgrades, and earn more by selling resources. Later it will become part of your company's total assets and provide Prestige. I'll tell you more about that later."
          : "I'll help you get oriented. Start by checking your Company tab. The tutorial stays active while you work through the early game.";
  const guideContent = (
    <View>
      <TutorialGuideCharacter useBalanceImage={isBalanceStep} />
      <Text style={styles.tutorialDialogTitle}>{title}</Text>
      {!collapsed && (
        <View style={styles.tutorialDialogContent}>
          <Text style={styles.sectionEyebrow}>{`STEP ${step} OF 5`}</Text>
          <Text style={styles.dialogDescription}>{description}</Text>
        </View>
      )}
    </View>
  );
  const actions = (
    <View>
      <TutorialJumpActions onJumpToTutorial={onJumpToTutorial} />
      <View style={styles.tutorialActions}>
      <Button disabled={step === 1} onPress={onBack}>
        Back
      </Button>
      <Button onPress={onExit}>Exit tutorial</Button>
      <Button mode="contained" onPress={onNext}>Next</Button>
      </View>
    </View>
  );
  const collapseControl = (
    <TutorialCollapseControl
      collapsed={collapsed}
      onPress={() => setCollapsed((value) => !value)}
    />
  );
  const companySpotlight = companyOverviewLayout ? (
    <HighlightDimmers layout={companyOverviewLayout} onDismiss={onDismiss} />
  ) : (
    <FullScreenDimmer onDismiss={onDismiss} />
  );

  return (
    <Portal>
      {isCompanyStep ? (
        visible && (
          <View pointerEvents="box-none" style={styles.tutorialCompanyOverlay}>
            {companySpotlight}
            {companyOverviewLayout && (
              <View
                pointerEvents="none"
                style={[
                  styles.tutorialCompanyHighlight,
                  {
                    height: companyOverviewLayout.height,
                    left: companyOverviewLayout.x,
                    top: companyOverviewLayout.y,
                    width: companyOverviewLayout.width,
                  },
                ]}
              />
            )}
            <View pointerEvents="auto" style={styles.tutorialCompanyCard}>
              {guideContent}
              {collapseControl}
              {actions}
            </View>
          </View>
        )
      ) : isProductionStep ? (
        visible && (
          <View
            pointerEvents="box-none"
            style={styles.tutorialProductionOverlay}
          >
            <Pressable
              onPress={onDismiss}
              style={styles.tutorialProductionDimmerTop}
            />
            <Pressable
              onPress={onDismiss}
              style={styles.tutorialProductionDimmerNavigationTop}
            />
            <Pressable
              onPress={onDismiss}
              style={styles.tutorialProductionDimmerNavigationBottom}
            />
            <Pressable
              onPress={onDismiss}
              style={styles.tutorialProductionDimmerNavigationLeft}
            />
            <Pressable
              onPress={onDismiss}
              style={styles.tutorialProductionDimmerNavigationRight}
            />
            <View pointerEvents="auto" style={styles.tutorialProductionCard}>
              {guideContent}
              {collapseControl}
              {actions}
            </View>
          </View>
        )
      ) : (
        <Dialog
          dismissable
          onDismiss={onDismiss}
          style={styles.tutorialDialog}
          visible={visible}
        >
          {guideContent}
          {collapseControl}
          <Dialog.Actions>{actions}</Dialog.Actions>
        </Dialog>
      )}
      {isBalanceStep && visible && (
        <View
          accessibilityElementsHidden
          pointerEvents="none"
          style={styles.tutorialBalanceSpotlight}
        >
          <MaterialCommunityIcons color={colors.onDark} name="cash" size={21} />
          <Text style={styles.balanceInlineValue}>{balance}</Text>
        </View>
      )}
      {isTimeStep && visible && (
        <View
          accessibilityElementsHidden
          pointerEvents="none"
          style={styles.tutorialTimeSpotlight}
        >
          <MaterialCommunityIcons
            color={colors.onDark}
            name="timer-outline"
            size={17}
          />
          <Text style={styles.headerElapsedTimeValue}>{elapsedTime}</Text>
        </View>
      )}
    </Portal>
  );
}

export function ProductionTutorialDialog({
  visible,
  onBack,
  onClose,
  onDismiss,
  onExit,
  onJumpToTutorial,
}: {
  visible: boolean;
  onBack: () => void;
  onClose: () => void;
  onDismiss: () => void;
  onExit: () => void;
  onJumpToTutorial?: (tutorial: TutorialJumpTarget) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Portal>
      <Dialog
        dismissable
        onDismiss={onDismiss}
        style={[styles.tutorialDialog, styles.tutorialBottomDialog]}
        visible={visible}
      >
        <TutorialGuideCharacter />
        <Dialog.Title>Production</Dialog.Title>
        <TutorialCollapseControl
          collapsed={collapsed}
          onPress={() => setCollapsed((value) => !value)}
        />
        {!collapsed && (
          <Dialog.Content>
            <View style={styles.tutorialDialogContent}>
              <Text style={styles.sectionEyebrow}>STEP 1 OF 10</Text>
              <Text style={styles.dialogDescription}>
                This is the Production view. We will explore how your facilities
                run here next.
              </Text>
            </View>
          </Dialog.Content>
        )}
        <TutorialJumpActions onJumpToTutorial={onJumpToTutorial} />
        <Dialog.Actions>
          <Button onPress={onBack}>Back</Button>
          <Button onPress={onExit}>Exit tutorial</Button>
          <Button mode="contained" onPress={onClose}>
            Next
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

export function BuildFacilityTutorialDialog({
  highlightLayout,
  onBack,
  onDismiss,
  onExit,
  onJumpToTutorial,
  onNext,
  visible,
}: {
  highlightLayout: HighlightLayout | null;
  onBack: () => void;
  onDismiss: () => void;
  onExit: () => void;
  onNext: () => void;
  onJumpToTutorial?: (tutorial: TutorialJumpTarget) => void;
  visible: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Portal>
      {visible && (
        <View pointerEvents="box-none" style={styles.tutorialProductionOverlay}>
          {highlightLayout ? (
            <HighlightDimmers layout={highlightLayout} onDismiss={onDismiss} />
          ) : (
            <FullScreenDimmer onDismiss={onDismiss} />
          )}
          <View pointerEvents="auto" style={styles.tutorialBuildFacilityCard}>
            <TutorialGuideCharacter />
            <Text style={styles.tutorialDialogTitle}>Build a facility</Text>
            <TutorialCollapseControl
              collapsed={collapsed}
              onPress={() => setCollapsed((value) => !value)}
            />
            {!collapsed && (
              <View style={styles.tutorialDialogContent}>
                <Text style={styles.sectionEyebrow}>STEP 2 OF 10</Text>
                <Text style={styles.dialogDescription}>
                  Press “Build facility” to construct your first facility.
                </Text>
              </View>
            )}
            <TutorialActions onBack={onBack} onExit={onExit} onJumpToTutorial={onJumpToTutorial} onNext={onNext} />
          </View>
        </View>
      )}
    </Portal>
  );
}

function FacilityChoiceDialog({
  title,
  step,
  children,
  onBack,
  onExit,
  onJumpToTutorial,
  onNext,
  visible,
}: NavigationProps & {
  title: string;
  step: number;
  children: ReactNode;
  visible: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Portal>
      {visible && (
        <View pointerEvents="box-none" style={styles.tutorialProductionOverlay}>
          <View pointerEvents="auto" style={styles.tutorialFacilityChoiceCard}>
            <TutorialGuideCharacter />
            <Text style={styles.tutorialDialogTitle}>{title}</Text>
            <TutorialCollapseControl
              collapsed={collapsed}
              onPress={() => setCollapsed((value) => !value)}
            />
            {!collapsed && (
              <View style={styles.tutorialFacilityChoiceContent}>
                <Text
                  style={styles.sectionEyebrow}
                >{`STEP ${step} OF 10`}</Text>
                {children}
              </View>
            )}
            <ChoiceActions onBack={onBack} onExit={onExit} onJumpToTutorial={onJumpToTutorial} onNext={onNext} />
          </View>
        </View>
      )}
    </Portal>
  );
}

export function ConstructionTutorialDialog(
  props: NavigationProps & { visible: boolean },
) {
  return (
    <FacilityChoiceDialog
      {...props}
      step={3}
      title="Choose your first facility"
    >
      <Text style={styles.dialogDescription}>
        You can choose between three affordable starting facilities. Each choice
        opens a different production path.
      </Text>
      <Text style={styles.dialogDescription}>
        Use the filter to show all facilities, only those you can build now, or
        unavailable choices.
      </Text>
      <Text style={styles.dialogDescription}>
        Scroll through the list to see the facilities available to you. You can
        tap a facility now or continue to the comparison step.
      </Text>
    </FacilityChoiceDialog>
  );
}

export function FacilityChoiceTutorialDialog(
  props: NavigationProps & { visible: boolean },
) {
  return (
    <FacilityChoiceDialog {...props} step={4} title="Comparing facilities">
      <Text style={styles.dialogDescription}>
        Every facility has three costs:{" "}
        <TooltipMaterialIcon
          color={colors.primary}
          label="Land cost"
          name={APP_ICONS.coin}
          size={15}
        />{" "}
        Land,{" "}
        <TooltipResourceIcon
          resourceType={ResourceType.ConstructionMaterials}
        />{" "}
        Construction Materials, and{" "}
        <TooltipResourceIcon resourceType={ResourceType.IndustrialMachines} />{" "}
        Industrial Machines.
      </Text>
      <Text style={styles.dialogDescription}>
        Construction Materials and Industrial Machines prices are per unit.
        Market replacement cost is the combined current value of all three.
      </Text>
      <Text style={styles.dialogDescription}>
        Tap a facility to review its construction details, or press Next to
        continue without selecting one.
      </Text>
    </FacilityChoiceDialog>
  );
}

export function ConstructionConfirmationTutorialDialog(
  props: NavigationProps & { visible: boolean },
) {
  if (!props.visible) return null;

  return (
    <FacilityChoiceDialog {...props} step={5} title="Confirm construction">
      <Text style={styles.dialogDescription}>
        Review the land purchase and the Construction Materials and Industrial
        Machines taken from your inventory.
      </Text>
      <Text style={styles.dialogDescription}>
        If inputs are missing, Buy missing inputs can purchase them at current
        market prices.
      </Text>
      <Text style={styles.dialogDescription}>
        Recipes start collapsed to keep the dialog compact. Tap a recipe to see
        its inputs, outputs, and required work.
      </Text>
    </FacilityChoiceDialog>
  );
}

type FirstFacilityStep =
  | "overview"
  | "header"
  | "footprint"
  | "efficiency"
  | "staff-management"
  | "staff-training"
  | "repair"
  | "research"
  | "recipe-card"
  | "recipe-automation"
  | "recipe-optional-inputs"
  | "recipe-economics"
  | "upgrades"
  | "inventory-transition";

export function InventoryTutorialDialog({
  onBack,
  onDismiss,
  onExit,
  onJumpToTutorial,
  onNext,
  visible,
}: NavigationProps & { onDismiss: () => void; visible: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Portal>
      {visible && (
        <View pointerEvents="box-none" style={styles.tutorialFirstFacilityOverlay}>
          <FullScreenDimmer onDismiss={onDismiss} />
          <View pointerEvents="auto" style={styles.tutorialFirstFacilityOverlayCard}>
            <TutorialGuideCharacter />
            <Text style={styles.tutorialDialogTitle}>Inventory and markets</Text>
            <TutorialCollapseControl
              collapsed={collapsed}
              onPress={() => setCollapsed((value) => !value)}
            />
            {!collapsed && (
              <View style={styles.tutorialDialogContent}>
                <Text style={styles.sectionEyebrow}>STEP 1 OF 1</Text>
                <Text style={styles.dialogDescription}>
                  The resources your facilities produce can be seen in the
                  Inventory. This is also where you can see resource prices on
                  the different markets.
                </Text>
                <Text style={styles.dialogDescription}>
                  You can manually buy and sell resources here, and set up
                  automatic buying and selling orders.
                </Text>
              </View>
            )}
            <TutorialActions onBack={onBack} onExit={onExit} onJumpToTutorial={onJumpToTutorial} onNext={onNext} />
          </View>
        </View>
      )}
    </Portal>
  );
}

export function FirstFacilityTutorialDialog({
  facilityType,
  focus,
  focusLayout,
  onBack,
  onDismiss,
  onExit,
  onJumpToTutorial,
  onNext,
  nextLabel,
  recipeName,
  research,
  step,
  visible,
}: {
  facilityType: FacilityType | null;
  focus: "header" | "efficiency" | "recipe" | null;
  focusLayout: HighlightLayout | null;
  onBack: () => void;
  onDismiss: () => void;
  onExit: () => void;
  onNext: () => void;
  nextLabel?: string;
  recipeName: Recipe["name"] | null;
  research: ResearchLedger;
  step: FirstFacilityStep;
  visible: boolean;
  onJumpToTutorial?: (tutorial: TutorialJumpTarget) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { height } = useWindowDimensions();
  if (!facilityType) return null;
  const isStaffingStep = step === "staff-management" || step === "staff-training";
  const definition = getFacilityDefinition(facilityType);
  const selectedRecipe =
    (recipeName
      ? definition.recipes.find((recipe) => recipe.name === recipeName)
      : undefined) ??
    definition.recipes.find(
      (recipe) =>
        research.hasActive(getRecipeResearchProjectId(recipe.name)) ||
        research.hasCompleted(getRecipeResearchProjectId(recipe.name)),
    );
  const recipeChoices = definition.recipes.map((candidate) => (
    <Text key={candidate.name}>
      <TooltipTextIcon label={formatRecipeName(candidate)}>
        {RECIPE_ICONS[candidate.name]}
      </TooltipTextIcon>{" "}
      {formatRecipeName(candidate)}
    </Text>
  ));
  const grantResourceTypes = Array.from(
    new Set(
      definition.recipes.flatMap((candidate) =>
        candidate.inputs.map((input) => input.resourceType),
      ),
    ),
  );
  const resourceMessage = (
    <>
      <Text style={styles.dialogDescription}>
        Your first recipe research is free and completes quickly. Choose any
        recipe you want to research from this facility:
      </Text>
      <Text style={styles.dialogDescription}>{recipeChoices}</Text>
      <Text style={styles.dialogDescription}>
        When the chosen recipe research completes, the first-facility grant
        provides 10 production cycles of its inputs:{" "}
        {grantResourceTypes.length === 0
          ? "none"
          : grantResourceTypes.map((resourceType, index) => (
              <Text key={resourceType}>
                {index > 0 ? ", " : ""}
                <TooltipResourceIcon resourceType={resourceType} />{" "}
                {getResource(resourceType).name}
              </Text>
            ))}
        .
      </Text>
    </>
  );
  const stepNumber =
    step === "overview"
      ? 6
      : step === "header"
        ? 7
      : step === "efficiency"
        ? 8
        : step === "staff-management"
          ? 9
          : step === "staff-training"
            ? 10
        : step === "repair"
          ? 11
            : step === "footprint"
              ? 12
              : step === "research"
                ? 13
                : step === "recipe-card"
                  ? 14
                : step === "recipe-automation"
                  ? 15
                : step === "recipe-optional-inputs"
                  ? 16
                : step === "recipe-economics"
                  ? 17
                  : step === "upgrades"
                    ? 18
                    : 19;
  const title =
    step === "overview"
      ? "Your first facility"
      : step === "header"
        ? "Your facility header"
        : step === "footprint"
          ? "Industrial Footprint"
            : step === "efficiency"
              ? "Facility efficiency"
              : step === "staff-management"
                ? "Staff management"
                : step === "staff-training"
                  ? "Staff Quality and wages"
            : step === "repair"
              ? "Repair and condition"
              : step === "research"
                ? "First Recipe"
                : step === "recipe-card"
                  ? "Recipe and production cycle"
                  : step === "recipe-automation"
                    ? "Automatic production"
                  : step === "recipe-optional-inputs"
                    ? "Optional inputs"
                  : step === "recipe-economics"
                    ? "Recipe economics"
                    : step === "upgrades"
                      ? "Facility upgrades"
                      : "Your facility is ready";
  const spotlight =
    step === "research" && focus && focusLayout ? (
      <View
        pointerEvents="none"
        style={[
          styles.tutorialFirstFacilityHighlight,
          {
            height: focusLayout.height,
            left: focusLayout.x,
            top: focusLayout.y,
            width: focusLayout.width,
          },
        ]}
      />
    ) : focus && focusLayout ? (
      <>
        <HighlightDimmers layout={focusLayout} />
        <View
          pointerEvents="none"
          style={[
            styles.tutorialFirstFacilityHighlight,
            {
              height: focusLayout.height,
              left: focusLayout.x,
              top: focusLayout.y,
              width: focusLayout.width,
            },
          ]}
        />
      </>
    ) : step === "header" ||
      step === "efficiency" ||
      step === "staff-management" ||
      step === "staff-training" ||
      step === "repair" ||
      step === "footprint" ||
      step === "recipe-card" ||
      step === "recipe-automation" ||
      step === "recipe-optional-inputs" ||
      step === "recipe-economics" ||
      step === "upgrades" ||
      step === "inventory-transition" ? null : (
      <FullScreenDimmer onDismiss={onDismiss} />
    );
  const researchContent = (
    <>
      <Text style={styles.dialogDescription}>
        Your selected recipe research is now running. Open the{" "}
        <TooltipMaterialIcon
          color={colors.primary}
          label="Active processes"
          name={APP_ICONS.work}
          size={15}
        />{" "}
        Active Processes panel to see its progress and remaining time.
      </Text>
      <Text style={styles.dialogDescription}>
        When research completes, the recipe becomes available in this facility
        and the grant provides the resources needed for its inputs.
      </Text>
      <Text style={styles.dialogDescription}>
        Once the recipe research is finished, the recipe will become available
        in your Facility View.
      </Text>
    </>
  );
  const recipeCardContent = (
    <>
      <Text style={styles.dialogDescription}>
        Each recipe card describes what this recipe produces and what it costs
        to run.
      </Text>
      <Text style={styles.dialogDescription}>
        <TooltipTextIcon
          label={selectedRecipe ? formatRecipeName(selectedRecipe) : "Recipe"}
        >
          {selectedRecipe ? RECIPE_ICONS[selectedRecipe.name] : "🧪"}
        </TooltipTextIcon>{" "}
        The recipe icon and name identify the product. Inputs per production
        cycle:{" "}
        {selectedRecipe?.inputs.length
          ? selectedRecipe.inputs.map((input, index) => (
              <Text key={input.resourceType}>
                {index > 0 ? "  " : ""}
                <TooltipResourceIcon resourceType={input.resourceType} />{" "}
                {formatNumber(input.amount, { smartDecimals: true })}
              </Text>
            ))
          : "none"}
        .
      </Text>
      <Text style={styles.dialogDescription}>
        <TooltipMaterialIcon
          color={colors.primary}
          label="Required work"
          name={APP_ICONS.elapsedTime}
          size={15}
        />{" "}
        Required work is the amount of facility work needed; it is not a fixed
        clock time because facility efficiency changes how quickly work is
        completed.
      </Text>
    </>
  );
  const recipeAutomationContent = (
    <>
      <Text style={styles.dialogDescription}>
        The facility will automatically run its production whenever the required
        input resources are available, unless you pause it. You can add more
        recipes to the production cycle, and the facility will run them in order,
        repeating the cycle continuously. You can try that now, but since you
        currently have only one recipe available, it will repeat that recipe.
      </Text>
      <Text style={styles.dialogDescription}>
        In the input/output card, the{" "}
        <TooltipMaterialIcon color={colors.primary} label="Buy resources" name={APP_ICONS.marketBuy} size={15} />{" "}
        button buys missing input resources for one production round. The{" "}
        <TooltipMaterialIcon color={colors.primary} label="Automatic resource buying" name={APP_ICONS.marketAutoBuy} size={15} />{" "}
        button permanently activates automatic buying for the facility’s
        production-cycle input resources.
      </Text>
      <Text style={styles.dialogDescription}>
        Automatic resource buying is covered in more detail later. Optional
        inputs and their checkbox are explained in the next step.
      </Text>
    </>
  );
  const recipeOptionalInputsContent = (
    <>
      <Text style={styles.dialogDescription}>
        Some recipes have optional inputs. They never stop a recipe from
        running, but they can change the production result when consumed.
      </Text>
      <Text style={styles.dialogDescription}>
        In the input/output card, the checkbox beside an optional resource
        toggles automatic use for the recipes in your production cycle. When
        enabled, the facility uses that resource when it is available; when
        disabled, it leaves the resource out.
      </Text>
      <Text style={styles.dialogDescription}>
        Optional inputs can change output amount, quality, or required input
        amounts. When enabled, they are included in the cycle inputs used by
        the Buy and Automatic buying buttons.
      </Text>
    </>
  );
  const recipeEconomicsContent = (
    <>
      <Text style={styles.dialogDescription}>
        Value/min shows the estimated value produced per minute.{" "}
        <TooltipMaterialIcon
          color={colors.primary}
          label="Decay cost"
          name={APP_ICONS.repair}
          size={15}
        />{" "}
        Decay cost/min shows the ongoing{" "}
        <TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} />{" "}
        Construction Materials cost from wear and tear. Net gain/min is the
        value left after those running costs.
      </Text>
      <Text style={styles.dialogDescription}>
        These values depend on{" "}
        <TooltipMaterialIcon color={colors.primary} label="Local market" name={APP_ICONS.localMarket} size={15} />{" "}
        local market prices, company{" "}
        <TooltipMaterialIcon color={colors.primary} label="Research" name={APP_ICONS.research} size={15} />{" "}
        research, and facility’s{" "}
        <TooltipMaterialIcon color={colors.primary} label="Facility upgrades" name={APP_ICONS.upgrade} size={15} />{" "}
        upgrades, so they can change as your company develops.
      </Text>
      <Text style={styles.dialogDescription}>
        We will explore market prices, research effects, upgrades, and
        production economics in more detail later.
      </Text>
    </>
  );
  const content =
    step === "research" ? (
      researchContent
    ) : step === "recipe-card" ? (
      recipeCardContent
    ) : step === "recipe-automation" ? (
      recipeAutomationContent
    ) : step === "recipe-optional-inputs" ? (
      recipeOptionalInputsContent
    ) : step === "recipe-economics" ? (
      recipeEconomicsContent
    ) : step === "upgrades" ? (
      <>
        <Text style={styles.dialogDescription}>
          <TooltipMaterialIcon color={colors.primary} label="Upgrades" name={APP_ICONS.upgrade} size={15} />{" "}
          The Upgrades tab lets you improve this facility over time. Each
          upgrade has a level and a different effect on production.
        </Text>
        <Text style={styles.dialogDescription}>
          <TooltipMaterialIcon color={colors.primary} label="Speed upgrade" name={APP_ICONS.speed} size={15} />{" "}
          Speed increases how quickly work is completed.{" "}
          <TooltipMaterialIcon color={colors.primary} label="Output upgrade" name={APP_ICONS.output} size={15} />{" "}
          Output increases the amount produced.{" "}
          <TooltipMaterialIcon color={colors.primary} label="Durability upgrade" name={APP_ICONS.durability} size={15} />{" "}
          Durability reduces wear and tear, while{" "}
          <TooltipMaterialIcon color={colors.primary} label="Quality upgrade" name={APP_ICONS.quality} size={15} />{" "}
          Quality raises the facility’s output-quality limit.
        </Text>
        <Text style={styles.dialogDescription}>
          Upgrades cost{" "}
          <TooltipMaterialIcon color={colors.primary} label="Cash" name={APP_ICONS.currency} size={15} />{" "}
          cash,{" "}
          <TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} />{" "}
          Construction Materials, and{" "}
          <TooltipResourceIcon resourceType={ResourceType.IndustrialMachines} />{" "}
          Industrial Machines. When you press an upgrade button, the game
          automatically buys any missing resources from the local market. The cost you see is the total cost of the upgrade, including any market purchases.
        </Text>
      </>
    ) : step === "inventory-transition" ? (
      <>
        <Text style={styles.dialogDescription}>
          The resources your facility produces can be seen in the Inventory.
          The Inventory is also where you can compare resource prices on the
          different markets.
        </Text>
        <Text style={styles.dialogDescription}>
          You can manually buy and sell resources here, and set up automatic
          buying and selling orders.
        </Text>
      </>
    ) : step === "overview" ? (
      <>
        <Text style={styles.dialogDescription}>
          Congratulations—you have built your first facility.
        </Text>
        <Text style={styles.dialogDescription}>
          Facilities are where production happens. This is where you create the
          products you will sell, making them the engine of your company’s
          economy.
        </Text>
      </>
    ) : step === "header" ? (
      <>
        <Text
          style={styles.dialogDescription}
        >{`The facility is a ${definition.name}.`}</Text>
        <Text style={styles.dialogDescription}>
          Each facility shows basic information in its header: an icon for the
          facility type,{" "}
          <TooltipMaterialIcon
            color={colors.primary}
            label="Staffing"
            name={APP_ICONS.staffing}
            size={15}
          />{" "}
          current and required staff
          {getFacilitySizeOptions(facilityType).length > 1 && (
            <>
              ,{" "}
              <TooltipMaterialIcon
                color={colors.primary}
                label="Facility size"
                name={APP_ICONS.facilityFarm}
                size={15}
              />{" "}
              facility size
            </>
          )},{" "}
          <TooltipMaterialIcon
            color={colors.primary}
            label="Efficiency"
            name={APP_ICONS.efficiency}
            size={15}
          />{" "}
          efficiency, and the three upgrade levels:{" "}
          <TooltipMaterialIcon
            color={colors.primary}
            label="Speed upgrade"
            name={APP_ICONS.speed}
            size={15}
          />{" "}
          <TooltipMaterialIcon
            color={colors.primary}
            label="Output upgrade"
            name={APP_ICONS.output}
            size={15}
          />{" "}
          <TooltipMaterialIcon
            color={colors.primary}
            label="Durability upgrade"
            name={APP_ICONS.durability}
            size={15}
          />{" "}
          <TooltipMaterialIcon
            color={colors.primary}
            label="Quality upgrade"
            name={APP_ICONS.quality}
            size={15}
          />
          . Staffing directly affects efficiency. Upgrades influence efficiency
          indirectly, which we will explore later.
        </Text>
        <Text style={styles.dialogDescription}>
          You can also{" "}
          <TooltipMaterialIcon
            color={colors.error}
            label="Sell facility"
            name={APP_ICONS.destroy}
            size={15}
          />{" "}
          sell a facility again, but selling it comes at a cost.
        </Text>
      </>
    ) : step === "footprint" ? (
      resourceMessage
    ) : step === "efficiency" ? (
      <Text style={styles.dialogDescription}>
        Open the{" "}
          <TooltipMaterialIcon
            color={colors.primary}
            label="Staffing management"
            name={APP_ICONS.staffing}
            size={15}
          />{" "}
        staffing controls to see how your workers affect this facility.
      </Text>
    ) : step === "staff-management" ? (
      <Text style={styles.dialogDescription}>
        Use the staff slider to set the number of workers. Understaffing reduces
        facility efficiency; adding staff can improve it, but raises wear and
        tear. Try changing the number now and watch the projected efficiency
        update immediately.
      </Text>
    ) : step === "staff-training" ? (
      <>
        <Text style={styles.dialogDescription}>
          Staff Q is the shared knowledge and experience of the assigned staff.
          It affects staffing efficiency and lets the facility produce
          higher-quality products. Training and production experience can raise
          Staff Q over time.
        </Text>
        <Text style={styles.dialogDescription}>
          Expected wage is neutral for the current Staff Q and economy. Paying
          below or above it creates wage pressure that changes Staff Q over
          time.
        </Text>
      </>
    ) : (
      <>
        <Text style={styles.dialogDescription}>
          You can{" "}
          <TooltipMaterialIcon
            color={colors.primary}
            label="Repair"
            name={APP_ICONS.repair}
            size={15}
          />{" "}
          repair your facility in this view. Facilities wear down through
          production and over time, reducing their efficiency. A facility in
          production naturally decay much faster than a inactive facility, but
          in fact you can allready see a tiny wear and tear has allready
          commenced.
        </Text>
        <Text style={styles.dialogDescription}>
          Repair costs use three resources:{" "}
          <TooltipMaterialIcon
            color={colors.primary}
            label="Cash"
            name={APP_ICONS.currency}
            size={15}
          />{" "}
          cash,{" "}
          <TooltipResourceIcon
            resourceType={ResourceType.ConstructionMaterials}
          />{" "}
          Construction Materials, and{" "}
          <TooltipResourceIcon resourceType={ResourceType.IndustrialMachines} />{" "}
          Industrial Machines—the same resources used to construct the
          facility.
        </Text>
        <Text style={styles.dialogDescription}>
          Early wear has a small efficiency impact, but once wear accelerates,
          inefficiency increases quickly. Regular repairs keep production
          reliable.
        </Text>
      </>
    );
  return (
    <Portal>
      {visible && (
        <View
          pointerEvents="box-none"
          style={styles.tutorialFirstFacilityOverlay}
        >
          {spotlight}
          <View
            pointerEvents="auto"
            style={[
              styles.tutorialFirstFacilityOverlayCard,
              isStaffingStep && { maxHeight: height * 0.46 },
            ]}
          >
            <TutorialGuideCharacter />
            <Text style={styles.tutorialDialogTitle}>{title}</Text>
            <TutorialCollapseControl
              collapsed={collapsed}
              onPress={() => setCollapsed((value) => !value)}
            />
            {!collapsed && (
              <ScrollView
                contentContainerStyle={styles.tutorialDialogContent}
                nestedScrollEnabled
                style={isStaffingStep ? { maxHeight: height * 0.22 } : undefined}
              >
                <Text
                  style={styles.sectionEyebrow}
                >{`STEP ${stepNumber} OF 19`}</Text>
                {content}
              </ScrollView>
            )}
            <TutorialActions nextLabel={step === "inventory-transition" ? "Go to Inventory" : undefined} onBack={onBack} onExit={onExit} onJumpToTutorial={onJumpToTutorial} onNext={onNext} />
          </View>
        </View>
      )}
    </Portal>
  );
}
