import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { getResource, getResourceIcon, RESOURCE_TYPES } from '@/game/resources';
import type { Inventory } from '@/game/inventory';
import { APP_ICONS } from '@/icons';
import { formatNumber } from '@/utils';
import { SectionHeading } from '@/ui/dashboard/components/DashboardPrimitives';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';

export function InventoryView({ inventory }: { inventory: Inventory }) {
  return (
    <>
      <SectionHeading eyebrow="STOCK" title="Inventory" subtitle="Review the resources currently held by your company." />
      {RESOURCE_TYPES.map((resourceType) => {
        const resource = getResource(resourceType);
        const entry = inventory.getEntry(resourceType);

        return <View key={resourceType} accessibilityLabel={`${resource.name}: ${formatNumber(entry.quantity, { smartDecimals: true })} units, quality ${formatNumber(entry.quality, { smartDecimals: true })}`} style={styles.detailRow}>
          <Text variant="bodyLarge">{`${getResourceIcon(resourceType)} ${resource.name}`}</Text>
          <View style={styles.inventoryQualityValue}>
            <Text style={styles.detailValue}>{`${formatNumber(entry.quantity, { smartDecimals: true })} €`}</Text>
            <MaterialCommunityIcons color={styles.workMetricIcon.color} name={APP_ICONS.quality} size={16} />
            <Text style={styles.detailValue}>{formatNumber(entry.quality, { smartDecimals: true })}</Text>
          </View>
        </View>;
      })}
    </>
  );
}
