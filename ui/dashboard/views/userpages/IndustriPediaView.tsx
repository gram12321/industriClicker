import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, List, Text } from 'react-native-paper';
import { FACILITY_GROUPS, getFacilityDefinition } from '@/game/facilities';
import { FINANCE_INITIAL_BALANCE } from '@/game/finance';
import { PRESTIGE_SALES_HALF_LIFE_FOREGROUND_HOURS } from '@/game/prestige';
import type { Market } from '@/game/market';
import { getResource, getResourceIcon, RESOURCE_GROUPS, RESOURCE_TYPES, ResourceType } from '@/game/resources';
import { formatCurrency, formatNumber, formatSigned } from '@/utils';
import { SectionHeading, WorkMetric } from '@/ui/dashboard/components/DashboardPrimitives';
import { formatRecipeInputs, formatRecipeName, formatRecipeOutput } from '@/ui/dashboard/helpers/recipeFormatters';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { APP_ICONS } from '@/icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme';

export function IndustriPediaView({ market }: { market: Market }) {
  const [activeSection, setActiveSection] = useState<IndustriPediaSection>('resources');

  return <>
    <SectionHeading eyebrow="INDUSTRIPEDIA" title="Company reference" subtitle="A quick reference for the systems currently available in your company." />
    <View style={localStyles.sectionTabs}>
      {INDUSTRIPEDIA_SECTIONS.map((section) => (
        <Button compact key={section.id} mode={activeSection === section.id ? 'contained' : 'outlined'} onPress={() => setActiveSection(section.id)}>
          {section.label}
        </Button>
      ))}
    </View>
    {activeSection === 'resources' && <ResourcesSection />}
    {activeSection === 'facilities' && <FacilitiesSection />}
    {activeSection === 'recipes' && <RecipesSection />}
    {activeSection === 'market-flow' && <MarketFlowSection market={market} />}
    {activeSection === 'finance' && <FinanceSection />}
    {activeSection === 'prestige' && <PrestigeSection />}
  </>;
}

type IndustriPediaSection = 'resources' | 'facilities' | 'recipes' | 'market-flow' | 'finance' | 'prestige';

const INDUSTRIPEDIA_SECTIONS: ReadonlyArray<{ id: IndustriPediaSection; label: string }> = [
  { id: 'resources', label: 'Resources' },
  { id: 'facilities', label: 'Facilities' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'market-flow', label: 'Market flow' },
  { id: 'finance', label: 'Finance' },
  { id: 'prestige', label: 'Prestige' },
];

function MarketFlowSection({ market }: { market: Market }) {
  const [selectedResource, setSelectedResource] = useState<(typeof RESOURCE_TYPES)[number]>(RESOURCE_TYPES[0]);
  const resource = getResource(selectedResource);
  const local = market.getLocalEntry(selectedResource);
  const global = market.getGlobalEntry(selectedResource);
  const details = market.getDiffusionDetails(selectedResource);
  const isToLocal = details.direction === 'to-local';
  const isToGlobal = details.direction === 'to-global';
  const flowColor = isToLocal ? colors.marketGreen : isToGlobal ? colors.marketGold : colors.muted;
  const flowIcon = isToLocal ? APP_ICONS.marketFlowToLocal : isToGlobal ? APP_ICONS.marketFlowToGlobal : APP_ICONS.marketBalanced;
  const pressureWidth = `${Math.min(details.priceGap * 50, 50)}%` as `${number}%`;
  const localBalanceDelta = details.localTargetSupply - local.supply;

  return <>
    <SectionHeading eyebrow="MARKET FLOW" title="Follow market balancing" subtitle="Prices guide resources between the local and global reservoirs once per minute." />
    <View style={localStyles.resourceTabs}>
      {RESOURCE_GROUPS.map((group) => <View key={group.id} style={localStyles.resourceGroupTabs}><Text style={styles.cardKicker}>{group.label}</Text><View style={localStyles.resourceGroupButtons}>{group.resources.map((resourceType) => <Button accessibilityLabel={getResource(resourceType).name} compact key={resourceType} mode={selectedResource === resourceType ? 'contained' : 'outlined'} onPress={() => setSelectedResource(resourceType)}>
        {`${getResourceIcon(resourceType)} ${getResource(resourceType).name}`}
      </Button>)}</View></View>)}
    </View>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={localStyles.flowCardContent}>
      <Text accessibilityLabel={resource.name} variant="titleMedium" style={localStyles.flowTitle}>{`${getResourceIcon(selectedResource)} ${resource.name}`}</Text>
      <MarketPool label="Global market" price={details.globalPrice} supply={global.supply} />
      <View accessibilityLabel={getFlowAccessibilityLabel(details.direction, details.amount)} style={localStyles.flowConnector}>
        <MaterialCommunityIcons color={flowColor} name={flowIcon as never} size={28} />
        <Text style={[localStyles.flowAmount, { color: flowColor }]}>{details.direction === 'none' ? 'Prices balanced' : `${formatNumber(details.amount, { smartDecimals: true })} / minute`}</Text>
        <Text style={localStyles.flowDirection}>{getFlowDescription(details.direction)}</Text>
      </View>
      <MarketPool label="Local market" price={details.localPrice} supply={local.supply} />
      <Text style={localStyles.priceGapText}>{details.direction === 'none' ? 'Local and global prices are equal.' : `Price gap: ${formatNumber(details.priceGap, { percent: true, decimals: 1 })}`}</Text>
      <View accessibilityLabel={`Price gap ${formatNumber(details.priceGap, { percent: true, decimals: 1 })}`} style={localStyles.balanceTrack}>
        <View style={localStyles.balanceCentre} />
        {details.direction !== 'none' && <View style={[localStyles.balanceFill, isToLocal ? localStyles.balanceFillToLocal : localStyles.balanceFillToGlobal, { width: pressureWidth, backgroundColor: flowColor }]} />}
      </View>
    </Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={localStyles.flowCardContent}>
      <Text style={styles.cardKicker}>BALANCE</Text>
      <BalanceRow label="Local target" value={formatNumber(details.localTargetSupply, { smartDecimals: true })} />
      <BalanceRow label="Global target" value={formatNumber(details.globalTargetSupply, { smartDecimals: true })} />
      <BalanceRow label="Local adjustment remaining" value={`${formatSigned(localBalanceDelta, { smartDecimals: true })} units`} />
      <BalanceRow label="Next correction" value={details.direction === 'none' ? 'None needed' : `${formatNumber(details.amount, { smartDecimals: true })} units`} />
    </Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={localStyles.accordionCardContent}>
      <List.Accordion left={(props) => <List.Icon {...props} icon={APP_ICONS.help} />} title="Why is it moving?">
        <View style={localStyles.accordionBody}>
          <Text style={styles.cardDescription}>{getFlowDescription(details.direction)}</Text>
          <BalanceRow label="Local price" value={<CurrencyValue value={details.localPrice} />} />
          <BalanceRow label="Global price" value={<CurrencyValue value={details.globalPrice} />} />
          <BalanceRow label="Price ratio" value={formatNumber(details.priceRatio, { decimals: 3, forceDecimals: true })} />
        </View>
      </List.Accordion>
      <List.Accordion left={(props) => <List.Icon {...props} icon={APP_ICONS.globalMarket} />} title="Diffusion factors">
        <View style={localStyles.accordionBody}>
          <BalanceRow label="Logistics" value={`${formatNumber(details.logisticsMultiplier, { decimals: 2, forceDecimals: true })}×`} />
          <BalanceRow label="Value density" value={`${formatNumber(details.valueDensityMultiplier, { decimals: 2, forceDecimals: true })}×`} />
          <BalanceRow label="Market urgency" value={`${formatNumber(details.marketUrgencyMultiplier, { decimals: 2, forceDecimals: true })}×`} />
          <Text style={styles.cardDescription}>Logistics covers transport and storage. Value density reflects how worthwhile the resource is to move. Urgency responds to the current price level.</Text>
        </View>
      </List.Accordion>
      <List.Accordion left={(props) => <List.Icon {...props} icon={APP_ICONS.settings} />} title="Formula and safeguards">
        <View style={localStyles.accordionBody}>
          <Text style={localStyles.formula}>base × price gap × nonlinear response × logistics × value density × urgency</Text>
          <BalanceRow label="Raw request" value={`${formatNumber(details.rawAmount, { smartDecimals: true })} units`} />
          <BalanceRow label="After equilibrium cap" value={`${formatNumber(details.equilibriumCappedAmount, { smartDecimals: true })} units`} />
          <BalanceRow label="Next correction" value={`${formatNumber(details.amount, { smartDecimals: true })} units`} />
          <Text style={styles.cardDescription}>A tick moves no more than half the remaining distance to current price equilibrium, and can never move more than the available source supply.</Text>
        </View>
      </List.Accordion>
    </Card.Content></Card>
  </>;
}

function MarketPool({ label, price, supply }: { label: string; price: number; supply: number }) {
  return <View style={localStyles.marketPool}>
    <Text style={localStyles.marketPoolLabel}>{label}</Text>
    <Text style={localStyles.marketPoolSupply}>{formatNumber(supply, { smartDecimals: true })}</Text>
    <CurrencyValue value={price} style={localStyles.marketPoolPrice} />
  </View>;
}

function BalanceRow({ label, value }: { label: string; value: ReactNode }) {
  return <View style={localStyles.balanceRow}><Text style={localStyles.balanceLabel}>{label}</Text><View style={localStyles.balanceValueContainer}>{typeof value === 'string' ? <Text style={styles.balanceValue}>{value}</Text> : value}</View></View>;
}

function CurrencyValue({ value, style }: { value: number; style?: object }) {
  return <View style={localStyles.iconValue}><MaterialCommunityIcons color={colors.muted} name={APP_ICONS.coin} size={14} /><Text style={style}>{formatCurrency(value).replace(/\s*€/u, '')}</Text></View>;
}

function getFlowDescription(direction: 'to-local' | 'to-global' | 'none'): string {
  if (direction === 'to-local') return 'The local price is higher, so the global market supplies the local market.';
  if (direction === 'to-global') return 'The global price is higher, so the local market supplies the global market.';
  return 'Local and global prices are balanced, so no market flow is needed.';
}

function getFlowAccessibilityLabel(direction: 'to-local' | 'to-global' | 'none', amount: number): string {
  if (direction === 'none') return 'Market prices are balanced.';
  return `${getFlowDescription(direction)} Next correction ${formatNumber(amount, { smartDecimals: true })} units per minute.`;
}

function ResourcesSection() {
  return <>
    <SectionHeading eyebrow="RESOURCES" title="Resource catalogue" subtitle="Resources are held in inventory and can be produced, consumed, or supplied to customers." />
    <Card mode="contained" style={styles.featureCard}><Card.Content><List.Section>
      {RESOURCE_GROUPS.map((group) => <View key={group.id}><Text style={styles.cardKicker}>{group.label}</Text>{group.resources.map((resourceType) => {
        const resource = getResource(resourceType);
        const initialPrice = resource.market.localBenchmarkSupply / resource.market.localInitialSupply;
        return <List.Item description={<View><Text style={styles.cardDescription}>{getResourceSummary(resourceType)}</Text><View style={localStyles.iconValue}><Text style={localStyles.resourceMarketSeed}>Initial price</Text><CurrencyValue value={initialPrice} style={localStyles.resourceMarketSeed} /><Text style={localStyles.resourceMarketSeed}>· Initial local supply: {formatNumber(resource.market.localInitialSupply, { smartDecimals: true })}</Text></View></View>} key={resourceType} left={(props) => <List.Icon {...props} icon={APP_ICONS.package} />} title={<Text accessibilityLabel={resource.name} style={localStyles.resourceTitle}>{getResourceIcon(resourceType)} {resource.name}</Text>} />;
      })}</View>)}
      <List.Item description="Quality belongs to each inventory entry. Its value is currently a placeholder until quality rules are designed." left={(props) => <List.Icon {...props} icon={APP_ICONS.quality} />} title="Resource quality" />
    </List.Section></Card.Content></Card>
  </>;
}

function FacilitiesSection() {
  return <>
    <SectionHeading eyebrow="FACILITIES" title="Facility catalogue" subtitle="Build one or more facilities, then select an available recipe for each to begin production." />
    <FacilityConditionReference />
    <FacilityUpgradeReference />
    {FACILITY_GROUPS.map((group) => <View key={group.id} style={localStyles.catalogueGroup}><Text style={styles.cardKicker}>{group.label}</Text>{group.facilities.map((facilityType) => {
      const facility = getFacilityDefinition(facilityType);
      return <Card key={facilityType} mode="contained" style={styles.featureCard}><Card.Content><List.Item
        description={<View style={localStyles.facilityCostSummary}><View style={localStyles.iconValue}><Text style={styles.cardDescription}>Land:</Text><CurrencyValue value={facility.landCost} style={styles.cardDescription} /></View><View style={localStyles.iconValue}><Text style={styles.cardDescription}>Materials:</Text><Text style={styles.cardDescription}>{getResourceIcon(ResourceType.ConstructionMaterials)} {formatNumber(facility.constructionMaterialsCost)}</Text><Text style={styles.cardDescription}>· {facility.baseWorkers} base workers</Text></View></View>}
        left={(props) => <List.Icon {...props} icon={facility.icon} />}
        title={facility.name}
      />
        <Text style={styles.cardKicker}>AVAILABLE RECIPES</Text>
        {facility.recipes.map((recipe) => <Text key={recipe.name} style={styles.cardDescription}>{formatRecipeName(recipe)}: {formatRecipeInputs(recipe, { includeNames: false })} → {formatRecipeOutput(recipe, { includeNames: false })}</Text>)}
      </Card.Content></Card>;
    })}</View>)}
  </>;
}

function FacilityConditionReference() {
  return <Card mode="contained" style={styles.featureCard}><Card.Content style={localStyles.conditionReferenceContent}>
    <Text style={styles.cardKicker}>FACILITY EFFICIENCY</Text>
    <Text style={styles.cardDescription}>Wear is fastest at high condition and slows as a facility approaches zero. One 1.00-work production cycle has almost the same base wear as one foreground minute.</Text>
    <Text style={localStyles.formula}>Staff efficiency: 0.01 + 0.99 × ratio^1.6 when understaffed; 1 + 0.25 × (1 − e^(−0.7 × (ratio − 1))) when overstaffed.</Text>
    <Text style={localStyles.formula}>Facility efficiency: staff efficiency × (1 − condition curve(1 − facility condition)); damage becomes increasingly costly.</Text>
    <Text style={localStyles.formula}>Repair cost: {getResourceIcon(ResourceType.ConstructionMaterials)} construction-material cost × 0.9 × (1 − facility condition).</Text>
    <View style={localStyles.conditionTableRow}>
      <Text style={[localStyles.conditionTableCell, localStyles.conditionTableHeader]}>Time</Text>
      <Text style={[localStyles.conditionTableCell, localStyles.conditionTableHeader]}>1.00 cycles</Text>
      <Text style={[localStyles.conditionTableCell, localStyles.conditionTableHeader]}>Passive</Text>
      <Text style={[localStyles.conditionTableCell, localStyles.conditionTableHeader]}>Production</Text>
    </View>
    {FACILITY_CONDITION_REFERENCE.map((entry) => <View key={entry.time} style={localStyles.conditionTableRow}>
      <Text style={localStyles.conditionTableCell}>{entry.time}</Text>
      <Text style={localStyles.conditionTableCell}>{entry.cycles}</Text>
      <Text style={localStyles.conditionTableCell}>{entry.passiveCondition}</Text>
      <Text style={localStyles.conditionTableCell}>{entry.productionCondition}</Text>
    </View>)}
  </Card.Content></Card>;
}

function FacilityUpgradeReference() {
  return <Card mode="contained" style={styles.featureCard}><Card.Content style={localStyles.conditionReferenceContent}>
    <View style={localStyles.upgradeReferenceHeading}><MaterialCommunityIcons color={colors.primary} name={APP_ICONS.upgrade} size={16} /><Text style={styles.cardKicker}>FACILITY UPGRADES</Text></View>
    <Text style={styles.cardDescription}>Each facility has its own Speed, Output, and Condition upgrade tracks. Every new level costs more than the previous one.</Text>
    <Text style={styles.cardDescription}>Speed upgrades complete production work faster. Output upgrades produce more from each finished cycle. Both raise the facility's worker requirement.</Text>
    <Text style={styles.cardDescription}>Condition upgrades slow both passive and production wear without requiring more workers. Each level helps less than the last, but fully developed maintenance can reduce decay by almost 75%.</Text>
    <Text style={styles.cardKicker}>EXAMPLE LEVELS</Text>
    <UpgradeExample icon={APP_ICONS.speed} label="Speed" values="L0 x1.00 → L1 x1.16 → L5 x1.53" />
    <UpgradeExample icon={APP_ICONS.output} label="Output" values="L0 x1.00 → L1 x1.16 → L5 x1.59" />
    <UpgradeExample icon="shield-check-outline" label="Condition decay" values="L0 x1.00 → L1 x0.88 → L5 x0.55" />
  </Card.Content></Card>;
}

function UpgradeExample({ icon, label, values }: { icon: string; label: string; values: string }) {
  return <View style={localStyles.upgradeExample}><MaterialCommunityIcons color={colors.primary} name={icon as never} size={15} /><Text style={styles.cardDescription}><Text style={localStyles.upgradeExampleLabel}>{label}</Text>: {values}</Text></View>;
}

const FACILITY_CONDITION_REFERENCE = [
  { time: 'Start', cycles: '0', passiveCondition: '100.00%', productionCondition: '100.00%' },
  { time: '1 h', cycles: '60', passiveCondition: '90.11%', productionCondition: '90.11%' },
  { time: '2 h', cycles: '120', passiveCondition: '80.50%', productionCondition: '80.49%' },
  { time: '4 h', cycles: '240', passiveCondition: '62.58%', productionCondition: '62.57%' },
  { time: '6 h', cycles: '360', passiveCondition: '47.61%', productionCondition: '47.59%' },
  { time: '10 h', cycles: '600', passiveCondition: '26.26%', productionCondition: '26.23%' },
  { time: '20 h', cycles: '1,200', passiveCondition: '5.86%', productionCondition: '5.84%' },
  { time: '40 h', cycles: '2,400', passiveCondition: '0.29%', productionCondition: '0.29%' },
  { time: '60 h', cycles: '3,600', passiveCondition: '0.01%', productionCondition: '0.01%' },
] as const;

function RecipesSection() {
  return <>
    <SectionHeading eyebrow="RECIPES" title="Production recipes" subtitle="Inputs are paid at the start of each cycle. A facility pauses when the required inputs are unavailable." />
    {FACILITY_GROUPS.map((group) => <View key={group.id} style={localStyles.catalogueGroup}><Text style={styles.cardKicker}>{group.label}</Text>{group.facilities.map((facilityType) => {
      const facility = getFacilityDefinition(facilityType);
      const recipes = [...facility.recipes].sort((left, right) => formatRecipeName(left).localeCompare(formatRecipeName(right)));
      return <Card key={facilityType} mode="contained" style={styles.featureCard}><Card.Content><Text style={localStyles.catalogueGroupTitle}>{facility.name}</Text><List.Section>
        {recipes.map((recipe) => <List.Item
          description={<View><Text style={styles.cardDescription}>{`${formatRecipeInputs(recipe, { includeNames: false })} → ${formatRecipeOutput(recipe, { includeNames: false })}`}</Text><WorkMetric value={formatNumber(recipe.requiredWork, { smartDecimals: true })} /></View>}
          key={recipe.name}
          left={(props) => <List.Icon {...props} icon={APP_ICONS.production} />}
          title={formatRecipeName(recipe)}
        />)}
      </List.Section></Card.Content></Card>;
    })}</View>)}
  </>;
}

function FinanceSection() {
  return <>
    <SectionHeading eyebrow="FINANCE" title="Company funds" subtitle="Euros purchase facility land and fund upgrades; customer contracts earn them." />
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
      <Text style={styles.cardKicker}>STARTING CAPITAL</Text><CurrencyValue value={FINANCE_INITIAL_BALANCE} style={styles.balanceValue} />
      <Text style={styles.cardDescription}>A facility needs both its land purchase and Construction Materials. Destroying a facility refunds neither.</Text>
    </Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content><List.Item description={<View style={localStyles.iconValue}><Text>Each fulfilled unit pays</Text><CurrencyValue value={1} /><Text>. The requested quantity must be fully available in inventory before a contract can be supplied.</Text></View>} left={(props) => <List.Icon {...props} icon={APP_ICONS.contracts} />} title="Customer contracts" /><List.Item description="Each facility has separate Speed and Output upgrades. The next level costs more than the previous one." left={(props) => <List.Icon {...props} icon={APP_ICONS.speed} />} title="Facility upgrades" /><List.Item description="Every accepted cost and income is recorded in the Finance activity list." left={(props) => <List.Icon {...props} icon={APP_ICONS.financeHistory} />} title="Transaction history" /></Card.Content></Card>
  </>;
}

function PrestigeSection() {
  return <>
    <SectionHeading eyebrow="PRESTIGE" title="Company standing" subtitle="How company standing is recorded and fades over time." />
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}><Text style={styles.cardKicker}>WHAT IT IS</Text><Text style={styles.cardDescription}>Prestige is an informational company-standing score. It does not affect production, pricing, or customer offers yet.</Text></Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content><List.Item description="A permanent, recalculated source based on current company cash." left={(props) => <List.Icon {...props} icon={APP_ICONS.bank} />} title="Company balance" /><List.Item description={`Each fulfilled contract creates a fading event. Its half-life is ${formatNumber(PRESTIGE_SALES_HALF_LIFE_FOREGROUND_HOURS, { smartDecimals: true })} active hours.`} left={(props) => <List.Icon {...props} icon={APP_ICONS.contracts} />} title="Contract sales" /></Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}><Text style={styles.cardKicker}>DECAY</Text><Text style={styles.cardDescription}>Prestige decay uses active game time. Background time does not decay prestige; Fast-forward does.</Text><Text style={styles.cardDescription}>For a fading event: current = original × 0.5^(active hours ÷ half-life). Select an event in the Prestige dialog to see its original value, current value, hourly decay, and projections.</Text></Card.Content></Card>
  </>;
}

function ResourceMention({ resourceType }: { resourceType: string }) {
  const typedResource = resourceType as ResourceType;
  return <Text accessibilityLabel={getResource(typedResource).name}>{getResourceIcon(typedResource)}</Text>;
}

function getResourceSummary(resourceType: (typeof RESOURCE_TYPES)[number]): ReactNode {
  switch (resourceType) {
    case 'grain': return <Text>Raw crop used to bake <ResourceMention resourceType="bread" /> and <ResourceMention resourceType="cake" />.</Text>;
    case 'bread': return <Text>Baked product made from <ResourceMention resourceType="grain" />, <ResourceMention resourceType="water" />, and <ResourceMention resourceType="electricity" />.</Text>;
    case 'water': return 'Utility resource used across the production chain.';
    case 'electricity': return 'Utility resource used to power production recipes.';
    case 'sugar': return <Text>Farm-grown ingredient used to bake <ResourceMention resourceType="cake" />.</Text>;
    case 'coal': return 'Mined fuel used by the Coal Power recipe.';
    case 'iron': return <Text>Mined metal used to produce <ResourceMention resourceType="steel" />.</Text>;
    case 'copper': return <Text>Mined conductor used to produce <ResourceMention resourceType="electric-circuits" />.</Text>;
    case 'steel': return <Text>Processed metal made from <ResourceMention resourceType="iron" /> and <ResourceMention resourceType="coal" />.</Text>;
    case 'electric-circuits': return <Text>Electronic component made from <ResourceMention resourceType="sand" />, <ResourceMention resourceType="copper" />, <ResourceMention resourceType="water" />, and <ResourceMention resourceType="electricity" />.</Text>;
    case 'bricks': return <Text>Construction units made from <ResourceMention resourceType="clay" /> and <ResourceMention resourceType="sand" />.</Text>;
    case 'cement': return <Text>Construction binder made from <ResourceMention resourceType="stone" /> and <ResourceMention resourceType="clay" />.</Text>;
    case 'reinforced-concrete': return <Text>Structural composite made from <ResourceMention resourceType="cement" />, <ResourceMention resourceType="stone" />, <ResourceMention resourceType="sand" />, and <ResourceMention resourceType="steel" />.</Text>;
    case 'construction-materials': return <Text>Finished construction bundle made from <ResourceMention resourceType="bricks" />, <ResourceMention resourceType="reinforced-concrete" />, <ResourceMention resourceType="steel" />, and <ResourceMention resourceType="sand" />.</Text>;
    case 'sand': return <Text>Quarried material used as the current silicon source for <ResourceMention resourceType="electric-circuits" />.</Text>;
    case 'clay': return 'Quarried material for future construction recipes.';
    case 'stone': return 'Quarried material for future construction recipes.';
    case 'cake': return <Text>Baked product made from <ResourceMention resourceType="grain" />, <ResourceMention resourceType="sugar" />, <ResourceMention resourceType="water" />, and <ResourceMention resourceType="electricity" />.</Text>;
    default: return 'Tracked in your company inventory.';
  }
}

const localStyles = StyleSheet.create({
  accordionBody: { gap: 10, paddingBottom: 12, paddingHorizontal: 16 },
  accordionCardContent: { paddingHorizontal: 0, paddingVertical: 0 },
  balanceCentre: { backgroundColor: colors.muted, bottom: 0, left: '50%', position: 'absolute', top: 0, width: 2 },
  balanceFill: { bottom: 0, position: 'absolute', top: 0 },
  balanceFillToGlobal: { right: '50%' },
  balanceFillToLocal: { left: '50%' },
  balanceLabel: { color: colors.muted, flex: 1, fontSize: 12 },
  balanceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  balanceTrack: { backgroundColor: '#E4ECE8', borderRadius: 6, height: 8, overflow: 'hidden', position: 'relative' },
  balanceValue: { color: colors.charcoal, fontSize: 13, fontWeight: '700' },
  flowAmount: { fontSize: 18, fontWeight: '800' },
  flowCardContent: { gap: 10 },
  flowConnector: { alignItems: 'center', gap: 2, paddingVertical: 6 },
  flowDirection: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  flowTitle: { color: colors.charcoal, fontWeight: '700', textAlign: 'center' },
  formula: { color: colors.charcoal, fontFamily: 'monospace', fontSize: 12, lineHeight: 19 },
  marketPool: { alignItems: 'center', backgroundColor: colors.softBackground, borderRadius: 16, gap: 2, padding: 12 },
  marketPoolLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  marketPoolPrice: { color: colors.marketGold, fontSize: 13, fontWeight: '700' },
  resourceMarketSeed: { color: colors.muted, fontSize: 12, marginTop: 3 },
  marketPoolSupply: { color: colors.charcoal, fontSize: 20, fontWeight: '800' },
  priceGapText: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  resourceTabs: { gap: 8, paddingBottom: 4 },
  resourceGroupTabs: { gap: 4, width: '100%' },
  resourceGroupButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4 },
  conditionReferenceContent: { gap: 8 },
  upgradeReferenceHeading: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  upgradeExample: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  upgradeExampleLabel: { color: colors.charcoal, fontWeight: '700' },
  catalogueGroup: { gap: 8 },
  catalogueGroupTitle: { color: colors.charcoal, fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginTop: 4 },
  balanceValueContainer: { alignItems: 'flex-end' },
  facilityCostSummary: { gap: 2 },
  iconValue: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  resourceTitle: { fontSize: 16 },
  conditionTableRow: { flexDirection: 'row', gap: 4 },
  conditionTableCell: { color: colors.charcoal, flex: 1, fontSize: 10, textAlign: 'right' },
  conditionTableHeader: { color: colors.muted, fontSize: 9, fontWeight: '700' },
});
