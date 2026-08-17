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
import type { Recipe } from '@/game/recipes/recipeTypes';
import { ResourceType, getResource } from '@/game/resources';
import { clamp, formatCurrency, formatNumber } from '@/utils';
import { WorkMetric } from '@/ui/dashboard/components/DashboardPrimitives';
import { formatRecipeName } from '@/ui/dashboard/helpers/recipeFormatters';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { APP_ICONS, RECIPE_ICONS, RESOURCE_ICONS } from '@/icons';

function CurrencyValue({ value }: { value: number }) {
  return <View style={styles.currencyValue}><MaterialCommunityIcons name={APP_ICONS.coin} size={16} color={styles.detailValue.color} /><Text style={styles.detailValue}>{formatCurrency(value).replace(/\s*€/u, '')}</Text></View>;
}

function formatRecipeInputs(recipe: Recipe): string {
  if (recipe.inputs.length === 0) return '';
  return recipe.inputs.map(({ resourceType, amount }) => `${getResource(resourceType).name} ×${formatNumber(amount, { smartDecimals: true })}`).join(' + ');
}

function formatRecipeOutput(recipe: Recipe): string {
  return recipe.outputs.map(({ resourceType, amount }) => `${getResource(resourceType).name} ×${formatNumber(amount, { smartDecimals: true })}`).join(' + ');
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
  onCloseConstructionYard: () => void;
  onSelectFacility: (facilityType: FacilityType) => void;
  onConfirmConstruction: () => void;
  onBuyMissingConstructionInputs: () => void;
  onConfirmDestruction: () => void;
  onDismissConstruction: () => void;
  onDismissDestruction: () => void;
}) {
  return <>
    <ConfirmConstrution facilityType={props.pendingConstruction} finance={props.finance} inventory={props.inventory} market={props.market} onBuyMissingConstructionInputs={props.onBuyMissingConstructionInputs} onConfirm={props.onConfirmConstruction} onDismiss={props.onDismissConstruction} />
    <BuildFacilityDialog finance={props.finance} inventory={props.inventory} isConstructionTutorial={props.isConstructionTutorial} market={props.market} onDismiss={props.onCloseConstructionYard} onSelectFacility={props.onSelectFacility} visible={props.isConstructionYardOpen} />
    <DestructionDialog facilities={props.facilities} facilityId={props.pendingDestruction} market={props.market} onConfirm={props.onConfirmDestruction} onDismiss={props.onDismissDestruction} />
  </>;
}
function BuildFacilityDialog({
  finance,
  inventory,
  isConstructionTutorial,
  market,
  onDismiss,
  onSelectFacility,
  visible,
}: {
  finance: Finance;
  inventory: Inventory;
  isConstructionTutorial?: boolean;
  market: Market;
  onDismiss: () => void;
  onSelectFacility: (facilityType: FacilityType) => void;
  visible: boolean;
}) {
  const { height } = useWindowDimensions();
  const facilityListMaxHeight = clamp(height - 280, 160, 480);
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const facilities = FACILITY_GROUPS.flatMap((group) => group.facilities.map((facilityType) => {
    const definition = getFacilityDefinition(facilityType);
    const missingMaterials = Math.max(0, definition.constructionMaterialsCost - inventory.getAmount(ResourceType.ConstructionMaterials));
    const missingIndustrialMachines = Math.max(0, definition.industrialMachinesCost - inventory.getAmount(ResourceType.IndustrialMachines));
    const canAffordConstruction = market.getLocalEntry(ResourceType.ConstructionMaterials).supply >= missingMaterials
      && market.getLocalEntry(ResourceType.IndustrialMachines).supply >= missingIndustrialMachines
      && finance.canAfford(definition.landCost + missingMaterials * market.getLocalPrice(ResourceType.ConstructionMaterials) + missingIndustrialMachines * market.getLocalPrice(ResourceType.IndustrialMachines));
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
            style={[styles.constructionYardListViewport, { maxHeight: facilityListMaxHeight }]}
          >
            {filteredFacilities.map(({ canAffordConstruction, definition, facilityType, groupLabel }, index) => {
              const constructionMaterialsPrice = market.getLocalPrice(ResourceType.ConstructionMaterials);
              const industrialMachinesPrice = market.getLocalPrice(ResourceType.IndustrialMachines);
              const totalConstructionCost = definition.landCost + definition.constructionMaterialsCost * constructionMaterialsPrice + definition.industrialMachinesCost * industrialMachinesPrice;
              const showGroup = index === 0 || filteredFacilities[index - 1].groupLabel !== groupLabel;
              return (
                <View key={facilityType}>
                {showGroup && <Text style={styles.cardKicker}>{groupLabel}</Text>}
                <Card
                  accessibilityLabel={`${definition.name}${canAffordConstruction ? '' : ' unavailable'}`}
                  accessibilityState={{ disabled: !canAffordConstruction || isConstructionTutorial }}
                  mode="contained"
                  onPress={canAffordConstruction && !isConstructionTutorial ? () => onSelectFacility(facilityType) : undefined}
                  style={[styles.constructionYardCard, !canAffordConstruction && styles.constructionYardCardDisabled]}
                >
                  <Card.Content>
                    <List.Item
                      description={<View style={styles.currencyDescription}><Text>Land (euros):</Text><CurrencyValue value={definition.landCost} /><Text>{` · ${RESOURCE_ICONS[ResourceType.ConstructionMaterials]} Construction Materials: ${formatNumber(definition.constructionMaterialsCost)} · ${RESOURCE_ICONS[ResourceType.IndustrialMachines]} Industrial Machines: ${formatNumber(definition.industrialMachinesCost)}`}</Text></View>}
                      left={(props) => <List.Icon {...props} icon={definition.icon} />}
                      title={definition.name}
                      titleStyle={styles.facilityTitle}
                    />
                    <View style={styles.facilityCostDetails}>
                      <View style={styles.currencyDescription}><Text>{`${RESOURCE_ICONS[ResourceType.ConstructionMaterials]} Construction Materials price:`}</Text><CurrencyValue value={constructionMaterialsPrice} /><Text>{` · ${RESOURCE_ICONS[ResourceType.IndustrialMachines]} Industrial Machines price:`}</Text><CurrencyValue value={industrialMachinesPrice} /></View>
                      <View style={styles.currencyDescription}><Text>Market replacement cost:</Text><CurrencyValue value={totalConstructionCost} /></View>
                    </View>
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
  market,
  onBuyMissingConstructionInputs,
  onConfirm,
  onDismiss,
}: {
  facilityType: FacilityType | null;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  onBuyMissingConstructionInputs: () => void;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  if (facilityType === null) {
    return null;
  }

  const definition = getFacilityDefinition(facilityType);
  const canConstruct = finance.canAfford(definition.landCost)
    && inventory.has(ResourceType.ConstructionMaterials, definition.constructionMaterialsCost)
    && inventory.has(ResourceType.IndustrialMachines, definition.industrialMachinesCost);
  const balanceAfterConstruction = finance.getBalance() - definition.landCost;
  const materialsAfterConstruction = inventory.getAmount(ResourceType.ConstructionMaterials) - definition.constructionMaterialsCost;
  const industrialMachinesAfterConstruction = inventory.getAmount(ResourceType.IndustrialMachines) - definition.industrialMachinesCost;
  const missingMaterials = Math.max(0, -materialsAfterConstruction);
  const missingIndustrialMachines = Math.max(0, -industrialMachinesAfterConstruction);
  const materialUnitPrice = market.getLocalPrice(ResourceType.ConstructionMaterials);
  const industrialMachinesUnitPrice = market.getLocalPrice(ResourceType.IndustrialMachines);
  const missingInputsPurchaseCost = missingMaterials * materialUnitPrice + missingIndustrialMachines * industrialMachinesUnitPrice;
  const canAutoBuyInputs = (missingMaterials > 0 || missingIndustrialMachines > 0)
    && market.getLocalEntry(ResourceType.ConstructionMaterials).supply >= missingMaterials
    && market.getLocalEntry(ResourceType.IndustrialMachines).supply >= missingIndustrialMachines
    && finance.canAfford(definition.landCost + missingInputsPurchaseCost);

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} visible>
        <Dialog.Title>{`Construct ${definition.name}?`}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.dialogDescription}>
            Purchase the land, supply the Construction Materials, and install the Industrial Machines before the facility is added to your company.
          </Text>
          <Card mode="contained" style={styles.dialogSummaryCard}>
            <Card.Content style={styles.dialogSummaryContent}>
              <View style={styles.dialogSummaryRow}><Text>Construction cost</Text><View style={styles.currencyDescription}><CurrencyValue value={definition.landCost} /><Text style={styles.detailValue}>{` · ${RESOURCE_ICONS[ResourceType.ConstructionMaterials]} Construction Materials: ${formatNumber(definition.constructionMaterialsCost)} · ${RESOURCE_ICONS[ResourceType.IndustrialMachines]} Industrial Machines: ${formatNumber(definition.industrialMachinesCost)}`}</Text></View></View>
              <View style={styles.dialogSummaryRow}><Text>Resources after purchase</Text><View style={styles.currencyDescription}><CurrencyValue value={balanceAfterConstruction} /><Text style={styles.detailValue}>{` · ${RESOURCE_ICONS[ResourceType.ConstructionMaterials]} Construction Materials: ${formatNumber(materialsAfterConstruction)} · ${RESOURCE_ICONS[ResourceType.IndustrialMachines]} Industrial Machines: ${formatNumber(industrialMachinesAfterConstruction)}`}</Text></View></View>
            </Card.Content>
          </Card>
          <Text variant="titleMedium" style={styles.dialogSectionHeading}>Available recipes</Text>
          {definition.recipes.map((recipe) => (
            <List.Item
              key={recipe.name}
              left={() => <Text>{RECIPE_ICONS[recipe.name]}</Text>}
              title={formatRecipeName(recipe)}
              description={<View><Text style={styles.cardDescription}>{`${formatRecipeInputs(recipe)} → ${formatRecipeOutput(recipe)}`}</Text><WorkMetric value={String(recipe.requiredWork)} /></View>}
            />
          ))}
        </Dialog.Content>
        <Dialog.Actions>
          <Button mode="outlined" onPress={onDismiss}>Cancel</Button>
          {(missingMaterials > 0 || missingIndustrialMachines > 0) && <Button disabled={!canAutoBuyInputs} mode="outlined" onPress={onBuyMissingConstructionInputs}><Text>Buy missing inputs · </Text><MaterialCommunityIcons name={APP_ICONS.coin} size={16} color={styles.detailValue.color} /><Text> {formatCurrency(missingInputsPurchaseCost).replace(/\s*€/u, '')}</Text></Button>}
          <Button disabled={!canConstruct} mode="contained" onPress={onConfirm}>Confirm build</Button>
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


