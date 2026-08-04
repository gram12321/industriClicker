import { ScrollView, useWindowDimensions, View } from 'react-native';
import { Button, Card, Dialog, List, Portal, Text } from 'react-native-paper';
import { colors } from '@/theme';
import type { Finance } from '@/game/finance';
import type { FacilityCollection, FacilityType } from '@/game/facilities';
import { FACILITY_TYPES, getFacilityDefinition } from '@/game/facilities';
import type { Inventory } from '@/game/inventory';
import type { Market } from '@/game/market';
import { ResourceType, getResourceIcon } from '@/game/resources';
import { clamp, formatCurrency, formatNumber } from '@/utils';
import { DetailRow, WorkMetric, formatRecipeInputs, formatRecipeName, formatRecipeOutput, styles } from '@/ui/dashboard/shared';
import { APP_ICONS } from '@/icons';

export function GameDialogs(props: {
  facilities: FacilityCollection;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  pendingConstruction: FacilityType | null;
  pendingDestruction: FacilityType | null;
  isConstructionYardOpen: boolean;
  onCloseConstructionYard: () => void;
  onSelectFacility: (facilityType: FacilityType) => void;
  onConfirmConstruction: () => void;
  onBuyMissingConstructionMaterials: () => void;
  onConfirmDestruction: () => void;
  onDismissConstruction: () => void;
  onDismissDestruction: () => void;
}) {
  return <>
    <ConstructionDialog facilities={props.facilities} facilityType={props.pendingConstruction} finance={props.finance} inventory={props.inventory} market={props.market} onBuyMissingConstructionMaterials={props.onBuyMissingConstructionMaterials} onConfirm={props.onConfirmConstruction} onDismiss={props.onDismissConstruction} />
    <ConstructionYardDialog facilities={props.facilities} finance={props.finance} inventory={props.inventory} onDismiss={props.onCloseConstructionYard} onSelectFacility={props.onSelectFacility} visible={props.isConstructionYardOpen} />
    <DestructionDialog facilityType={props.pendingDestruction} onConfirm={props.onConfirmDestruction} onDismiss={props.onDismissDestruction} />
  </>;
}
function ConstructionYardDialog({
  facilities,
  finance,
  inventory,
  onDismiss,
  onSelectFacility,
  visible,
}: {
  facilities: FacilityCollection;
  finance: Finance;
  inventory: Inventory;
  onDismiss: () => void;
  onSelectFacility: (facilityType: FacilityType) => void;
  visible: boolean;
}) {
  const { height } = useWindowDimensions();
  const facilityListMaxHeight = clamp(height - 280, 160, 480);

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} style={styles.constructionYardDialog} visible={visible}>
        <Dialog.Title>Build facility</Dialog.Title>
        <Dialog.Content style={styles.constructionYardDialogContent}>
          <Text style={styles.dialogDescription}>
            Choose an available facility. Its recipes and final cost are shown before construction.
          </Text>
          <Text style={styles.constructionYardFunds}>
            Available: {formatCurrency(finance.getBalance())} · {getResourceIcon(ResourceType.ConstructionMaterials)} {formatNumber(inventory.getAmount(ResourceType.ConstructionMaterials))} Construction Materials
          </Text>
          <ScrollView
            contentContainerStyle={styles.constructionYardList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator
            style={[styles.constructionYardListViewport, { maxHeight: facilityListMaxHeight }]}
          >
            {FACILITY_TYPES.map((facilityType) => {
              const definition = getFacilityDefinition(facilityType);
              const isBuilt = facilities.has(facilityType);
              return (
                <Card key={facilityType} mode="contained" style={styles.constructionYardCard}>
                  <Card.Content>
                    <List.Item
                      description={`Land: ${formatCurrency(definition.landCost)} · Materials: ${getResourceIcon(ResourceType.ConstructionMaterials)} ${formatNumber(definition.constructionMaterialsCost)}`}
                      left={(props) => <List.Icon {...props} icon={definition.icon} />}
                      title={definition.name}
                      titleStyle={styles.facilityTitle}
                    />
                    <Text style={styles.constructionYardRecipeLabel}>Available recipes</Text>
                    {definition.recipes.map((recipe) => (
                      <Text key={recipe.name} style={styles.constructionYardRecipe}>
                        {formatRecipeName(recipe)}: {formatRecipeInputs(recipe)} → {formatRecipeOutput(recipe)}
                      </Text>
                    ))}
                  </Card.Content>
                  <Card.Actions>
                    <Button
                      disabled={isBuilt}
                      mode="contained"
                      onPress={() => onSelectFacility(facilityType)}
                    >
                      {isBuilt ? 'Already built' : 'Review construction'}
                    </Button>
                  </Card.Actions>
                </Card>
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

function ConstructionDialog({
  facilities,
  facilityType,
  finance,
  inventory,
  market,
  onBuyMissingConstructionMaterials,
  onConfirm,
  onDismiss,
}: {
  facilities: FacilityCollection;
  facilityType: FacilityType | null;
  finance: Finance;
  inventory: Inventory;
  market: Market;
  onBuyMissingConstructionMaterials: () => void;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  if (facilityType === null) {
    return null;
  }

  const definition = getFacilityDefinition(facilityType);
  const canConstruct = !facilities.has(facilityType)
    && finance.canAfford(definition.landCost)
    && inventory.has(ResourceType.ConstructionMaterials, definition.constructionMaterialsCost);
  const balanceAfterConstruction = finance.getBalance() - definition.landCost;
  const materialsAfterConstruction = inventory.getAmount(ResourceType.ConstructionMaterials) - definition.constructionMaterialsCost;
  const missingMaterials = Math.max(0, -materialsAfterConstruction);
  const materialUnitPrice = market.getLocalPrice(ResourceType.ConstructionMaterials);
  const materialPurchaseCost = missingMaterials * materialUnitPrice;
  const canAutoBuyMaterials = missingMaterials > 0
    && market.getLocalEntry(ResourceType.ConstructionMaterials).supply >= missingMaterials
    && finance.canAfford(definition.landCost + materialPurchaseCost);

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} visible>
        <Dialog.Title>{`Construct ${definition.name}?`}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.dialogDescription}>
            Purchase the land and supply the construction materials before the facility is added to your company.
          </Text>
          <View style={styles.dialogSummary}>
            <DetailRow label="Land purchase" value={formatCurrency(definition.landCost)} />
            <DetailRow label="Construction Materials" value={`${getResourceIcon(ResourceType.ConstructionMaterials)} ${formatNumber(definition.constructionMaterialsCost)}`} />
            <DetailRow label="Funds after purchase" value={formatCurrency(balanceAfterConstruction)} />
            <DetailRow label="Materials after build" value={`${getResourceIcon(ResourceType.ConstructionMaterials)} ${formatNumber(materialsAfterConstruction)}`} />
          </View>
          <Text variant="titleMedium" style={styles.dialogSectionHeading}>Available recipes</Text>
          {definition.recipes.map((recipe) => (
            <List.Item
              key={recipe.name}
              title={formatRecipeName(recipe)}
              description={<View><Text style={styles.cardDescription}>{`${formatRecipeInputs(recipe)} → ${formatRecipeOutput(recipe)}`}</Text><WorkMetric value={String(recipe.workAmount)} /></View>}
              left={(props) => <List.Icon {...props} icon={APP_ICONS.play} />}
            />
          ))}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          {missingMaterials > 0 && <Button disabled={!canAutoBuyMaterials} onPress={onBuyMissingConstructionMaterials}>{`Buy ${formatNumber(missingMaterials)} materials · ${formatCurrency(materialPurchaseCost)}`}</Button>}
          <Button disabled={!canConstruct} mode="contained" onPress={onConfirm}>Confirm build</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function DestructionDialog({
  facilityType,
  onConfirm,
  onDismiss,
}: {
  facilityType: FacilityType | null;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  if (facilityType === null) {
    return null;
  }

  const definition = getFacilityDefinition(facilityType);

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} visible>
        <Dialog.Title>{`Destroy ${definition.name}?`}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.dialogDescription}>
            This permanently removes the facility from your company. Land and construction materials are not refunded.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button buttonColor={colors.error} mode="contained" onPress={onConfirm} textColor={colors.onDark}>
            Confirm destruction
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}


