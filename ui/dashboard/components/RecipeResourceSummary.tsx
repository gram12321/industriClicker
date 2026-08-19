import { View } from 'react-native';
import { Text } from 'react-native-paper';
import type { Recipe } from '@/game/recipes';
import { getResource } from '@/game/resources';
import { formatNumber } from '@/utils';
import { TooltipResourceIcon } from '@/ui/dashboard/components/IconTooltip';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';

export function RecipeResourceSummary({ outputMultiplier = 1, recipe }: { outputMultiplier?: number; recipe: Recipe }) {
  return <View style={styles.facilityResourceSummary}>
    <View style={styles.facilityResourceGroup}><Text style={styles.facilityResourceLabel}>Input</Text><View style={styles.facilityResourceItems}>{recipe.inputs.length === 0 ? <Text style={styles.facilityResourceEmpty}>-</Text> : recipe.inputs.map((input) => <Text key={input.resourceType} accessibilityLabel={`${getResource(input.resourceType).name} ${formatNumber(input.amount, { smartDecimals: true })}`} style={styles.facilityResourceValue}><TooltipResourceIcon resourceType={input.resourceType} /> {formatNumber(input.amount, { smartDecimals: true })}</Text>)}</View></View>
    <Text style={styles.facilityResourceArrow}>-&gt;</Text>
    <View style={styles.facilityResourceGroup}><Text style={styles.facilityResourceLabel}>Output</Text><View style={styles.facilityResourceItems}>{recipe.outputs.map((output) => <Text key={output.resourceType} accessibilityLabel={`${getResource(output.resourceType).name} ${formatNumber(output.amount * outputMultiplier, { smartDecimals: true })}`} style={[styles.facilityResourceValue, styles.facilityResourceOutput]}><TooltipResourceIcon resourceType={output.resourceType} /> {formatNumber(output.amount * outputMultiplier, { smartDecimals: true })}</Text>)}</View></View>
  </View>;
}
