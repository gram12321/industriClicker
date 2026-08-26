import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Menu, Text, TextInput } from 'react-native-paper';
import { getResource, RESOURCE_TYPES, type ResourceType } from '@/game/resources';
import { SALES_ORDER_MAXIMUM_QUANTITY, SALES_ORDER_MINIMUM_QUANTITY } from '@/game/sales';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { APP_ICONS } from '@/icons';
import { TooltipResourceIcon } from '@/ui/dashboard/components/IconTooltip';

export function SalesOrderRequestCard({
  onCreateSalesOrderRequest,
}: {
  onCreateSalesOrderRequest: (resourceType: ResourceType, quantity: number, quality: number) => boolean;
}) {
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType>(RESOURCE_TYPES[0]);
  const [quantityText, setQuantityText] = useState(String(SALES_ORDER_MINIMUM_QUANTITY));
  const [qualityText, setQualityText] = useState('1');
  const [isResourceMenuOpen, setIsResourceMenuOpen] = useState(false);
  const [createdResourceType, setCreatedResourceType] = useState<ResourceType | null>(null);
  const selectedResource = getResource(selectedResourceType);
  const quantity = Number(quantityText);
  const quality = Number(qualityText);
  const isQuantityValid = Number.isInteger(quantity)
    && quantity >= SALES_ORDER_MINIMUM_QUANTITY
    && quantity <= SALES_ORDER_MAXIMUM_QUANTITY;
  const isQualityValid = qualityText.trim().length > 0 && Number.isFinite(quality) && quality > 0;

  const createRequest = () => {
    if (isQuantityValid && isQualityValid && onCreateSalesOrderRequest(selectedResourceType, quantity, quality)) {
      setCreatedResourceType(selectedResourceType);
    }
  };

  return (
    <Card mode="contained" style={styles.featureCard}>
      <Card.Content style={styles.cardContent}>
        <Text style={styles.cardKicker}>SALES</Text>
        <Text variant="titleLarge">Create customer order</Text>
        <Text style={styles.cardDescription}>
          Create a development customer order for a selected resource, amount, and locked quality.
        </Text>
        <View style={styles.adminSalesOrderControls}>
          <Menu
            anchor={(
              <Button icon={() => <TooltipResourceIcon resourceType={selectedResourceType} />} mode="outlined" onPress={() => setIsResourceMenuOpen(true)}>
                {selectedResource.name}
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
                  leadingIcon={() => <TooltipResourceIcon resourceType={resourceType} />}
                  onPress={() => { setSelectedResourceType(resourceType); setIsResourceMenuOpen(false); }}
                  title={resource.name}
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
          <TextInput
            accessibilityLabel="Customer order quality"
            dense
            keyboardType="decimal-pad"
            label="Quality"
            mode="outlined"
            onChangeText={(value) => setQualityText(value.replace(/[^0-9.]/g, ''))}
            style={styles.adminSalesOrderAmountInput}
            value={qualityText}
          />
          <Button disabled={!isQuantityValid || !isQualityValid} icon={APP_ICONS.add} mode="contained" onPress={createRequest}>
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
