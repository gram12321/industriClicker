import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, List, Text } from 'react-native-paper';
import { FACILITY_TYPES, getFacilityDefinition } from '@/game/facilities/facilityConstants';
import { FINANCE_INITIAL_BALANCE } from '@/game/finance/financeConstants';
import { PRESTIGE_SALES_HALF_LIFE_FOREGROUND_HOURS } from '@/game/prestige/prestigeConstants';
import { ALL_RECIPES } from '@/game/recipes/recipeConstants';
import { formatRecipeInputs, formatRecipeName, formatRecipeOutput } from '@/ui/dashboard/helpers/recipeFormatters';
import { getResource, getResourceIcon, RESOURCE_TYPES } from '@/game/resources/resourceConstants';
import { formatCurrency, formatNumber } from '@/utils';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';
import { SectionHeading, WorkMetric } from '../../components/GameViewComponents';
import { APP_ICONS } from '@/icons';

export function IndustriPediaView() {
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
    {activeSection === 'finance' && <FinanceSection />}
    {activeSection === 'prestige' && <PrestigeSection />}
  </>;
}

type IndustriPediaSection = 'resources' | 'buildings' | 'recipes' | 'finance' | 'prestige';

const INDUSTRIPEDIA_SECTIONS: ReadonlyArray<{ id: IndustriPediaSection; label: string }> = [
  { id: 'resources', label: 'Resources' },
  { id: 'buildings', label: 'Buildings' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'finance', label: 'Finance' },
  { id: 'prestige', label: 'Prestige' },
];

function ResourcesSection() {
  return <>
    <SectionHeading eyebrow="RESOURCES" title="Resource catalogue" subtitle="Resources are held in inventory and can be produced, consumed, or supplied to customers." />
    <Card mode="contained" style={styles.featureCard}><Card.Content><List.Section>
      {RESOURCE_TYPES.map((resourceType) => {
        const resource = getResource(resourceType);
        return <List.Item description={getResourceSummary(resourceType)} key={resourceType} left={(props) => <List.Icon {...props} icon={APP_ICONS.package} />} title={`${getResourceIcon(resourceType)} ${resource.name}`} />;
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
    <Card mode="contained" style={styles.featureCard}><Card.Content><List.Item description="A permanent, recalculated source based on current company cash." left={(props) => <List.Icon {...props} icon={APP_ICONS.bank} />} title="Company balance" /><List.Item description={`Each fulfilled contract creates a fading event. Its half-life is ${formatNumber(PRESTIGE_SALES_HALF_LIFE_FOREGROUND_HOURS, { smartDecimals: true })} foreground hours.`} left={(props) => <List.Icon {...props} icon={APP_ICONS.contracts} />} title="Contract sales" /></Card.Content></Card>
    <Card mode="contained" style={styles.featureCard}><Card.Content style={styles.cardContent}><Text style={styles.cardKicker}>DECAY</Text><Text style={styles.cardDescription}>Prestige decay uses active foreground game time. Background time does not decay prestige; Fast-forward does.</Text><Text style={styles.cardDescription}>For a fading event: current = original × 0.5^(foreground hours ÷ half-life). Select an event in the Prestige dialog to see its original value, current value, hourly decay, and projections.</Text></Card.Content></Card>
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
    case 'cake': return 'Baked product made from Grain, Sugar, Water, and Electricity.';
    default: return 'Tracked in your company inventory.';
  }
}

const localStyles = StyleSheet.create({
  sectionTabs: { gap: 8, paddingBottom: 4 },
});
