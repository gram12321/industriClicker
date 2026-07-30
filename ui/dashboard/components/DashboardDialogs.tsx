import { ScrollView, useWindowDimensions, View } from 'react-native';
import { Button, Card, Dialog, List, Portal, Text } from 'react-native-paper';
import { colors } from '@/theme';
import type { Finance } from '@/game/finance/finance';
import type { FacilityCollection } from '@/game/facilities/facilityCollection';
import { FACILITY_TYPES, type FacilityType } from '@/game/facilities/facilityTypes';
import { getFacilityDefinition } from '@/game/facilities/facilityRegistry';
import type { Recipe } from '@/game/recipes/recipeTypes';
import { clamp, formatCurrency } from '@/utils';
import { styles } from '@/app/index.styles';
import { formatRecipeInputs, formatRecipeName, formatRecipeOutput } from '../helpers/recipeFormatters';
import { PlaceholderRow } from './DashboardViewComponents';

export function DashboardDialogs(props: {
  facilities: FacilityCollection;
  finance: Finance;
  pendingConstruction: FacilityType | null;
  pendingDestruction: FacilityType | null;
  isConstructionYardOpen: boolean;
  onCloseConstructionYard: () => void;
  onSelectFacility: (facilityType: FacilityType) => void;
  onConfirmConstruction: () => void;
  onConfirmDestruction: () => void;
  onDismissConstruction: () => void;
  onDismissDestruction: () => void;
}) {
  return <>
    <ConstructionDialog facilities={props.facilities} facilityType={props.pendingConstruction} finance={props.finance} onConfirm={props.onConfirmConstruction} onDismiss={props.onDismissConstruction} />
    <ConstructionYardDialog facilities={props.facilities} finance={props.finance} onDismiss={props.onCloseConstructionYard} onSelectFacility={props.onSelectFacility} visible={props.isConstructionYardOpen} />
    <DestructionDialog facilityType={props.pendingDestruction} onConfirm={props.onConfirmDestruction} onDismiss={props.onDismissDestruction} />
  </>;
}
export function ConstructionYardDialog({
  facilities,
  finance,
  onDismiss,
  onSelectFacility,
  visible,
}: {
  facilities: FacilityCollection;
  finance: Finance;
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
            Available funds: {formatCurrency(finance.getBalance())}
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
              const canAfford = finance.canAfford(definition.constructionCost);

              return (
                <Card key={facilityType} mode="contained" style={styles.constructionYardCard}>
                  <Card.Content>
                    <List.Item
                      description={`Construction cost: ${formatCurrency(definition.constructionCost)}`}
                      left={(props) => <List.Icon {...props} icon={definition.icon} />}
                      title={definition.name}
                      titleStyle={styles.facilityTitle}
                    />
                    <Text style={styles.constructionYardRecipeLabel}>Available recipes</Text>
                    {definition.recipes.map((recipe) => (
                      <Text key={recipe.name} style={styles.constructionYardRecipe}>
                        {formatRecipeName(recipe)}: {formatRecipeInputs(recipe)} â†’ {formatRecipeOutput(recipe)}
                      </Text>
                    ))}
                  </Card.Content>
                  <Card.Actions>
                    <Button
                      disabled={isBuilt || !canAfford}
                      mode="contained"
                      onPress={() => onSelectFacility(facilityType)}
                    >
                      {isBuilt ? 'Already built' : canAfford ? 'Review construction' : 'Insufficient funds'}
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

export function ConstructionDialog({
  facilities,
  facilityType,
  finance,
  onConfirm,
  onDismiss,
}: {
  facilities: FacilityCollection;
  facilityType: FacilityType | null;
  finance: Finance;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  if (facilityType === null) {
    return null;
  }

  const definition = getFacilityDefinition(facilityType);
  const canConstruct = !facilities.has(facilityType) && finance.canAfford(definition.constructionCost);
  const balanceAfterConstruction = finance.getBalance() - definition.constructionCost;

  return (
    <Portal>
      <Dialog dismissable onDismiss={onDismiss} visible>
        <Dialog.Title>{`Construct ${definition.name}?`}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.dialogDescription}>
            This confirms the construction cost before the facility is added to your company.
          </Text>
          <View style={styles.dialogSummary}>
            <PlaceholderRow label="Construction cost" value={formatCurrency(definition.constructionCost)} />
            <PlaceholderRow label="Balance after construction" value={formatCurrency(balanceAfterConstruction)} />
          </View>
          <Text variant="titleMedium" style={styles.dialogSectionHeading}>Available recipes</Text>
          {definition.recipes.map((recipe) => (
            <List.Item
              key={recipe.name}
              title={formatRecipeName(recipe)}
              description={`${formatRecipeInputs(recipe)} â†’ ${formatRecipeOutput(recipe)} Â· Work ${recipe.workAmount}`}
              left={(props) => <List.Icon {...props} icon="play-circle-outline" />}
            />
          ))}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button disabled={!canConstruct} mode="contained" onPress={onConfirm}>Confirm build</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

export function DestructionDialog({
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
            This permanently removes the facility from your company. Construction funds are not refunded.
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


