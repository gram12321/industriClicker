import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Dialog, List, Portal, SegmentedButtons, Text } from 'react-native-paper';
import { colors } from '@/theme';
import { LOAN_COLLECTION, calculateFacilityAssetValue, type Finance } from '@/game/finance';
import type { FacilityCollection, FacilityType } from '@/game/facilities';
import { FACILITY_GROUPS, getFacilityDefinition } from '@/game/facilities';
import type { Inventory } from '@/game/inventory';
import type { Market } from '@/game/market';
import { ResourceType } from '@/game/resources';
import { clamp, formatCurrency, formatNumber } from '@/utils';
import { WorkMetric } from '@/ui/dashboard/components/DashboardPrimitives';
import { formatRecipeName } from '@/ui/dashboard/helpers/recipeFormatters';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { APP_ICONS, RECIPE_ICONS } from '@/icons';
import { TooltipResourceIcon, TooltipTextIcon } from '@/ui/dashboard/components/IconTooltip';
import { RecipeResourceSummary } from '@/ui/dashboard/components/RecipeResourceSummary';

function getMarketPurchaseCost(market: Market, resourceType: ResourceType, amount: number): number {
  if (amount <= 0) return 0;
  const quote = market.getLocalBuyQuote(resourceType, amount);
  return quote.success ? quote.unitPrice * quote.amount : Number.POSITIVE_INFINITY;
}

function getDisplayedMarketUnitPrice(market: Market, resourceType: ResourceType, amount: number): number {
  if (amount <= 0) return market.getLocalPrice(resourceType);
  const quote = market.getLocalBuyQuote(resourceType, amount);
  return quote.success ? quote.unitPrice : market.getLocalPrice(resourceType);
}

function CurrencyValue({ value }: { value: number }) {
  return <View style={styles.currencyValue}><MaterialCommunityIcons name={APP_ICONS.coin} size={16} color={styles.detailValue.color} /><Text style={styles.detailValue}>{formatCurrency(value).replace(/\s*€/u, '')}</Text></View>;
}

export function FacilityConstructionDialog(props: {
  facilities: FacilityCollection;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  pendingConstruction: FacilityType | null;
  pendingDestruction: string | null;
  isConstructionYardOpen: boolean;
  isConstructionTutorial?: boolean;
  isFacilitySelectionEnabled?: boolean;
  onCloseConstructionYard: () => void;
  onSelectFacility: (facilityType: FacilityType) => void;
  onConfirmConstruction: () => void;
  onBuyMissingConstructionInputs: () => void;
  onConfirmDestruction: () => void;
  onDismissConstruction: () => void;
  onDismissDestruction: () => void;
}) {
  return <>
    <ConfirmConstrution facilityType={props.pendingConstruction} finance={props.finance} inventory={props.inventory} isConstructionTutorial={props.isConstructionTutorial} market={props.market} onBuyMissingConstructionInputs={props.onBuyMissingConstructionInputs} onConfirm={props.onConfirmConstruction} onDismiss={props.onDismissConstruction} />
    <BuildFacilityDialog finance={props.finance} inventory={props.inventory} isConstructionTutorial={props.isConstructionTutorial} isFacilitySelectionEnabled={props.isFacilitySelectionEnabled} market={props.market} onDismiss={props.onCloseConstructionYard} onSelectFacility={props.onSelectFacility} visible={props.isConstructionYardOpen} />
    <DestructionDialog facilities={props.facilities} facilityId={props.pendingDestruction} market={props.market} onConfirm={props.onConfirmDestruction} onDismiss={props.onDismissDestruction} />
  </>;
}
function BuildFacilityDialog({
  finance,
  inventory,
  isConstructionTutorial,
  isFacilitySelectionEnabled,
  market,
  onDismiss,
  onSelectFacility,
  visible,
}: {
  finance: Finance;
  inventory: Inventory;
  isConstructionTutorial?: boolean;
  isFacilitySelectionEnabled?: boolean;
  market: Market;
  onDismiss: () => void;
  onSelectFacility: (facilityType: FacilityType) => void;
  visible: boolean;
}) {
  const { height } = useWindowDimensions();
  const facilityListMaxHeight = clamp(height - 280, 160, 480);
  const tutorialFacilityListMaxHeight = clamp(height * 0.24, 140, 220);
  const canSelectFacility = !isConstructionTutorial || isFacilitySelectionEnabled === true;
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const facilities = FACILITY_GROUPS.flatMap((group) => group.facilities.map((facilityType) => {
    const definition = getFacilityDefinition(facilityType);
    const missingMaterials = Math.max(0, definition.constructionMaterialsCost - inventory.getAmount(ResourceType.ConstructionMaterials));
    const missingIndustrialMachines = Math.max(0, definition.industrialMachinesCost - inventory.getAmount(ResourceType.IndustrialMachines));
    const materialPurchaseCost = getMarketPurchaseCost(market, ResourceType.ConstructionMaterials, missingMaterials);
    const machinePurchaseCost = getMarketPurchaseCost(market, ResourceType.IndustrialMachines, missingIndustrialMachines);
    const canAffordConstruction = Number.isFinite(materialPurchaseCost)
      && Number.isFinite(machinePurchaseCost)
      && finance.canAfford(definition.landCost + materialPurchaseCost + machinePurchaseCost);
    return { canAffordConstruction, definition, facilityType, groupLabel: group.label };
  }));
  const filteredFacilities = facilities.filter(({ canAffordConstruction }) => facilityFilter === 'all'
    || (facilityFilter === 'available' ? canAffordConstruction : !canAffordConstruction));

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} style={[styles.constructionYardDialog, isConstructionTutorial && styles.tutorialConstructionYardDialog]} visible={visible}>
        <Dialog.Title>Build facility</Dialog.Title>
        <Dialog.Content style={styles.constructionYardDialogContent}>
          <SegmentedButtons
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'available', label: 'Available' },
              { value: 'unavailable', label: 'Unavailable' },
            ]}
            onValueChange={(value) => setFacilityFilter(value as 'all' | 'available' | 'unavailable')}
            value={facilityFilter}
          />
          <ScrollView
            contentContainerStyle={styles.constructionYardList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator
            style={[styles.constructionYardListViewport, { maxHeight: isConstructionTutorial ? tutorialFacilityListMaxHeight : facilityListMaxHeight }]}
          >
            {filteredFacilities.map(({ canAffordConstruction, definition, facilityType, groupLabel }, index) => {
              const constructionMaterialsPrice = getDisplayedMarketUnitPrice(market, ResourceType.ConstructionMaterials, definition.constructionMaterialsCost);
              const industrialMachinesPrice = getDisplayedMarketUnitPrice(market, ResourceType.IndustrialMachines, definition.industrialMachinesCost);
              const totalConstructionCost = definition.landCost + definition.constructionMaterialsCost * constructionMaterialsPrice + definition.industrialMachinesCost * industrialMachinesPrice;
              const showGroup = index === 0 || filteredFacilities[index - 1].groupLabel !== groupLabel;
              return (
                <View key={facilityType}>
                {showGroup && <Text style={styles.cardKicker}>{groupLabel}</Text>}
                <Card
                  accessibilityLabel={`${definition.name}${canAffordConstruction ? '' : ' unavailable'}`}
                  accessibilityState={{ disabled: !canAffordConstruction || !canSelectFacility }}
                  mode="contained"
                  onPress={canAffordConstruction && canSelectFacility ? () => onSelectFacility(facilityType) : undefined}
                  style={[styles.constructionYardCard, (!canAffordConstruction || !canSelectFacility) && styles.constructionYardCardDisabled]}
                >
                  <Card.Content>
                    <List.Item
                      description={<View style={styles.facilityCostDetails}><View style={styles.currencyDescription}><Text>Land (euros):</Text><CurrencyValue value={definition.landCost} /></View><View style={styles.currencyDescription}><Text><TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} /> Construction Materials: {formatNumber(definition.constructionMaterialsCost)} ·</Text><CurrencyValue value={constructionMaterialsPrice} /></View><View style={styles.currencyDescription}><Text><TooltipResourceIcon resourceType={ResourceType.IndustrialMachines} /> Industrial Machines: {formatNumber(definition.industrialMachinesCost)} ·</Text><CurrencyValue value={industrialMachinesPrice} /></View><View style={styles.currencyDescription}><Text>Market replacement cost (Total cost):</Text><CurrencyValue value={totalConstructionCost} /></View></View>}
                      left={(props) => <List.Icon {...props} icon={definition.icon} />}
                      title={definition.name}
                      titleStyle={styles.facilityTitle}
                    />
                  </Card.Content>
                </Card>
                </View>
              );
            })}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function ConfirmConstrution({
  facilityType,
  finance,
  inventory,
  isConstructionTutorial,
  market,
  onBuyMissingConstructionInputs,
  onConfirm,
  onDismiss,
}: {
  facilityType: FacilityType | null;
  finance: Finance;
  inventory: Inventory;
  isConstructionTutorial?: boolean;
  market: Market;
  onBuyMissingConstructionInputs: () => void;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const [expandedRecipeName, setExpandedRecipeName] = useState<string | null>(null);
  const { height } = useWindowDimensions();
  if (facilityType === null) {
    return null;
  }

  const definition = getFacilityDefinition(facilityType);
  const contentMaxHeight = isConstructionTutorial
    ? Math.min(300, Math.max(180, height * 0.38))
    : Math.min(420, Math.max(220, height * 0.52));
  const canConstruct = finance.canAfford(definition.landCost)
    && inventory.has(ResourceType.ConstructionMaterials, definition.constructionMaterialsCost)
    && inventory.has(ResourceType.IndustrialMachines, definition.industrialMachinesCost);
  const balanceAfterConstruction = finance.getBalance() - definition.landCost;
  const materialsAfterConstruction = inventory.getAmount(ResourceType.ConstructionMaterials) - definition.constructionMaterialsCost;
  const industrialMachinesAfterConstruction = inventory.getAmount(ResourceType.IndustrialMachines) - definition.industrialMachinesCost;
  const missingMaterials = Math.max(0, -materialsAfterConstruction);
  const missingIndustrialMachines = Math.max(0, -industrialMachinesAfterConstruction);
  const missingInputsPurchaseCost = getMarketPurchaseCost(market, ResourceType.ConstructionMaterials, missingMaterials)
    + getMarketPurchaseCost(market, ResourceType.IndustrialMachines, missingIndustrialMachines);
  const displayedMissingInputsPurchaseCost = missingMaterials * getDisplayedMarketUnitPrice(market, ResourceType.ConstructionMaterials, missingMaterials)
    + missingIndustrialMachines * getDisplayedMarketUnitPrice(market, ResourceType.IndustrialMachines, missingIndustrialMachines);
  const canAutoBuyInputs = (missingMaterials > 0 || missingIndustrialMachines > 0)
    && Number.isFinite(missingInputsPurchaseCost)
    && finance.canAfford(definition.landCost + missingInputsPurchaseCost);

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} style={isConstructionTutorial ? styles.tutorialConstructionConfirmDialog : undefined} visible>
        <Dialog.Title>{`Construct ${definition.name}?`}</Dialog.Title>
        <Dialog.Content>
          <ScrollView contentContainerStyle={[styles.constructionConfirmContent, isConstructionTutorial && styles.tutorialConstructionConfirmContent]} style={{ maxHeight: contentMaxHeight }}>
            <Text style={styles.dialogDescription}>
              Purchase the land, supply the Construction Materials, and install the Industrial Machines before the facility is added to your company.
            </Text>
            <Card mode="contained" style={styles.dialogSummaryCard}>
              <Card.Content style={styles.dialogSummaryContent}>
                <View style={styles.dialogSummaryRow}><Text>Construction cost</Text><View style={styles.currencyDescription}><CurrencyValue value={definition.landCost} /><Text style={styles.detailValue}> · <TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} /> Construction Materials: {formatNumber(definition.constructionMaterialsCost)} · <TooltipResourceIcon resourceType={ResourceType.IndustrialMachines} /> Industrial Machines: {formatNumber(definition.industrialMachinesCost)}</Text></View></View>
                <View style={styles.dialogSummaryRow}><Text>Resources after purchase</Text><View style={styles.currencyDescription}><CurrencyValue value={balanceAfterConstruction} /><Text style={styles.detailValue}> · <TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} /> Construction Materials: {formatNumber(materialsAfterConstruction)} · <TooltipResourceIcon resourceType={ResourceType.IndustrialMachines} /> Industrial Machines: {formatNumber(industrialMachinesAfterConstruction)}</Text></View></View>
              </Card.Content>
            </Card>
            <Text variant="titleMedium" style={styles.dialogSectionHeading}>Available recipes</Text>
            {definition.recipes.map((recipe) => {
              const isExpanded = expandedRecipeName === recipe.name;
              return <View key={recipe.name}><List.Item
                onPress={() => setExpandedRecipeName(isExpanded ? null : recipe.name)}
                left={() => <TooltipTextIcon label={formatRecipeName(recipe)}>{RECIPE_ICONS[recipe.name]}</TooltipTextIcon>}
                right={(props) => <List.Icon {...props} icon={isExpanded ? 'chevron-up' : 'chevron-down'} />}
                title={formatRecipeName(recipe)}
              />{isExpanded && <View style={styles.dialogSummaryContent}><RecipeResourceSummary recipe={recipe} /><WorkMetric value={String(recipe.requiredWork)} /></View>}</View>;
            })}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions style={styles.constructionConfirmActions}>
          <Button compact mode="outlined" onPress={onDismiss}>Cancel</Button>
          {(missingMaterials > 0 || missingIndustrialMachines > 0) && <Button compact disabled={!canAutoBuyInputs} mode="outlined" onPress={onBuyMissingConstructionInputs}><Text>Buy missing inputs · </Text><MaterialCommunityIcons name={APP_ICONS.coin} size={16} color={styles.detailValue.color} /><Text> {formatCurrency(displayedMissingInputsPurchaseCost).replace(/\s*€/u, '')}</Text></Button>}
          <Button compact disabled={!canConstruct} mode="contained" onPress={onConfirm}>Confirm build</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function DestructionDialog({
  facilities,
  facilityId,
  market,
  onConfirm,
  onDismiss,
}: {
  facilities: FacilityCollection;
  facilityId: string | null;
  market: Market;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const facility = facilityId ? facilities.get(facilityId) : null;
  if (!facility) {
    return null;
  }
  const bookValue = calculateFacilityAssetValue(facility, market);
  const proceeds = bookValue * LOAN_COLLECTION.voluntaryFacilitySaleRate;

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} visible>
        <Dialog.Title>{`Sell ${facility.getView().displayName}?`}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.dialogDescription}>
            This permanently removes the facility and pays €{formatNumber(proceeds, { smartDecimals: true })}, which is 70% of its current book value (€{formatNumber(bookValue, { smartDecimals: true })}).
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button buttonColor={colors.error} mode="contained" onPress={onConfirm} textColor={colors.onDark}>
            Confirm sale
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}


