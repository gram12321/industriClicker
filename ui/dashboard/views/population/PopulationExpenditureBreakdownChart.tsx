import { useWindowDimensions, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import Svg, { Circle, Path } from 'react-native-svg';
import type { ResourceGroup } from '@/game/resources';
import { colors } from '@/theme';
import { formatCurrency, formatPercent } from '@/utils';

type Props = {
  entries: readonly PopulationExpenditureBreakdown[];
};

type PopulationExpenditureBreakdown = {
  id: ResourceGroup;
  label: string;
  projectedPurchaseCost: number;
  expenditureShare: number;
};

const DOMAIN_APPEARANCE = {
  food: { backgroundColor: '#E0F4E7', color: '#179C51', icon: 'food-apple-outline' },
  'raw-resources': { backgroundColor: '#FFF0DA', color: '#C66A0A', icon: 'pickaxe' },
  construction: { backgroundColor: '#FFE8DE', color: '#D85F2C', icon: 'crane' },
  intermediates: { backgroundColor: '#E8F1FF', color: '#4169A1', icon: 'flask-outline' },
  manufacturing: { backgroundColor: '#EEE5FF', color: '#7A4FD5', icon: 'factory' },
  utilities: { backgroundColor: '#E1ECFC', color: '#3476D4', icon: 'transmission-tower' },
} as const;

const DONUT_SIZE = 164;
const DONUT_CENTER = DONUT_SIZE / 2;
const DONUT_RADIUS = 54;

function pointOnDonut(angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: DONUT_CENTER + DONUT_RADIUS * Math.cos(radians),
    y: DONUT_CENTER + DONUT_RADIUS * Math.sin(radians),
  };
}

function describeDonutArc(startAngle: number, endAngle: number): string {
  const start = pointOnDonut(startAngle);
  const end = pointOnDonut(endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${DONUT_RADIUS} ${DONUT_RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

/** Mobile-first donut and cards for a projected population expenditure split. */
export function PopulationExpenditureBreakdownChart({ entries }: Props) {
  const { width } = useWindowDimensions();
  const visibleEntries = entries.filter((entry) => entry.projectedPurchaseCost > 0 && entry.expenditureShare > 0);
  const isWideLayout = width >= 620;
  let segmentStartAngle = 0;
  const segments = visibleEntries.map((entry) => {
    const sweep = entry.expenditureShare * 360;
    const gap = Math.min(2, Math.max(0, sweep - 0.5));
    const segment = {
      ...entry,
      startAngle: segmentStartAngle + gap / 2,
      endAngle: segmentStartAngle + sweep - gap / 2,
      sweep: sweep - gap,
    };
    segmentStartAngle += sweep;
    return segment;
  });

  if (visibleEntries.length === 0) {
    return <View style={localStyles.emptyState}>
      <Text style={localStyles.emptyText}>No projected expenditure exists until population demand has a local purchase cost.</Text>
    </View>;
  }

  return <View style={[localStyles.layout, isWideLayout && localStyles.wideLayout]}>
    <View accessibilityLabel="Projected expenditure share by resource domain" style={localStyles.donutWrap}>
      <Svg height={DONUT_SIZE} width={DONUT_SIZE}>
        <Circle cx={DONUT_CENTER} cy={DONUT_CENTER} fill="none" r={DONUT_RADIUS} stroke="#E8EFEB" strokeWidth={22} />
        {segments.map((segment) => segment.sweep >= 359.5 ? <Circle
          cx={DONUT_CENTER}
          cy={DONUT_CENTER}
          fill="none"
          key={segment.id}
          r={DONUT_RADIUS}
          stroke={DOMAIN_APPEARANCE[segment.id].color}
          strokeWidth={22}
        /> : <Path
          d={describeDonutArc(segment.startAngle, segment.endAngle)}
          fill="none"
          key={segment.id}
          stroke={DOMAIN_APPEARANCE[segment.id].color}
          strokeWidth={22}
        />)}
      </Svg>
      <View pointerEvents="none" style={localStyles.donutCenter}>
        <Text style={localStyles.donutLabel}>Spending</Text>
        <Text style={localStyles.donutValue}>{formatCurrency(visibleEntries.reduce((total, entry) => total + entry.projectedPurchaseCost, 0))}</Text>
      </View>
    </View>
    <View style={localStyles.entries}>
      {visibleEntries.map((entry) => {
        const appearance = DOMAIN_APPEARANCE[entry.id];
        return <View key={entry.id} style={[localStyles.entry, { backgroundColor: appearance.backgroundColor }]}>
          <View style={localStyles.entryLabelWrap}>
            <MaterialCommunityIcons color={appearance.color} name={appearance.icon} size={19} />
            <Text style={[localStyles.entryLabel, { color: appearance.color }]}>{entry.label}</Text>
          </View>
          <View>
            <Text style={[localStyles.entryValue, { color: appearance.color }]}>{formatCurrency(entry.projectedPurchaseCost)}</Text>
            <Text style={[localStyles.entryShare, { color: appearance.color }]}>{formatPercent(entry.expenditureShare, { decimals: 1 })}</Text>
          </View>
        </View>;
      })}
    </View>
  </View>;
}

const localStyles = StyleSheet.create({
  donutCenter: { alignItems: 'center', justifyContent: 'center', left: 28, position: 'absolute', right: 28, top: 57 },
  donutLabel: { color: colors.charcoal, fontSize: 12, fontWeight: '800' },
  donutValue: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  donutWrap: { alignItems: 'center', justifyContent: 'center', minWidth: DONUT_SIZE },
  emptyState: { alignItems: 'center', backgroundColor: '#F5F8F6', borderRadius: 10, padding: 14 },
  emptyText: { color: colors.muted, textAlign: 'center' },
  entries: { flex: 1, gap: 8, minWidth: 0, width: '100%' },
  entry: { alignItems: 'center', borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', minHeight: 54, paddingHorizontal: 12, paddingVertical: 8 },
  entryLabel: { fontWeight: '800' },
  entryLabelWrap: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 8, minWidth: 0 },
  entryShare: { fontSize: 11, fontWeight: '600', textAlign: 'right' },
  entryValue: { fontWeight: '800', textAlign: 'right' },
  layout: { alignItems: 'center', gap: 16 },
  wideLayout: { alignItems: 'center', flexDirection: 'row' },
});
