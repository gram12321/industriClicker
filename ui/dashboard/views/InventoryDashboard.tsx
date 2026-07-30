import { getResourceIcon } from '@/game/resources/resourceIcons';
import { RESOURCE_TYPES } from '@/game/resources/resourceTypes';
import { getResource } from '@/game/resources/resourcesRegistry';
import type { Inventory } from '@/game/inventory/inventory';
import { formatNumber } from '@/utils';
import { PlaceholderRow, SectionHeading } from '../components/DashboardViewComponents';

export function InventoryDashboard({ inventory }: { inventory: Inventory }) {
  return (
    <>
      <SectionHeading eyebrow="STOCK" title="Inventory" subtitle="Review the resources currently held by your company." />
      {RESOURCE_TYPES.map((resourceType) => {
        const resource = getResource(resourceType);
        const entry = inventory.getEntry(resourceType);

        return (
          <PlaceholderRow
            key={resourceType}
            label={`${getResourceIcon(resourceType)} ${resource.name}`}
            value={`${formatNumber(entry.quantity, { smartDecimals: true })} \u20AC · Quality ${formatNumber(entry.quality, { smartDecimals: true })}`}
          />
        );
      })}
    </>
  );
}
