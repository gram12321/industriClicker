import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Menu, Text, TextInput } from 'react-native-paper';
import { getResource, getResourceIcon, RESOURCE_TYPES, type ResourceType } from '@/game/resources';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { APP_ICONS } from '@/icons';

export function InventoryControlCard({
  onSetInventoryAmount,
}: {
  onSetInventoryAmount: (resourceType: ResourceType, amount: number) => boolean;
}) {
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType>(RESOURCE_TYPES[0]);
  const [amountText, setAmountText] = useState('0');
  const [isResourceMenuOpen, setIsResourceMenuOpen] = useState(false);
  const [updatedResourceType, setUpdatedResourceType] = useState<ResourceType | null>(null);
  const selectedResource = getResource(selectedResourceType);
  const amount = Number(amountText);
  const isAmountValid = amountText.trim().length > 0 && Number.isFinite(amount) && amount >= 0;

  const setInventoryAmount = () => {
    if (isAmountValid && onSetInventoryAmount(selectedResourceType, amount)) {
      setUpdatedResourceType(selectedResourceType);
    }
  };

  return (
    <Card mode="contained" style={styles.featureCard}>
      <Card.Content style={styles.cardContent}>
        <Text style={styles.cardKicker}>INVENTORY</Text>
        <Text variant="titleLarge">Set inventory amount</Text>
        <Text style={styles.cardDescription}>Set the selected resource to any non-negative amount.</Text>
        <View style={styles.adminSalesOrderControls}>
          <Menu
            anchor={(
              <Button icon={() => <Text>{getResourceIcon(selectedResourceType)}</Text>} mode="outlined" onPress={() => setIsResourceMenuOpen(true)}>
                {selectedResource.name}
              </Button>
            )}
            onDismiss={() => setIsResourceMenuOpen(false)}
            visible={isResourceMenuOpen}
          >
            {RESOURCE_TYPES.map((resourceType) => (
              <Menu.Item
                key={resourceType}
                leadingIcon={() => <Text>{getResourceIcon(resourceType)}</Text>}
                onPress={() => { setSelectedResourceType(resourceType); setIsResourceMenuOpen(false); }}
                title={getResource(resourceType).name}
              />
            ))}
          </Menu>
          <TextInput
            accessibilityLabel="Inventory amount"
            dense
            keyboardType="decimal-pad"
            label="Amount"
            mode="outlined"
            onChangeText={(value) => setAmountText(value.replace(/[^0-9.]/g, ''))}
            style={styles.adminSalesOrderAmountInput}
            value={amountText}
          />
          <Button disabled={!isAmountValid} icon={APP_ICONS.pencil} mode="contained" onPress={setInventoryAmount}>
            Set amount
          </Button>
        </View>
        {updatedResourceType && (
          <Text style={styles.adminSuccessMessage}>
            {`Updated ${getResource(updatedResourceType).name} inventory.`}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}
