import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, List, Menu, Text } from 'react-native-paper';
import { FACILITY_GROUPS, getFacilityDefinition } from '@/game/facilities';
import { FINANCE_INITIAL_BALANCE } from '@/game/company/companyConstants';
import { ECONOMY_INTEREST_MULTIPLIERS, ECONOMY_PHASES, type EconomyPhase } from '@/game/finance';
import { PRESTIGE_SALES_HALF_LIFE_FOREGROUND_HOURS } from '@/game/prestige';
import type { Market, MarketDiffusionDetails } from '@/game/market';
import { getResource, RESOURCE_GROUPS, RESOURCE_TYPES, ResourceType } from '@/game/resources';
import { formatCurrency, formatNumber, formatSigned, formatSignedPercent, getColorClass, normalizeToUnitInterval } from '@/utils';
import { SectionHeading, WorkMetric } from '@/ui/dashboard/components/DashboardPrimitives';
import { formatRecipeName } from '@/ui/dashboard/helpers/recipeFormatters';
import { RecipeResourceSummary } from '@/ui/dashboard/components/RecipeResourceSummary';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { APP_ICONS, RECIPE_ICONS, SALES_CUSTOMER_DOMAIN_ICONS, SALES_CUSTOMER_TYPE_ICONS } from '@/icons';
import { TooltipMaterialIcon, TooltipResourceIcon, TooltipTextIcon } from '@/ui/dashboard/components/IconTooltip';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { SALES_CUSTOMER_BID_MULTIPLIER_RANGE, SALES_CUSTOMER_DOMAIN_PROFILES, SALES_CUSTOMER_DOMAINS, SALES_CUSTOMER_PURCHASING_POWER_RANGE, SALES_CUSTOMER_TYPE_PROFILES, SALES_CUSTOMER_TYPES, SALES_ECONOMY_MULTIPLIERS, calculateSalesCustomerRelationshipDetails, getSalesCustomerRelationshipLabel, getSalesCustomerCatalogue, getSalesResourceProfile, type SalesCustomerDefinition, type SalesCustomerDomain, type SalesCustomerType, type SalesOrders } from '@/game/sales';


export function IndustriPediaView({ companyPrestige, currentGameTimeMs, economyPhase, initialSection = 'resources', market, salesOrders }: { companyPrestige: number; currentGameTimeMs: number; economyPhase: EconomyPhase; initialSection?: IndustriPediaSection; market: Market; salesOrders: SalesOrders }) {
  const [activeSection, setActiveSection] = useState<IndustriPediaSection>(initialSection);

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
    {activeSection === 'economy' && <EconomySection economyPhase={economyPhase} />}
    {activeSection === 'loans' && <LoansSection />}
    {activeSection === 'prestige' && <PrestigeSection />}
    {activeSection === 'achievements' && <AchievementsSection />}
    {activeSection === 'customer-domains' && <CustomerDomainsSection />}
    {activeSection === 'customer-types' && <CustomerTypesSection />}
    {activeSection === 'customers' && <CustomersSection companyPrestige={companyPrestige} currentGameTimeMs={currentGameTimeMs} salesOrders={salesOrders} />}
  </>;
}

type IndustriPediaSection = 'resources' | 'facilities' | 'recipes' | 'market-flow' | 'finance' | 'economy' | 'loans' | 'prestige' | 'achievements' | 'customer-domains' | 'customer-types' | 'customers';

const INDUSTRIPEDIA_SECTIONS: ReadonlyArray<{ id: IndustriPediaSection; label: string }> = [
  { id: 'resources', label: 'Resources' },
  { id: 'facilities', label: 'Facilities' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'market-flow', label: 'Market flow' },
  { id: 'finance', label: 'Finance' },
  { id: 'economy', label: 'Economy' },
  { id: 'loans', label: 'Loans' },
  { id: 'prestige', label: 'Prestige' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'customer-domains', label: 'Customer domains' },
  { id: 'customer-types', label: 'Customer types' },
  { id: 'customers', label: 'Customers' },
];

const CUSTOMER_DOMAIN_METRIC_ICONS = {
  bidRange: APP_ICONS.bid,
  frequency: APP_ICONS.elapsedTime,
  marketPressure: APP_ICONS.globalMarket,
  relationshipGain: APP_ICONS.relationship,
  resources: APP_ICONS.package,
  shareScale: APP_ICONS.marketShare,
  targetValue: APP_ICONS.currency,
} as const;

function CustomerDomainsSection() {
  return <>
    <SectionHeading eyebrow="CUSTOMER DOMAINS" title="Who buys your goods" subtitle="Domains replace Winemaker countries. Customer types separately control buying behaviour, scope, and bundle appetite." />
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
      <Text style={styles.cardKicker}>DOMAIN PROFILE KEY</Text>
      <TypeProfileKey icon={CUSTOMER_DOMAIN_METRIC_ICONS.bidRange} text="Bid range: the domain's starting range against the global reference price, before buyer and company effects." />
      <TypeProfileKey icon={CUSTOMER_DOMAIN_METRIC_ICONS.targetValue} text="Base target value: the starting intended order value before prestige and relationship scaling." />
      <TypeProfileKey icon={CUSTOMER_DOMAIN_METRIC_ICONS.frequency} text="Frequency: how often the domain contributes to new-offer rolls." />
      <TypeProfileKey icon={CUSTOMER_DOMAIN_METRIC_ICONS.shareScale} text="Share scale: how large this domain's generated customers tend to be." />
      <TypeProfileKey icon={CUSTOMER_DOMAIN_METRIC_ICONS.relationshipGain} text="Relationship gain: multiplier applied to fulfilled-order relationship growth." />
      <TypeProfileKey icon={CUSTOMER_DOMAIN_METRIC_ICONS.marketPressure} text="Global supply pressure: shortages modestly raise requested volume; oversupply can create larger volume offers. The company-value cap still applies." />
      <TypeProfileKey icon={CUSTOMER_DOMAIN_METRIC_ICONS.resources} text="Resource icons: resources sold through this domain; each number is its standard sales lot." />
    </Card.Content></Card>
    {SALES_CUSTOMER_DOMAINS.map((domain) => {
      const profile = SALES_CUSTOMER_DOMAIN_PROFILES[domain];
      const resources = RESOURCE_TYPES.filter((resourceType) => getSalesResourceProfile(resourceType).domain === domain);
      return <Card key={domain} mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
        <View style={localStyles.customerTypeHeading}><TooltipMaterialIcon color={colors.primary} label={profile.label} name={SALES_CUSTOMER_DOMAIN_ICONS[domain]} size={20} /><Text variant="titleMedium">{profile.label}</Text></View>
        <View style={localStyles.customerDomainResources}>{resources.map((resourceType) => <Text accessibilityLabel={getResource(resourceType).name + ', standard lot ' + formatNumber(getSalesResourceProfile(resourceType).standardOrderLot)} key={resourceType} style={localStyles.customerDomainResource}><TooltipResourceIcon resourceType={resourceType} /> {formatNumber(getSalesResourceProfile(resourceType).standardOrderLot)}</Text>)}</View>
        <View style={localStyles.customerTypeMetrics}>
          <CustomerTypeMetric icon={CUSTOMER_DOMAIN_METRIC_ICONS.bidRange} label="Bid range" value={formatNumber(profile.bidRange[0] * 100, { decimals: 0 }) + '%–' + formatNumber(profile.bidRange[1] * 100, { decimals: 0 }) + '%'} />
          <CustomerTypeMetric icon={CUSTOMER_DOMAIN_METRIC_ICONS.targetValue} label="Base target value" value={formatCurrency(profile.targetOrderValue[0]) + '–' + formatCurrency(profile.targetOrderValue[1])} />
          <CustomerTypeMetric icon={CUSTOMER_DOMAIN_METRIC_ICONS.frequency} label="Frequency" value={formatNumber(profile.frequency, { smartDecimals: true }) + '×'} />
          <CustomerTypeMetric icon={CUSTOMER_DOMAIN_METRIC_ICONS.shareScale} label="Share scale" value={formatNumber(profile.marketShareMultiplier, { smartDecimals: true }) + '×'} />
          <CustomerTypeMetric icon={CUSTOMER_DOMAIN_METRIC_ICONS.relationshipGain} label="Relationship gain" value={formatNumber(profile.relationshipGainMultiplier, { smartDecimals: true }) + '×'} />
        </View>
      </Card.Content></Card>;
    })}
  </>;
}


const CUSTOMER_TYPE_METRIC_ICONS = {
  bundleAppetite: APP_ICONS.package,
  crossDomain: 'source-branch',
  globalPremium: APP_ICONS.globalMarket,
  marketShare: APP_ICONS.marketShare,
  targetValue: APP_ICONS.currency,
} as const;

function CustomerTypesSection() {
  return <>
    <SectionHeading eyebrow="CUSTOMER TYPES" title="How customers buy" subtitle="Types control buyer behaviour and operating-domain scope; they are not a progression ladder." />
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
      <Text style={styles.cardKicker}>TYPE PROFILE KEY</Text>
      <TypeProfileKey icon={CUSTOMER_TYPE_METRIC_ICONS.marketShare} text="Market share tendency: lower values create more, smaller buyers; higher values allow larger buyers." />
      <TypeProfileKey icon={CUSTOMER_TYPE_METRIC_ICONS.crossDomain} text="Cross-domain tendency: chance that this buyer also orders from another compatible domain." />
      <TypeProfileKey icon={CUSTOMER_TYPE_METRIC_ICONS.bundleAppetite} text="Bundle appetite: tendency to request several resources in one order." />
      <TypeProfileKey icon={CUSTOMER_TYPE_METRIC_ICONS.targetValue} text="Target value tendency: how much the type raises or lowers an order's intended value." />
      <TypeProfileKey icon={CUSTOMER_TYPE_METRIC_ICONS.globalPremium} text="Baseline global premium: the type's starting bid adjustment against the global reference price." />
    </Card.Content></Card>
    {SALES_CUSTOMER_TYPES.map((customerType) => {
      const profile = SALES_CUSTOMER_TYPE_PROFILES[customerType];
      const operatingDomainLabels = profile.allowedOperatingDomains.map((domain) => SALES_CUSTOMER_DOMAIN_PROFILES[domain].label).join(', ');
      return <Card key={customerType} mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
        <View style={localStyles.customerTypeHeading}><TooltipMaterialIcon color={colors.primary} label={profile.label} name={SALES_CUSTOMER_TYPE_ICONS[customerType]} size={20} /><Text variant="titleMedium">{profile.label}</Text></View>
        <Text style={styles.cardDescription}>{profile.description}</Text>
        <View accessibilityLabel={'Operating domains: ' + operatingDomainLabels} style={localStyles.customerTypeDomains}>{profile.allowedOperatingDomains.map((domain) => <TooltipMaterialIcon label={SALES_CUSTOMER_DOMAIN_PROFILES[domain].label} color={colors.muted} key={domain} name={SALES_CUSTOMER_DOMAIN_ICONS[domain]} size={16} />)}</View>
        <View style={localStyles.customerTypeMetrics}>
          <CustomerTypeMetric icon={CUSTOMER_TYPE_METRIC_ICONS.marketShare} label="Market share tendency" value={formatNumber(profile.marketShareScale, { smartDecimals: true }) + '×'} />
          <CustomerTypeMetric icon={CUSTOMER_TYPE_METRIC_ICONS.crossDomain} label="Cross-domain tendency" value={formatNumber(profile.crossDomainChance * 100, { decimals: 0 }) + '%'} />
          <CustomerTypeMetric icon={CUSTOMER_TYPE_METRIC_ICONS.bundleAppetite} label="Bundle appetite" value={formatNumber(profile.bundleAppetite * 100, { decimals: 0 }) + '%'} />
          <CustomerTypeMetric icon={CUSTOMER_TYPE_METRIC_ICONS.targetValue} label="Target value tendency" value={formatNumber(profile.targetValueMultiplier[0], { smartDecimals: true }) + '×–' + formatNumber(profile.targetValueMultiplier[1], { smartDecimals: true }) + '×'} />
          <CustomerTypeMetric icon={CUSTOMER_TYPE_METRIC_ICONS.globalPremium} label="Baseline global premium" value={'+' + formatNumber(profile.globalPremiumBaseline * 100, { smartDecimals: true }) + '%'} />
        </View>
      </Card.Content></Card>;
    })}
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}><Text style={styles.cardKicker}>BUNDLE RULE</Text><Text style={styles.cardDescription}>Every line must already be available in meaningful inventory lots. Prestige, relationship, market share, and type appetite create a skewed breadth: one line is common, wide bundles are rare, and only the extreme late-game tail reaches all compatible resources.</Text></Card.Content></Card>
  </>;
}

function TypeProfileKey({ icon, text }: { icon: string; text: string }) {
  return <View style={localStyles.typeProfileKey}><TooltipMaterialIcon color={colors.primary} label={text} name={icon} size={15} /><Text style={styles.salesAvailability}>{text}</Text></View>;
}

function CustomerTypeMetric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <View accessibilityLabel={label + ': ' + value} style={localStyles.customerTypeMetric}><TooltipMaterialIcon color={colors.muted} label={label} name={icon} size={15} /><Text style={styles.salesAvailability}>{value}</Text></View>;
}

function CustomersSection({ companyPrestige, currentGameTimeMs, salesOrders }: { companyPrestige: number; currentGameTimeMs: number; salesOrders: SalesOrders }) {
  const [selectedDomain, setSelectedDomain] = useState<SalesCustomerDomain | 'all'>('all');
  const [selectedType, setSelectedType] = useState<SalesCustomerType | 'all'>('all');
  const [knownOnly, setKnownOnly] = useState(false);
  const [sortKey, setSortKey] = useState<CustomerSortKey>('marketShare');
  const [sortDescending, setSortDescending] = useState(true);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const customerStates = new Map(salesOrders.getCustomerStates().map((state) => [state.customerId, state]));
  const rejectedCounts = new Map<string, number>();
  for (const order of salesOrders.getCompletedOrders()) if (order.status === 'rejected') rejectedCounts.set(order.customerId, (rejectedCounts.get(order.customerId) ?? 0) + 1);
  const catalogue = salesOrders.getCustomerCatalogue();
  const customers = catalogue
    .filter((customer) => (selectedDomain === 'all' || customer.domain === selectedDomain) && (selectedType === 'all' || customer.customerType === selectedType) && (!knownOnly || customerStates.has(customer.id)))
    .map((customer) => ({ customer, state: customerStates.get(customer.id), rejected: rejectedCounts.get(customer.id) ?? 0, relationship: salesOrders.getCustomerState(customer.id, currentGameTimeMs, companyPrestige).relationship }))
    .sort((left, right) => {
      const difference = getCustomerSortValue(left, sortKey) - getCustomerSortValue(right, sortKey);
      return (sortDescending ? -1 : 1) * difference || left.customer.name.localeCompare(right.customer.name);
    });
  const sortLabel = CUSTOMER_SORT_OPTIONS.find((option) => option.key === sortKey)?.label ?? 'Market share';
  return <>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}><Text style={styles.cardKicker}>CUSTOMER DIRECTORY</Text><Text variant="titleMedium">{`${formatNumber(customers.length)} of ${formatNumber(catalogue.length)} buyers`}</Text><Text style={styles.cardDescription}>A list of available customers. Tap a customer to see its buying profile, relationship, and order history.</Text><View style={localStyles.directoryHint}><TooltipMaterialIcon color={colors.muted} label="Purchasing power" name={APP_ICONS.purchasingPower} size={15} /><Text style={styles.salesAvailability}>Purchasing power = typical spending capacity. Bid profile = how far this customer's offer tends to move from the global reference price. Red-to-green shows each value within its own range.</Text></View></Card.Content></Card>
    <View style={localStyles.controlGroup}><Text style={styles.cardKicker}>FILTERS</Text><Text style={localStyles.controlLabel}>CUSTOMER TYPE</Text><View style={localStyles.directoryControls}><Menu visible={typeMenuVisible} onDismiss={() => setTypeMenuVisible(false)} anchor={<Button compact mode={selectedType === 'all' ? 'outlined' : 'contained'} icon={() => <MaterialCommunityIcons color={selectedType === 'all' ? colors.primary : colors.surface} name={selectedType === 'all' ? 'account-group-outline' : SALES_CUSTOMER_TYPE_ICONS[selectedType]} size={15} />} onPress={() => setTypeMenuVisible(true)}>{selectedType === 'all' ? 'All customer types' : SALES_CUSTOMER_TYPE_PROFILES[selectedType].label}</Button>}>{<Menu.Item leadingIcon="account-group-outline" title="All customer types" onPress={() => { setSelectedType('all'); setTypeMenuVisible(false); }} />}{SALES_CUSTOMER_TYPES.map((customerType) => <Menu.Item key={customerType} leadingIcon={SALES_CUSTOMER_TYPE_ICONS[customerType] as never} title={SALES_CUSTOMER_TYPE_PROFILES[customerType].label} onPress={() => { setSelectedType(customerType); setTypeMenuVisible(false); }} />)}</Menu><Button compact mode={knownOnly ? 'contained' : 'outlined'} onPress={() => setKnownOnly((value) => !value)}>{knownOnly ? 'Known only' : 'Show known'}</Button></View><Text style={localStyles.controlLabel}>DOMAIN</Text><View style={localStyles.sectionTabs}><Button compact mode={selectedDomain === 'all' ? 'contained' : 'outlined'} onPress={() => setSelectedDomain('all')}>All domains</Button>{SALES_CUSTOMER_DOMAINS.map((domain) => <Button compact key={domain} mode={selectedDomain === domain ? 'contained' : 'outlined'} icon={() => <MaterialCommunityIcons color={selectedDomain === domain ? colors.surface : colors.primary} name={SALES_CUSTOMER_DOMAIN_ICONS[domain] as never} size={15} />} onPress={() => setSelectedDomain(domain)}>{SALES_CUSTOMER_DOMAIN_PROFILES[domain].label}</Button>)}</View></View>
    <View style={localStyles.controlGroup}><Text style={styles.cardKicker}>SORTING</Text><View style={localStyles.directoryControls}><Menu visible={sortMenuVisible} onDismiss={() => setSortMenuVisible(false)} anchor={<Button compact mode="outlined" icon="sort" onPress={() => setSortMenuVisible(true)}>{`Sort: ${sortLabel}`}</Button>}>{CUSTOMER_SORT_OPTIONS.map((option) => <Menu.Item key={option.key} leadingIcon={option.icon as never} title={option.label} onPress={() => { setSortKey(option.key); setSortMenuVisible(false); }} />)}</Menu><Button compact mode="outlined" icon={sortDescending ? 'sort-ascending' : 'sort-descending'} onPress={() => setSortDescending((value) => !value)}>{sortDescending ? 'High first' : 'Low first'}</Button></View></View>
    {customers.map(({ customer, state, rejected, relationship }) => { const isExpanded = expandedCustomerId === customer.id; const relationshipDetails = calculateSalesCustomerRelationshipDetails(customer, companyPrestige); return <Card key={customer.id} mode="contained" style={styles.featureCard}><Pressable accessibilityLabel={`${isExpanded ? 'Hide' : 'Show'} details for ${customer.name}`} accessibilityRole="button" accessibilityState={{ expanded: isExpanded }} onPress={() => setExpandedCustomerId((current) => current === customer.id ? null : customer.id)}><Card.Content style={styles.cardContent}><View style={localStyles.customerHeader}><View style={localStyles.customerTitle}><View style={localStyles.customerTypeHeading}><TooltipMaterialIcon color={colors.primary} label={SALES_CUSTOMER_TYPE_PROFILES[customer.customerType].label} name={SALES_CUSTOMER_TYPE_ICONS[customer.customerType]} size={18} /><Text variant="titleMedium">{customer.name}</Text></View><View style={localStyles.customerSubheader}><TooltipMaterialIcon color={colors.muted} label={SALES_CUSTOMER_DOMAIN_PROFILES[customer.domain].label} name={SALES_CUSTOMER_DOMAIN_ICONS[customer.domain]} size={14} /><Text style={styles.cardDescription}>{SALES_CUSTOMER_DOMAIN_PROFILES[customer.domain].label}</Text><TooltipMaterialIcon color={colors.muted} label={SALES_CUSTOMER_TYPE_PROFILES[customer.customerType].label} name={SALES_CUSTOMER_TYPE_ICONS[customer.customerType]} size={14} /><Text style={styles.cardDescription}>{SALES_CUSTOMER_TYPE_PROFILES[customer.customerType].label}</Text></View></View><MaterialCommunityIcons color={colors.muted} name={isExpanded ? 'chevron-up' : 'chevron-down'} size={22} /></View><CustomerStats customer={customer} isExpanded={isExpanded} relationship={relationship} rejected={rejected} state={state} />{isExpanded && <RelationshipExplanation details={relationshipDetails} relationship={relationship} />}</Card.Content></Pressable></Card>; })}
  </>;
}

type CustomerSortKey = 'marketShare' | 'purchasingPower' | 'bidProfile' | 'relationship' | 'fulfilled' | 'rejected' | 'expired';
const CUSTOMER_SORT_OPTIONS: ReadonlyArray<{ key: CustomerSortKey; label: string; icon: string }> = [
  { key: 'marketShare', label: 'Market share', icon: APP_ICONS.marketShare },
  { key: 'purchasingPower', label: 'Purchasing power', icon: APP_ICONS.purchasingPower },
  { key: 'bidProfile', label: 'Bid profile', icon: APP_ICONS.bid },
  { key: 'relationship', label: 'Relationship', icon: APP_ICONS.relationship },
  { key: 'fulfilled', label: 'Fulfilled', icon: APP_ICONS.fulfilled },
  { key: 'rejected', label: 'Rejected', icon: APP_ICONS.rejected },
  { key: 'expired', label: 'Expired', icon: APP_ICONS.expired },
];

function CustomerStats({ customer, isExpanded, relationship, rejected, state }: { customer: SalesCustomerDefinition; isExpanded: boolean; relationship: number; rejected: number; state: ReturnType<SalesOrders['getCustomerStates']>[number] | undefined }) {
  const relationshipColor = getColorClass(relationship);
  const purchasingPowerColor = getColorClass(normalizeToUnitInterval(customer.purchasingPower, ...SALES_CUSTOMER_PURCHASING_POWER_RANGE));
  const bidColor = getColorClass(normalizeToUnitInterval(customer.bidMultiplier, ...SALES_CUSTOMER_BID_MULTIPLIER_RANGE));
  return <>
    <View style={localStyles.metricRow}><Metric color={getColorClass(customer.marketShare)} icon={APP_ICONS.marketShare} label="Share" value={`${formatNumber(customer.marketShare * 100, { smartDecimals: true })}%`} /><Metric color={relationshipColor} icon={APP_ICONS.relationship} label="Relationship" suffix={getSalesCustomerRelationshipLabel(relationship)} value={`${formatNumber(relationship * 100, { smartDecimals: true })}`} /></View>
    {isExpanded && <><View style={localStyles.metricRow}><Metric color={purchasingPowerColor} icon={APP_ICONS.purchasingPower} label="PP" value={`${formatNumber(customer.purchasingPower * 100, { decimals: 0 })}%`} /><Metric color={bidColor} icon={APP_ICONS.bid} label="Bid" value={`${formatNumber(customer.bidMultiplier * 100, { decimals: 0 })}%`} /></View><View style={localStyles.metricRow}><Metric icon={APP_ICONS.fulfilled} label="Fulfilled" value={formatNumber(state?.fulfilledOrderCount ?? 0)} /><Metric icon={APP_ICONS.rejected} label="Rejected" value={formatNumber(rejected)} /><Metric icon={APP_ICONS.expired} label="Expired" value={formatNumber(state?.expiredOrderCount ?? 0)} /></View></>}
  </>;
}

function RelationshipExplanation({ details, relationship }: { details: ReturnType<typeof calculateSalesCustomerRelationshipDetails>; relationship: number }) {
  const orderHistory = relationship - details.baseline;
  return <View style={localStyles.customerDetails}>
    <Text style={styles.cardKicker}>RELATIONSHIP</Text>
    <Text style={styles.salesAvailability}>{`Reputation baseline: ${formatNumber(details.prestigeBonus * 100, { smartDecimals: true })} prestige recognition − ${formatNumber(details.marketSharePenalty * 100, { smartDecimals: true })} larger-account adjustment = ${formatNumber(details.baseline * 100, { smartDecimals: true })}`}</Text>
    <Text style={styles.salesAvailability}>{`Order history: ${formatSigned(orderHistory * 100, { smartDecimals: true })}. Completed orders build it; rejected and expired orders reduce it.`}</Text>
    <Text style={styles.salesAvailability}>{`Current relationship: ${formatNumber(relationship * 100, { smartDecimals: true })} = ${formatNumber(details.baseline * 100, { smartDecimals: true })} reputation ${formatSigned(orderHistory * 100, { smartDecimals: true })} order history.`}</Text>
    <Text style={styles.salesAvailability}>{`Order history fades toward the reputation baseline, halfway every ${formatNumber(details.decayHalfLifeHours, { smartDecimals: true })} hours. Rejection: −${formatNumber(details.minimumFailureLoss * 100, { smartDecimals: true })} to −${formatNumber(details.maximumRejectionLoss * 100, { smartDecimals: true })} · Expiry: −${formatNumber(details.minimumFailureLoss * 100, { smartDecimals: true })} to −${formatNumber(details.maximumExpiryLoss * 100, { smartDecimals: true })}.`}</Text>
  </View>;
}

function getCustomerSortValue(view: { customer: SalesCustomerDefinition; state: ReturnType<SalesOrders['getCustomerStates']>[number] | undefined; rejected: number; relationship: number }, key: CustomerSortKey): number {
  switch (key) {
    case 'marketShare': return view.customer.marketShare;
    case 'purchasingPower': return view.customer.purchasingPower;
    case 'bidProfile': return view.customer.bidMultiplier;
    case 'relationship': return view.relationship;
    case 'fulfilled': return view.state?.fulfilledOrderCount ?? 0;
    case 'rejected': return view.rejected;
    case 'expired': return view.state?.expiredOrderCount ?? 0;
  }
}

function Metric({ color = colors.muted, icon, label, suffix, value }: { color?: string; icon: string; label: string; suffix?: string; value: string }) {
  return <View style={localStyles.metric}><TooltipMaterialIcon color={colors.muted} label={label} name={icon} size={14} /><Text style={styles.salesAvailability}>{`${label}: `}<Text style={{ color }}>{value}</Text>{suffix && <Text>{` · ${suffix}`}</Text>}</Text></View>;
}

function MarketFlowSection({ market }: { market: Market }) {
  const [selectedResource, setSelectedResource] = useState<(typeof RESOURCE_TYPES)[number]>(RESOURCE_TYPES[0]);
  const resource = getResource(selectedResource);
  const local = market.getLocalEntry(selectedResource);
  const regional = market.getRegionalEntry(selectedResource);
  const global = market.getGlobalEntry(selectedResource);
  const details = market.getLocalRegionalDiffusionDetails(selectedResource);
  const regionalGlobalDetails = market.getRegionalGlobalDiffusionDetails(selectedResource);
  const localBalanceDelta = details.lowerTargetSupply - local.supply;
  const regionalBalanceDelta = regionalGlobalDetails.lowerTargetSupply - regional.supply;

  return <>
    <SectionHeading eyebrow="MARKET FLOW" title="Follow market balancing" subtitle="Prices guide resources through local, regional, and global reservoirs every five foreground seconds." />
    <View style={localStyles.resourceTabs}>
      {RESOURCE_GROUPS.map((group) => <View key={group.id} style={localStyles.resourceGroupTabs}><Text style={styles.cardKicker}>{group.label}</Text><View style={localStyles.resourceGroupButtons}>{group.resources.map((resourceType) => <Button accessibilityLabel={getResource(resourceType).name} compact icon={() => <TooltipResourceIcon resourceType={resourceType} />} key={resourceType} mode={selectedResource === resourceType ? 'contained' : 'outlined'} onPress={() => setSelectedResource(resourceType)}>
        {getResource(resourceType).name}
      </Button>)}</View></View>)}
    </View>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={localStyles.flowCardContent}>
      <Text accessibilityLabel={resource.name} variant="titleMedium" style={localStyles.flowTitle}><TooltipResourceIcon resourceType={selectedResource} /> {resource.name}</Text>
      <MarketPool label="Global market" price={regionalGlobalDetails.higherPrice} supply={global.supply} />
      <MarketFlowConnector details={regionalGlobalDetails} />
      <MarketPool label="Regional market" price={details.higherPrice} supply={regional.supply} />
      <MarketFlowConnector details={details} />
      <MarketPool label="Local market" price={details.lowerPrice} supply={local.supply} />
    </Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={localStyles.flowCardContent}>
      <Text style={styles.cardKicker}>BALANCE</Text>
      <Text style={localStyles.balancePairHeading}>LOCAL ↔ REGIONAL</Text>
      <BalanceRow label="Local target" value={formatNumber(details.lowerTargetSupply, { smartDecimals: true })} />
      <BalanceRow label="Regional target" value={formatNumber(details.higherTargetSupply, { smartDecimals: true })} />
      <BalanceRow label="Local adjustment remaining" value={`${formatSigned(localBalanceDelta, { smartDecimals: true })} units`} />
      <BalanceRow label="Next correction" value={details.direction === 'none' ? 'None needed' : `${formatNumber(details.amount, { smartDecimals: true })} units`} />
      <Text style={localStyles.balancePairHeading}>REGIONAL ↔ GLOBAL</Text>
      <BalanceRow label="Regional target" value={formatNumber(regionalGlobalDetails.lowerTargetSupply, { smartDecimals: true })} />
      <BalanceRow label="Global target" value={formatNumber(regionalGlobalDetails.higherTargetSupply, { smartDecimals: true })} />
      <BalanceRow label="Regional adjustment remaining" value={`${formatSigned(regionalBalanceDelta, { smartDecimals: true })} units`} />
      <BalanceRow label="Next correction" value={regionalGlobalDetails.direction === 'none' ? 'None needed' : `${formatNumber(regionalGlobalDetails.amount, { smartDecimals: true })} units`} />
    </Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={localStyles.accordionCardContent}>
      <List.Accordion left={(props) => <List.Icon {...props} icon={APP_ICONS.help} />} title="Why is it moving?">
        <View style={localStyles.accordionBody}>
          <Text style={styles.cardDescription}>{getFlowDescription(details.direction)}</Text>
          <BalanceRow label="Local price" value={<CurrencyValue value={details.lowerPrice} />} />
          <BalanceRow label="Regional price" value={<CurrencyValue value={details.higherPrice} />} />
          <BalanceRow label="Price ratio" value={formatNumber(details.priceRatio, { decimals: 3, forceDecimals: true })} />
        </View>
      </List.Accordion>
      <List.Accordion left={(props) => <List.Icon {...props} icon={APP_ICONS.globalMarket} />} title="Diffusion factors">
        <View style={localStyles.accordionBody}>
          <BalanceRow label="Logistics" value={`${formatNumber(details.logisticsMultiplier, { decimals: 2, forceDecimals: true })}×`} />
          <BalanceRow label="Value density" value={`${formatNumber(details.valueDensityMultiplier, { decimals: 2, forceDecimals: true })}×`} />
          <BalanceRow label="Local-regional research" value={`${formatNumber(details.diffusionMultiplier, { decimals: 2, forceDecimals: true })}×`} />
          <Text style={styles.cardDescription}>Logistics covers transport and storage. Value density reflects how worthwhile the resource is to move.</Text>
        </View>
      </List.Accordion>
      <List.Accordion left={(props) => <List.Icon {...props} icon={APP_ICONS.settings} />} title="Formula and safeguards">
        <View style={localStyles.accordionBody}>
          <Text style={localStyles.formula}>base × symmetric price gap × nonlinear response × logistics × value density × local-regional research</Text>
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

function MarketFlowConnector({ details }: { details: MarketDiffusionDetails }) {
  const isToLowerMarket = details.direction === `to-${details.lowerMarket}`;
  const isToHigherMarket = details.direction === `to-${details.higherMarket}`;
  const flowColor = isToLowerMarket ? colors.marketGreen : isToHigherMarket ? colors.marketGold : colors.muted;
  const flowIcon = isToLowerMarket ? APP_ICONS.marketFlowToLocal : isToHigherMarket ? APP_ICONS.marketFlowToGlobal : APP_ICONS.marketBalanced;
  const pressureWidth = `${Math.min(details.priceGap * 50, 50)}%` as `${number}%`;
  const pairLabel = `${capitalize(details.lowerMarket)}/${capitalize(details.higherMarket)}`;

  return <View accessibilityLabel={getFlowAccessibilityLabel(details.direction, details.amount)} style={localStyles.flowConnector}>
    <TooltipMaterialIcon color={flowColor} label={getFlowAccessibilityLabel(details.direction, details.amount)} name={flowIcon} size={28} />
    <Text style={[localStyles.flowAmount, { color: flowColor }]}>{details.direction === 'none' ? 'Prices balanced' : `${formatNumber(details.amount, { smartDecimals: true })} / minute`}</Text>
    <Text style={localStyles.flowDirection}>{getFlowDescription(details.direction)}</Text>
    <Text style={localStyles.priceGapText}>{`${pairLabel} price gap: ${formatNumber(details.priceGap, { percent: true, decimals: 1 })}`}</Text>
    <View accessibilityLabel={`${pairLabel} price gap ${formatNumber(details.priceGap, { percent: true, decimals: 1 })}`} style={localStyles.balanceTrack}>
      <View style={localStyles.balanceCentre} />
      {details.direction !== 'none' && <View style={[localStyles.balanceFill, isToLowerMarket ? localStyles.balanceFillToLocal : localStyles.balanceFillToGlobal, { width: pressureWidth, backgroundColor: flowColor }]} />}
    </View>
  </View>;
}

function capitalize(value: string): string {
  return `${value[0]!.toUpperCase()}${value.slice(1)}`;
}

function CurrencyValue({ value, style }: { value: number; style?: object }) {
  return <View style={localStyles.iconValue}><TooltipMaterialIcon color={colors.muted} label="Currency" name={APP_ICONS.coin} size={14} /><Text style={style}>{formatCurrency(value).replace(/\s*€/u, '')}</Text></View>;
}

function getFlowDescription(direction: 'to-local' | 'to-regional' | 'to-global' | 'none'): string {
  if (direction === 'to-local') return 'The local price is higher, so the regional market supplies the local market.';
  if (direction === 'to-regional') return 'The adjacent higher-priced market is supplied by its neighboring reservoir.';
  if (direction === 'to-global') return 'The global price is higher, so the regional market supplies the global market.';
  return 'Adjacent market prices are balanced, so no market flow is needed.';
}

function getFlowAccessibilityLabel(direction: 'to-local' | 'to-regional' | 'to-global' | 'none', amount: number): string {
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
        return <List.Item description={<View><Text style={styles.cardDescription}>{getResourceSummary(resourceType)}</Text><View style={localStyles.iconValue}><Text style={localStyles.resourceMarketSeed}>Initial price</Text><CurrencyValue value={initialPrice} style={localStyles.resourceMarketSeed} /><Text style={localStyles.resourceMarketSeed}>· Initial local supply: {formatNumber(resource.market.localInitialSupply, { smartDecimals: true })}</Text></View></View>} key={resourceType} left={() => <TooltipResourceIcon resourceType={resourceType} />} title={<Text accessibilityLabel={resource.name} style={localStyles.resourceTitle}>{resource.name}</Text>} />;
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
        description={<View style={localStyles.facilityCostSummary}><View style={localStyles.iconValue}><Text style={styles.cardDescription}>Land:</Text><CurrencyValue value={facility.landCost} style={styles.cardDescription} /></View><View style={localStyles.iconValue}><Text style={styles.cardDescription}>Materials:</Text><Text style={styles.cardDescription}><TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} /> {formatNumber(facility.constructionMaterialsCost)}</Text><Text style={styles.cardDescription}>· {facility.baseWorkers} base workers</Text></View></View>}
        left={(props) => <List.Icon {...props} icon={facility.icon} />}
        title={facility.name}
      />
        <Text style={styles.cardKicker}>AVAILABLE RECIPES</Text>
        {facility.recipes.map((recipe) => <View key={recipe.name}><Text style={styles.cardDescription}>{formatRecipeName(recipe)}</Text><RecipeResourceSummary recipe={recipe} /></View>)}
      </Card.Content></Card>;
    })}</View>)}
  </>;
}

function FacilityConditionReference() {
  return <Card mode="contained" style={styles.featureCard}><Card.Content style={localStyles.conditionReferenceContent}>
    <Text style={styles.cardKicker}>FACILITY EFFICIENCY</Text>
    <Text style={styles.cardDescription}>Wear is fastest at high condition and slows as a facility approaches zero. One 1.00-work production cycle has almost the same base wear as one foreground minute. Excess staffing increases both wear sources exponentially.</Text>
    <Text style={localStyles.formula}>Staff efficiency: 0.01 + 0.99 × ratio^1.6 when understaffed; 1 + 0.25 × (1 − e^(−0.7 × (ratio − 1))) when overstaffed.</Text>
    <Text style={localStyles.formula}>Facility efficiency: staff efficiency × (1 − condition curve(1 − facility condition)); damage becomes increasingly costly.</Text>
    <Text style={localStyles.formula}>Repair cost: <TooltipResourceIcon resourceType={ResourceType.ConstructionMaterials} /> construction-material cost × 0.9 × (1 − facility condition).</Text>
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
    <View style={localStyles.upgradeReferenceHeading}><TooltipMaterialIcon color={colors.primary} label="Upgrades" name={APP_ICONS.upgrade} size={16} /><Text style={styles.cardKicker}>FACILITY UPGRADES</Text></View>
    <Text style={styles.cardDescription}>Each facility has its own Speed, Output, and Condition upgrade tracks. Every new level costs euros, Construction Materials, and Industrial Machines, with all three inputs increasing by level.</Text>
    <Text style={styles.cardDescription}>Speed upgrades complete production work faster. Output upgrades produce more from each finished cycle. Both raise the facility's worker requirement.</Text>
    <Text style={styles.cardDescription}>Condition upgrades slow both passive and production wear without requiring more workers. Each level helps less than the last, but fully developed maintenance can reduce decay by almost 75%.</Text>
    <Text style={styles.cardKicker}>EXAMPLE LEVELS</Text>
    <UpgradeExample icon={APP_ICONS.speed} label="Speed" values="L0 x1.00 → L1 x1.16 → L5 x1.53" />
    <UpgradeExample icon={APP_ICONS.output} label="Output" values="L0 x1.00 → L1 x1.16 → L5 x1.59" />
    <UpgradeExample icon="shield-check-outline" label="Condition decay" values="L0 x1.00 → L1 x0.88 → L5 x0.55" />
  </Card.Content></Card>;
}

function UpgradeExample({ icon, label, values }: { icon: string; label: string; values: string }) {
  return <View style={localStyles.upgradeExample}><TooltipMaterialIcon color={colors.primary} label={label} name={icon} size={15} /><Text style={styles.cardDescription}><Text style={localStyles.upgradeExampleLabel}>{label}</Text>: {values}</Text></View>;
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
          description={<View><RecipeResourceSummary recipe={recipe} /><WorkMetric value={formatNumber(recipe.requiredWork, { smartDecimals: true })} /></View>}
          key={recipe.name}
          left={() => <TooltipTextIcon label={formatRecipeName(recipe)}>{RECIPE_ICONS[recipe.name]}</TooltipTextIcon>}
          title={formatRecipeName(recipe)}
        />)}
      </List.Section></Card.Content></Card>;
    })}</View>)}
  </>;
}

function FinanceSection() {
  return <>
    <SectionHeading eyebrow="FINANCE" title="Company funds" subtitle="Euros purchase facility land and fund upgrades; customer orders earn them." />
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
      <Text style={styles.cardKicker}>STARTING CAPITAL</Text><CurrencyValue value={FINANCE_INITIAL_BALANCE} style={styles.balanceValue} />
      <Text style={styles.cardDescription}>A facility needs both its land purchase and Construction Materials. You can sell one for 70% of its current condition-adjusted book value.</Text>
    </Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content><List.Item description="A customer locks a bid price, premium, and quantity. The full requested quantity must be available before fulfilment." left={(props) => <List.Icon {...props} icon={APP_ICONS.salesOrders} />} title="Customer orders" /><List.Item description="Each facility has separate Speed and Output upgrades. Every level costs euros, Construction Materials, and Industrial Machines." left={(props) => <List.Icon {...props} icon={APP_ICONS.speed} />} title="Facility upgrades" /><List.Item description="Every accepted cost and income is recorded in the Finance activity list." left={(props) => <List.Icon {...props} icon={APP_ICONS.financeHistory} />} title="Transaction history" /></Card.Content></Card>
  </>;
}

function EconomySection({ economyPhase }: { economyPhase: EconomyPhase }) {
  const salesEffects = SALES_ECONOMY_MULTIPLIERS[economyPhase];
  return <>
    <SectionHeading eyebrow="ECONOMY" title="Economy phases" subtitle="The economy changes with foreground time and affects new customer orders and future loan offers." />
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
      <Text style={styles.cardKicker}>CURRENT PHASE</Text>
      <Text style={localStyles.economyCurrentPhase}>{economyPhase}</Text>
      <List.Item description={`${formatSignedPercent(salesEffects.acquisition - 1, { decimals: 0 })} versus Stable`} left={(props) => <List.Icon {...props} icon={APP_ICONS.salesOrders} />} title="New customer-order frequency" />
      <List.Item description={`${formatSignedPercent(salesEffects.bid - 1, { decimals: 0 })} versus Stable`} left={(props) => <List.Icon {...props} icon={APP_ICONS.bid} />} title="New customer bid premiums" />
      <List.Item description={`${formatSignedPercent(ECONOMY_INTEREST_MULTIPLIERS[economyPhase] - 1, { decimals: 0 })} versus Stable`} left={(props) => <List.Icon {...props} icon={APP_ICONS.financeHistory} />} title="Future loan-offer rates" />
    </Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
      <Text style={styles.cardKicker}>HOW IT CHANGES</Text>
      <Text style={styles.cardDescription}>The economy phase changes deterministically every 10 foreground minutes. It is biased to return toward Stable, so extreme phases are temporary.</Text>
      <Text style={styles.cardDescription}>Background time does not advance the economy phase. Fast-forward does because it advances foreground game time.</Text>
    </Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
      <Text style={styles.cardKicker}>PHASE EFFECTS</Text>
      {ECONOMY_PHASES.map((phase) => <View key={phase} style={localStyles.economyPhaseRow}><Text style={localStyles.economyPhaseName}>{phase}</Text><Text style={styles.cardDescription}>{`${formatSignedPercent(SALES_ECONOMY_MULTIPLIERS[phase].acquisition - 1, { decimals: 0 })} order frequency · ${formatSignedPercent(SALES_ECONOMY_MULTIPLIERS[phase].bid - 1, { decimals: 0 })} bid premiums · ${formatSignedPercent(ECONOMY_INTEREST_MULTIPLIERS[phase] - 1, { decimals: 0 })} offered rates`}</Text></View>)}
      <Text style={styles.cardDescription}>Economy phase does not change existing customer orders or loan rates, production, market prices, or lender caps.</Text>
    </Card.Content></Card>
  </>;
}

function LoansSection() {
  return <>
    <SectionHeading eyebrow="LOANS" title="Borrowing and credit" subtitle="Lenders price offers from your company strength, their policies, and the current economy." />
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
      <Text style={styles.cardKicker}>LOANS AND LENDER LIMITS</Text>
      <Text style={styles.cardDescription}>A lender must consider your company eligible before it contributes to borrowing. Company stability is one part of credit rating: 35% age score (a square-root curve that reaches 100% at 240 active hours), 40% recent operating consistency (a 60% starter score blends out across 16 fifteen-minute periods), and 25% expense efficiency (100% at a 25% operating margin).</Text>
      <Text style={styles.cardDescription}>Asset strength combines debt position (35%), asset coverage (30%), cash liquidity (20%), and condition-adjusted facilities as recoverable collateral (15%). A debt-free cash-only company therefore scores 85%; facilities can supply the remaining collateral credit.</Text>
      <Text style={styles.cardDescription}>Each eligible lender has four caps. Asset cap is what your assets support; rating cap is what your credit supports; market cap is that lender’s exposure to one borrower; and contract cap is that lender product’s own maximum. The lowest is that lender’s policy cap.</Text>
      <Text style={styles.cardDescription}>Company ceiling is the largest policy cap among eligible lenders. Borrowing available is company ceiling minus outstanding debt. The Loans screen highlights the cap currently holding each lender back.</Text>
    </Card.Content></Card>
  </>;
}

function PrestigeSection() {
  return <>
    <SectionHeading eyebrow="PRESTIGE" title="Company standing" subtitle="How company standing is recorded and fades over time." />
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}><Text style={styles.cardKicker}>WHAT IT IS</Text><Text style={styles.cardDescription}>Prestige improves customer discovery, bid quality, relationship baseline, and target order value. It does not change production or ordinary market prices.</Text></Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content><List.Item description="A permanent, recalculated source based on current company cash." left={(props) => <List.Icon {...props} icon={APP_ICONS.bank} />} title="Company balance" /><List.Item description="A permanent source based on average facility condition. 50% condition is neutral; higher condition grants prestige and lower condition applies a penalty. Facilities currently have equal weight; future asset-value metrics can make larger facilities count more." left={(props) => <List.Icon {...props} icon="factory" />} title="Facility condition" /><List.Item description={`Each fulfilled customer order creates a fading event. Its half-life is ${formatNumber(PRESTIGE_SALES_HALF_LIFE_FOREGROUND_HOURS, { smartDecimals: true })} active hours.`} left={(props) => <List.Icon {...props} icon={APP_ICONS.salesOrders} />} title="Customer orders" /></Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}><Text style={styles.cardKicker}>DECAY</Text><Text style={styles.cardDescription}>Prestige decay uses active game time. Background time does not decay prestige; Fast-forward does.</Text><Text style={styles.cardDescription}>For a fading event: current = original × 0.5^(active hours ÷ half-life). Select an event in the Prestige dialog to see its original value, current value, hourly decay, and projections.</Text></Card.Content></Card>
  </>;
}

function ResourceMention({ resourceType }: { resourceType: string }) {
  const typedResource = resourceType as ResourceType;
  return <TooltipResourceIcon resourceType={typedResource} />;
}

function AchievementsSection() {
  return <>
    <SectionHeading eyebrow="ACHIEVEMENTS" title="Company milestones" subtitle="Permanent milestones earned from your company’s progress." />
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
      <Text style={styles.cardKicker}>HOW THEY WORK</Text>
      <Text style={styles.cardDescription}>Achievements unlock once when their requirement is met. The unlock is permanent, even if the current company state later changes. Each earned tier grants a prestige event; achievement prestige fades over active game time.</Text>
      <Text style={styles.cardDescription}>The Achievements screen normally shows the next incomplete tier in each series. Turn on completed tiers there to review every earned milestone.</Text>
    </Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
      <Text style={styles.cardKicker}>FACILITIES</Text>
      <Text style={styles.cardDescription}>Industrial Footprint: own 1, 3, 6, 10, then 15 facilities. The first-facility research grant provides 10 production cycles of the selected recipe’s inputs when that research completes.</Text>
      <Text style={styles.cardDescription}>Moderniser: buy 1, 5, 15, 30, then 60 facility upgrades. Integrated Industry: keep one facility for every six total upgrades, from 1 facility / 6 upgrades through 5 / 30.</Text>
      <Text style={styles.cardDescription}>Operational Excellence unlocks when 1, 3, 6, 10, or 15 facilities simultaneously meet 50%, 75%, 90%, 100%, or 110% efficiency.</Text>
    </Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
      <Text style={styles.cardKicker}>MAINTENANCE</Text>
      <Text style={styles.cardDescription}>Restoration Works tracks total condition restored. Major Overhaul tracks the highest condition restored by one repair. Maintenance Budget tracks the repair’s effective euro value: purchased materials plus the current local-market value of materials consumed from inventory.</Text>
    </Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}>
      <Text style={styles.cardKicker}>PRODUCTION AND COMPANY</Text>
      <Text style={styles.cardDescription}>Every resource has a ten-tier production chain, from 10 to 250,000 units. Other series track total production, completed orders, delivered quantity, largest order, cash reserves, active time, and company prestige.</Text>
    </Card.Content></Card>
  </>;
}

function getResourceSummary(resourceType: (typeof RESOURCE_TYPES)[number]): ReactNode {
  switch (resourceType) {
    case 'grain': return <Text>Raw crop used to bake <ResourceMention resourceType="bread" />, <ResourceMention resourceType="cake" />, and <ResourceMention resourceType="meat-pie" />.</Text>;
    case 'bread': return <Text>Baked product made from <ResourceMention resourceType="grain" />, <ResourceMention resourceType="water" />, and <ResourceMention resourceType="electricity" />.</Text>;
    case 'water': return 'Utility resource used across the production chain.';
    case 'electricity': return 'Utility resource used to power production recipes.';
    case 'sugar': return 'Farm-grown food resource that can be sold directly.';
    case 'fruit': return <Text>Farm-grown ingredient used to bake <ResourceMention resourceType="premium-cake" />.</Text>;
    case 'eggs': return <Text>Animal Farm output used to bake <ResourceMention resourceType="cake" />.</Text>;
    case 'meat': return <Text>Animal Farm output used to bake <ResourceMention resourceType="meat-pie" />.</Text>;
    case 'milk': return <Text>Animal Farm dairy output used to bake <ResourceMention resourceType="premium-cake" />.</Text>;
    case 'wool': return 'Animal Farm fibre output reserved for future textile production.';
    case 'coal': return 'Mined fuel used by the Coal Power recipe.';
    case 'iron': return <Text>Chemical-assisted mined metal used to produce <ResourceMention resourceType="steel" />.</Text>;
    case 'copper': return <Text>Chemical-assisted mined conductor used to produce <ResourceMention resourceType="electric-circuits" />.</Text>;
    case 'steel': return <Text>Processed metal made from <ResourceMention resourceType="iron" /> and <ResourceMention resourceType="coal" />.</Text>;
    case 'electric-circuits': return <Text>Electronic component made from <ResourceMention resourceType="copper" />, <ResourceMention resourceType="silicon" />, <ResourceMention resourceType="plastic" />, <ResourceMention resourceType="water" />, and <ResourceMention resourceType="electricity" />.</Text>;
    case 'bricks': return <Text>Construction units made from <ResourceMention resourceType="clay" /> and <ResourceMention resourceType="sand" />.</Text>;
    case 'cement': return <Text>Construction binder made from <ResourceMention resourceType="stone" />, <ResourceMention resourceType="clay" />, and <ResourceMention resourceType="minerals" />.</Text>;
    case 'reinforced-concrete': return <Text>Structural composite made from <ResourceMention resourceType="cement" />, <ResourceMention resourceType="stone" />, <ResourceMention resourceType="sand" />, <ResourceMention resourceType="steel" />, <ResourceMention resourceType="minerals" />, and <ResourceMention resourceType="chemicals" />.</Text>;
    case 'construction-materials': return <Text>Finished construction bundle made from <ResourceMention resourceType="bricks" />, <ResourceMention resourceType="reinforced-concrete" />, <ResourceMention resourceType="steel" />, <ResourceMention resourceType="sand" />, <ResourceMention resourceType="cement" />, <ResourceMention resourceType="chemicals" />, and <ResourceMention resourceType="plastic" />.</Text>;
    case 'sand': return 'Quarried material used in current construction recipes.';
    case 'clay': return 'Quarried material for future construction recipes.';
    case 'stone': return 'Quarried material for future construction recipes.';
    case 'minerals': return <Text>Quarried raw material used to produce <ResourceMention resourceType="chemicals" /> and <ResourceMention resourceType="silicon" />.</Text>;
    case 'chemicals': return <Text>Industrial process material made from <ResourceMention resourceType="minerals" /> and used to produce <ResourceMention resourceType="fertilizer" /> and <ResourceMention resourceType="plastic" />.</Text>;
    case 'fertilizer': return <Text>Produced by the Chemical Plant and in small Animal Farm quantities; it is used to grow <ResourceMention resourceType="grain" />, <ResourceMention resourceType="sugar" />, and <ResourceMention resourceType="fruit" />.</Text>;
    case 'plastic': return <Text>Manufactured polymer made from <ResourceMention resourceType="chemicals" /> and used in <ResourceMention resourceType="electric-circuits" /> and <ResourceMention resourceType="construction-materials" />.</Text>;
    case 'silicon': return <Text>Refined <ResourceMention resourceType="minerals" /> and <ResourceMention resourceType="sand" /> used with <ResourceMention resourceType="electric-circuits" /> and <ResourceMention resourceType="gold" /> to produce <ResourceMention resourceType="advanced-components" />.</Text>;
    case 'gold': return <Text>Rare mined metal used to produce <ResourceMention resourceType="advanced-components" />.</Text>;
    case 'advanced-components': return <Text>High-value electronic components assembled into <ResourceMention resourceType="industrial-machines" />.</Text>;
    case 'industrial-machines': return <Text>Complex equipment assembled from <ResourceMention resourceType="steel" />, <ResourceMention resourceType="electric-circuits" />, and <ResourceMention resourceType="advanced-components" />.</Text>;
    case 'cake': return <Text>Bakery product made from <ResourceMention resourceType="grain" />, <ResourceMention resourceType="eggs" />, <ResourceMention resourceType="water" />, and <ResourceMention resourceType="electricity" />.</Text>;
    case 'premium-cake': return <Text>Premium baked product made from <ResourceMention resourceType="cake" /> ingredients plus <ResourceMention resourceType="fruit" /> and <ResourceMention resourceType="milk" />.</Text>;
    case 'meat-pie': return <Text>Baked savoury product made from <ResourceMention resourceType="grain" />, <ResourceMention resourceType="meat" />, <ResourceMention resourceType="water" />, and <ResourceMention resourceType="electricity" />.</Text>;
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
  balancePairHeading: { color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 4 },
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
  typeProfileKey: { alignItems: 'flex-start', flexDirection: 'row', gap: 6 },
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
  economyPhaseName: { color: colors.charcoal, fontWeight: '700', textTransform: 'capitalize' },
  economyCurrentPhase: { color: colors.charcoal, fontSize: 22, fontWeight: '700', textTransform: 'capitalize' },
  economyPhaseRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  customerDetails: { borderTopColor: '#E2E8E5', borderTopWidth: 1, gap: 6, marginTop: 4, paddingTop: 10 },
  customerHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  customerDomainResource: { color: colors.charcoal, fontSize: 12 },
  customerDomainResources: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  customerTypeDomains: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  customerTitle: { flex: 1, gap: 2, paddingRight: 8 },
  customerTypeHeading: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  customerTypeMetric: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  customerTypeMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  customerSubheader: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  controlGroup: { gap: 4, paddingBottom: 6 },
  controlLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  directoryControls: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  directoryHint: { alignItems: 'flex-start', flexDirection: 'row', gap: 5, paddingTop: 6 },
  metric: { alignItems: 'center', flexDirection: 'row', gap: 3, minWidth: 82 },
  metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 5 },
});
