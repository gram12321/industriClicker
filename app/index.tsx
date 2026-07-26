import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  Avatar,
  Card,
  Divider,
  IconButton,
  Menu,
  Surface,
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme';
import { styles } from './index.styles';

type DashboardTab = 'company' | 'production' | 'finance';

const tabs: Array<{ key: DashboardTab; label: string; symbol: string }> = [
  { key: 'company', label: 'Company', symbol: '⌂' },
  { key: 'production', label: 'Production', symbol: '⚙' },
  { key: 'finance', label: 'Finance', symbol: '¤' },
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('company');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.topBar}>
            <View style={styles.balanceInline}>
              <Text accessibilityLabel="Balance icon" style={styles.coinIcon}>🪙</Text>
              <Text style={styles.balanceInlineValue}>€ 000</Text>
            </View>
            <View style={styles.headerActions}>
              <IconButton
                accessibilityLabel="Notifications placeholder"
                icon="bell-outline"
                iconColor={colors.onDark}
                onPress={() => undefined}
              />
              <Menu
                anchor={
                  <Pressable
                    accessibilityLabel="Open profile menu"
                    accessibilityRole="button"
                    onPress={() => setIsProfileMenuOpen(true)}
                    style={styles.profileButton}
                  >
                    <Avatar.Text label="IC" size={38} style={styles.avatar} />
                  </Pressable>
                }
                onDismiss={() => setIsProfileMenuOpen(false)}
                visible={isProfileMenuOpen}
              >
                <Menu.Item leadingIcon="account-outline" onPress={() => setIsProfileMenuOpen(false)} title="Profile" />
                <Menu.Item leadingIcon="cog-outline" onPress={() => setIsProfileMenuOpen(false)} title="Settings" />
                <Menu.Item leadingIcon="trophy-outline" onPress={() => setIsProfileMenuOpen(false)} title="Achievements" />
                <Divider />
                <Menu.Item leadingIcon="logout" onPress={() => setIsProfileMenuOpen(false)} title="Log out" />
              </Menu>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <DashboardContent activeTab={activeTab} />
        </ScrollView>

        <Surface elevation={3} style={styles.bottomNavigation}>
          {tabs.map((tab) => (
            <BottomNavigationItem
              active={activeTab === tab.key}
              key={tab.key}
              label={tab.label}
              onPress={() => setActiveTab(tab.key)}
              symbol={tab.symbol}
            />
          ))}
        </Surface>
      </View>
    </SafeAreaView>
  );
}

function DashboardContent({ activeTab }: { activeTab: DashboardTab }) {
  if (activeTab === 'production') {
    return (
      <>
        <SectionHeading
          eyebrow="OPERATIONS"
          title="Production facility"
          subtitle="Production systems will appear here once their rules are designed."
        />
        <Card mode="contained" style={styles.featureCard}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.cardKicker}>FIRST FACILITY</Text>
            <Text variant="titleLarge">No facility selected</Text>
            <Text style={styles.cardDescription}>
              This placeholder is ready for the first player-owned production unit.
            </Text>
          </Card.Content>
        </Card>
        <PlaceholderRow label="Facility status" value="Not set" />
        <PlaceholderRow label="Current output" value="Not set" />
      </>
    );
  }

  if (activeTab === 'finance') {
    return (
      <>
        <SectionHeading
          eyebrow="FINANCE"
          title="Financial overview"
          subtitle="Transaction and balance details will appear here later."
        />
        <Card mode="contained" style={styles.featureCard}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.cardKicker}>CURRENT POSITION</Text>
            <Text style={styles.largePlaceholder}>—</Text>
            <Text style={styles.cardDescription}>No financial values have been defined yet.</Text>
          </Card.Content>
        </Card>
        <PlaceholderRow label="Income" value="Not available" />
        <PlaceholderRow label="Recent activity" value="No transactions" />
      </>
    );
  }

  return (
    <>
      <SectionHeading
        eyebrow="COMPANY"
        title="Company overview"
        subtitle="Your starting dashboard for the Industri Clicker prototype."
      />
      <Card mode="contained" style={styles.featureCard}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.cardKicker}>COMPANY PROFILE</Text>
          <Text variant="titleLarge">Starter Company</Text>
          <Text style={styles.cardDescription}>
            The company profile is a visual placeholder while the player identity system is planned.
          </Text>
        </Card.Content>
      </Card>
      <PlaceholderRow label="Production facilities" value="None yet" />
      <PlaceholderRow label="Company status" value="Ready to begin" />
    </>
  );
}

function SectionHeading({
  eyebrow,
  subtitle,
  title,
}: {
  eyebrow: string;
  subtitle: string;
  title: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text variant="headlineSmall">{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function PlaceholderRow({ label, value }: { label: string; value: string }) {
  return (
    <Surface elevation={0} style={styles.placeholderRow}>
      <Text variant="bodyLarge">{label}</Text>
      <Text style={styles.placeholderValue}>{value}</Text>
    </Surface>
  );
}

function BottomNavigationItem({
  active,
  label,
  onPress,
  symbol,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  symbol: string;
}) {
  const activeStyle: StyleProp<ViewStyle> = active ? styles.activeNavigationItem : undefined;

  return (
    <Pressable
      accessibilityLabel={`${label} tab`}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.navigationItem, activeStyle]}
    >
      <Text style={[styles.navigationSymbol, active && styles.activeNavigationText]}>{symbol}</Text>
      <Text style={[styles.navigationLabel, active && styles.activeNavigationText]}>{label}</Text>
    </Pressable>
  );
}
