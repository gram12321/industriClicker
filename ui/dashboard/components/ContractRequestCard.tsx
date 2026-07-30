import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Menu, Text, TextInput } from 'react-native-paper';
import { getResourceIcon } from '@/game/resources/resourceIcons';
import { getResource } from '@/game/resources/resourcesRegistry';
import { RESOURCE_TYPES, type ResourceType } from '@/game/resources/resourceTypes';
import { SALES_CONTRACT_MAX_REQUEST_QUANTITY, SALES_CONTRACT_MIN_REQUEST_QUANTITY } from '@/game/sales/salesContracts';
import { styles } from '@/ui/dashboard/dashboard.styles';
import { APP_ICONS } from '@/icons';

export function ContractRequestCard({
  onCreateContractRequest,
}: {
  onCreateContractRequest: (resourceType: ResourceType, quantity: number) => boolean;
}) {
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType>(RESOURCE_TYPES[0]);
  const [quantityText, setQuantityText] = useState(String(SALES_CONTRACT_MIN_REQUEST_QUANTITY));
  const [isResourceMenuOpen, setIsResourceMenuOpen] = useState(false);
  const [createdResourceType, setCreatedResourceType] = useState<ResourceType | null>(null);
  const selectedResource = getResource(selectedResourceType);
  const quantity = Number(quantityText);
  const isQuantityValid = Number.isInteger(quantity)
    && quantity >= SALES_CONTRACT_MIN_REQUEST_QUANTITY
    && quantity <= SALES_CONTRACT_MAX_REQUEST_QUANTITY;

  const createRequest = () => {
    if (isQuantityValid && onCreateContractRequest(selectedResourceType, quantity)) {
      setCreatedResourceType(selectedResourceType);
    }
  };

  return (
    <Card mode="contained" style={styles.featureCard}>
      <Card.Content style={styles.cardContent}>
        <Text style={styles.cardKicker}>SALES</Text>
        <Text variant="titleLarge">Create contract request</Text>
        <Text style={styles.cardDescription}>
          Create an open customer request for a selected resource and amount.
        </Text>
        <View style={styles.adminContractControls}>
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
            accessibilityLabel="Contract request amount"
            dense
            keyboardType="number-pad"
            label={`Amount (${SALES_CONTRACT_MIN_REQUEST_QUANTITY}–${SALES_CONTRACT_MAX_REQUEST_QUANTITY})`}
            mode="outlined"
            onChangeText={(value) => setQuantityText(value.replace(/[^0-9]/g, ''))}
            style={styles.adminContractAmountInput}
            value={quantityText}
          />
          <Button disabled={!isQuantityValid} icon={APP_ICONS.add} mode="contained" onPress={createRequest}>
            Create request
          </Button>
        </View>
        {createdResourceType && (
          <Text style={styles.adminSuccessMessage}>
            {`Created an open request for ${getResource(createdResourceType).name}.`}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}
