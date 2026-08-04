import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, List, Text } from 'react-native-paper';
import { FACILITY_TYPES, getFacilityDefinition } from '@/game/facilities/facilityConstants';
import { FINANCE_INITIAL_BALANCE } from '@/game/finance/financeConstants';
import { PRESTIGE_SALES_HALF_LIFE_FOREGROUND_HOURS } from '@/game/prestige/prestigeConstants';
import { ALL_RECIPES } from '@/game/recipes/recipeConstants';
import { formatRecipeInputs, formatRecipeName, formatRecipeOutput } from '@/ui/dashboard/helpers/recipeFormatters';
import type { Market } from '@/game/market';
import { getResource, getResourceIcon, RESOURCE_TYPES } from '@/game/resources/resourceConstants';
import { formatCurrency, formatNumber, formatSigned } from '@/utils';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { SectionHeading, WorkMetric } from '../../components/GameViewComponents';
import { APP_ICONS } from '@/icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme';

export function IndustriPediaView({ market }: { market: Market }) {
  const [activeSection, setActiveSection] = useState<IndustriPediaSection>('resources');

  return <>
    <SectionHeading eyebrow="INDUSTRIPEDIA" title="Company reference" subtitle="A quick reference for the systems currently available in your company." />
    <ScrollView contentContainerStyle={localStyles.sectionTabs} horizontal showsHorizontalScrollIndicator={false}>
      {INDUSTRIPEDIA_SECTIONS.map((section) => (
        <Button compact key={section.id} mode={activeSection === section.id ? 'contained' : 'outlined'} onPress={() => setActiveSection(section.id)}>
          {section.label}
        </Button>
      ))}
    </ScrollView>
    {activeSection === 'resources' && <ResourcesSection />}
    {activeSection === 'buildings' && <BuildingsSection />}
    {activeSection === 'recipes' && <RecipesSection />}
    {activeSection === 'market-flow' && <MarketFlowSection market={market} />}
    {activeSection === 'finance' && <FinanceSection />}
    {activeSection === 'prestige' && <PrestigeSection />}
  </>;
}

type IndustriPediaSection = 'resources' | 'buildings' | 'recipes' | 'market-flow' | 'finance' | 'prestige';

const INDUSTRIPEDIA_SECTIONS: ReadonlyArray<{ id: IndustriPediaSection; label: string }> = [
  { id: 'resources', label: 'Resources' },
  { id: 'buildings', label: 'Buildings' },
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
    <ScrollView contentContainerStyle={localStyles.resourceTabs} horizontal showsHorizontalScrollIndicator={false}>
      {RESOURCE_TYPES.map((resourceType) => <Button compact key={resourceType} mode={selectedResource === resourceType ? 'contained' : 'outlined'} onPress={() => setSelectedResource(resourceType)}>
        {`${getResourceIcon(resourceType)} ${getResource(resourceType).name}`}
      </Button>)}
    </ScrollView>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={localStyles.flowCardContent}>
      <Text variant="titleMedium" style={localStyles.flowTitle}>{`${getResourceIcon(selectedResource)} ${resource.name}`}</Text>
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
          <BalanceRow label="Local price" value={formatCurrency(details.localPrice)} />
          <BalanceRow label="Global price" value={formatCurrency(details.globalPrice)} />
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
    <Text style={localStyles.marketPoolPrice}>{formatCurrency(price)}</Text>
  </View>;
}

function BalanceRow({ label, value }: { label: string; value: string }) {
  return <View style={localStyles.balanceRow}><Text style={localStyles.balanceLabel}>{label}</Text><Text style={localStyles.balanceValue}>{value}</Text></View>;
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
      {RESOURCE_TYPES.map((resourceType) => {
        const resource = getResource(resourceType);
        const initialPrice = resource.market.localBenchmarkSupply / resource.market.localInitialSupply;
        return <List.Item description={<View><Text style={styles.cardDescription}>{getResourceSummary(resourceType)}</Text><Text style={localStyles.resourceMarketSeed}>{`Initial price: ${formatCurrency(initialPrice)} · Initial local supply: ${formatNumber(resource.market.localInitialSupply, { smartDecimals: true })}`}</Text></View>} key={resourceType} left={(props) => <List.Icon {...props} icon={APP_ICONS.package} />} title={`${getResourceIcon(resourceType)} ${resource.name}`} />;
      })}
      <List.Item description="Quality belongs to each inventory entry. Its value is currently a placeholder until quality rules are designed." left={(props) => <List.Icon {...props} icon={APP_ICONS.quality} />} title="Resource quality" />
    </List.Section></Card.Content></Card>
  </>;
}

function BuildingsSection() {
  return <>
    <SectionHeading eyebrow="BUILDINGS" title="Facility catalogue" subtitle="Build a facility once, then select one of its available recipes to begin production." />
    {FACILITY_TYPES.map((facilityType) => {
      const facility = getFacilityDefinition(facilityType);
      return <Card key={facilityType} mode="contained" style={styles.featureCard}><Card.Content><List.Item
        description={`${formatCurrency(facility.constructionCost)} construction · ${facility.baseWorkers} base workers`}
        left={(props) => <List.Icon {...props} icon={facility.icon} />}
        title={facility.name}
      />
        <Text style={styles.cardKicker}>AVAILABLE RECIPES</Text>
        {facility.recipes.map((recipe) => <Text key={recipe.name} style={styles.cardDescription}>{formatRecipeName(recipe)}: {formatRecipeInputs(recipe)} → {formatRecipeOutput(recipe)}</Text>)}
      </Card.Content></Card>;
    })}
  </>;
}

function RecipesSection() {
  return <>
    <SectionHeading eyebrow="RECIPES" title="Production recipes" subtitle="Inputs are paid at the start of each cycle. A facility pauses when the required inputs are unavailable." />
    <Card mode="contained" style={styles.featureCard}><Card.Content><List.Section>
      {Object.values(ALL_RECIPES).map((recipe) => <List.Item
        description={<View><Text style={styles.cardDescription}>{`${formatRecipeInputs(recipe)} → ${formatRecipeOutput(recipe)}`}</Text><WorkMetric value={formatNumber(recipe.workAmount, { smartDecimals: true })} /></View>}
        key={recipe.name}
        left={(props) => <List.Icon {...props} icon={APP_ICONS.production} />}
        title={formatRecipeName(recipe)}
      />)}
    </List.Section></Card.Content></Card>
  </>;
}

function FinanceSection() {
  return <>
    <SectionHeading eyebrow="FINANCE" title="Company funds" subtitle="Euros fund construction and upgrades, and are earned by fulfilling customer contracts." />
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
      <Text style={styles.cardKicker}>STARTING CAPITAL</Text><Text style={styles.balanceValue}>{formatCurrency(FINANCE_INITIAL_BALANCE)}</Text>
      <Text style={styles.cardDescription}>Facilities can only be constructed when the full construction cost is available. Destroying a facility does not refund its cost.</Text>
    </Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content><List.Item description="Each fulfilled unit pays €1. The requested quantity must be fully available in inventory before a contract can be supplied." left={(props) => <List.Icon {...props} icon={APP_ICONS.contracts} />} title="Customer contracts" /><List.Item description="Each facility has separate Speed and Output upgrades. The next level costs more than the previous one." left={(props) => <List.Icon {...props} icon={APP_ICONS.speed} />} title="Facility upgrades" /><List.Item description="Every accepted cost and income is recorded in the Finance activity list." left={(props) => <List.Icon {...props} icon={APP_ICONS.financeHistory} />} title="Transaction history" /></Card.Content></Card>
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

function getResourceSummary(resourceType: (typeof RESOURCE_TYPES)[number]): string {
  switch (resourceType) {
    case 'grain': return 'Raw crop used to bake Bread and Cake.';
    case 'bread': return 'Baked product made from Grain, Water, and Electricity.';
    case 'water': return 'Utility resource used across the production chain.';
    case 'electricity': return 'Utility resource used to power production recipes.';
    case 'sugar': return 'Farm-grown ingredient used to bake Cake.';
    case 'coal': return 'Mined fuel used by the Coal Power recipe.';
    case 'iron': return 'Mined material used by future metalworking recipes.';
    case 'copper': return 'Mined material used by future electrical recipes.';
    case 'sand': return 'Quarried material for future construction recipes.';
    case 'clay': return 'Quarried material for future construction recipes.';
    case 'stone': return 'Quarried material for future construction recipes.';
    case 'cake': return 'Baked product made from Grain, Sugar, Water, and Electricity.';
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
  sectionTabs: { gap: 8, paddingBottom: 4 },
});
