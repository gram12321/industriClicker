import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Menu, Text, TextInput } from 'react-native-paper';
import { getResource, getResourceIcon, RESOURCE_TYPES, type ResourceType } from '@/game/resources';
import { SALES_ORDER_MAXIMUM_QUANTITY, SALES_ORDER_MINIMUM_QUANTITY } from '@/game/sales';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { APP_ICONS } from '@/icons';

export function SalesOrderRequestCard({
  onCreateSalesOrderRequest,
}: {
  onCreateSalesOrderRequest: (resourceType: ResourceType, quantity: number) => boolean;
}) {
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType>(RESOURCE_TYPES[0]);
  const [quantityText, setQuantityText] = useState(String(SALES_ORDER_MINIMUM_QUANTITY));
  const [isResourceMenuOpen, setIsResourceMenuOpen] = useState(false);
  const [createdResourceType, setCreatedResourceType] = useState<ResourceType | null>(null);
  const selectedResource = getResource(selectedResourceType);
  const quantity = Number(quantityText);
  const isQuantityValid = Number.isInteger(quantity)
    && quantity >= SALES_ORDER_MINIMUM_QUANTITY
    && quantity <= SALES_ORDER_MAXIMUM_QUANTITY;

  const createRequest = () => {
    if (isQuantityValid && onCreateSalesOrderRequest(selectedResourceType, quantity)) {
      setCreatedResourceType(selectedResourceType);
    }
  };

  return (
    <Card mode="contained" style={styles.featureCard}>
      <Card.Content style={styles.cardContent}>
        <Text style={styles.cardKicker}>SALES</Text>
        <Text variant="titleLarge">Create customer order</Text>
        <Text style={styles.cardDescription}>
          Create a development customer order for a selected resource and amount.
        </Text>
        <View style={styles.adminSalesOrderControls}>
          <Menu
            anchor={(
              <Button icon={APP_ICONS.expand} mode="outlined" onPress={() => setIsResourceMenuOpen(true)}>
                {`${getResourceIcon(selectedResourceType)} ${selectedResource.name}`}
              </Button>
            )}
            onDismiss={() => setIsResourceMenuOpen(false)}
            visible={isResourceMenuOpen}
          >
            {RESOURCE_TYPES.map((resourceType) => {
              const resource = getResource(resourceType);

              return (
                <Menu.Item
                  key={resourceType}
                  onPress={() => { setSelectedResourceType(resourceType); setIsResourceMenuOpen(false); }}
                  title={`${getResourceIcon(resourceType)} ${resource.name}`}
                />
              );
            })}
          </Menu>
          <TextInput
            accessibilityLabel="Customer order amount"
            dense
            keyboardType="number-pad"
            label={`Amount (${SALES_ORDER_MINIMUM_QUANTITY}–${SALES_ORDER_MAXIMUM_QUANTITY})`}
            mode="outlined"
            onChangeText={(value) => setQuantityText(value.replace(/[^0-9]/g, ''))}
            style={styles.adminSalesOrderAmountInput}
            value={quantityText}
          />
          <Button disabled={!isQuantityValid} icon={APP_ICONS.add} mode="contained" onPress={createRequest}>
            Create order
          </Button>
        </View>
        {createdResourceType && (
          <Text style={styles.adminSuccessMessage}>
            {`Created an open order for ${getResource(createdResourceType).name}.`}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}
