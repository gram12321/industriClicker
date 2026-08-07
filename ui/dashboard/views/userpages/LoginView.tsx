import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Divider, List, Portal, Dialog, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { STARTING_CONDITIONS, useCompanySessionStore } from '@/game/company';
import { colors } from '@/theme';
import { APP_ICONS } from '@/icons';
import { DocumentationDialog, type DocumentationKind } from '@/ui/dashboard/components/dialog/DocumentationDialog';

export function LoginView() {
  const [playerName, setPlayerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [documentationKind, setDocumentationKind] = useState<DocumentationKind>(null);
  const profiles = useCompanySessionStore((state) => state.profiles);
  const selectedProfile = useCompanySessionStore((state) => state.selectedProfile);
  const companies = useCompanySessionStore((state) => state.companies);
  const error = useCompanySessionStore((state) => state.error);
  const isSwitching = useCompanySessionStore((state) => state.isSwitching);
  const createProfile = useCompanySessionStore((state) => state.createProfile);
  const selectProfile = useCompanySessionStore((state) => state.selectProfile);
  const createCompany = useCompanySessionStore((state) => state.createCompany);
  const activateCompany = useCompanySessionStore((state) => state.activateCompany);
  const logout = useCompanySessionStore((state) => state.logout);

  const submitProfile = async () => {
    if (await createProfile(playerName)) setPlayerName('');
  };
  const submitCompany = async () => {
    if (await createCompany(companyName, 'standard')) {
      setCompanyName('');
      setIsCompanyDialogOpen(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Avatar.Icon icon="factory" size={58} style={styles.guideAvatar} />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>INDUSTRI CLICKER</Text>
            <Text variant="headlineMedium">Build your local industrial story</Text>
            <Text style={styles.description}>Your companies are saved only on this device. Create a local player profile, then choose a company to continue.</Text>
          </View>
        </View>

        {!selectedProfile ? (
          <>
            <Card mode="contained" style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Text variant="titleLarge">Create local player</Text>
                <Text style={styles.description}>This is not an online account. It simply groups your companies on this device.</Text>
                <TextInput autoCapitalize="words" label="Player name" mode="outlined" onChangeText={setPlayerName} value={playerName} />
              </Card.Content>
              <Card.Actions><Button disabled={isSwitching} icon={APP_ICONS.account} mode="contained" onPress={submitProfile}>Create player</Button></Card.Actions>
            </Card>
            {profiles.length > 0 && (
              <Card mode="contained" style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <Text variant="titleMedium">Choose local player</Text>
                  {profiles.map((profile) => (
                    <List.Item description="Local company portfolio" key={profile.id} left={(props) => <List.Icon {...props} icon={APP_ICONS.account} />} onPress={() => { void selectProfile(profile.id); }} title={profile.displayName} />
                  ))}
                </Card.Content>
              </Card>
            )}
          </>
        ) : (
          <>
            <Card mode="contained" style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Text style={styles.eyebrow}>LOCAL PLAYER</Text>
                <Text variant="titleLarge">{selectedProfile.displayName}</Text>
                <Text style={styles.description}>Choose a company, or begin a new standard company.</Text>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => { void logout(); }}>Choose another player</Button>
                <Button disabled={isSwitching} icon={APP_ICONS.add} mode="contained" onPress={() => setIsCompanyDialogOpen(true)}>Create company</Button>
              </Card.Actions>
            </Card>
            <Card mode="contained" style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Text variant="titleMedium">Your companies</Text>
                {companies.length === 0 ? <Text style={styles.description}>No companies yet. Create your first company to begin.</Text> : companies.map((company) => (
                  <List.Item
                    description={`${STARTING_CONDITIONS[company.startingConditionId].name} · saved on this device`}
                    key={company.id}
                    left={(props) => <List.Icon {...props} icon="factory" />}
                    onPress={() => { void activateCompany(company.id); }}
                    right={(props) => <List.Icon {...props} icon={APP_ICONS.next} />}
                    title={company.displayName}
                  />
                ))}
              </Card.Content>
            </Card>
            <Card mode="contained" style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Text variant="titleMedium">This-device leaderboard</Text>
                <Text style={styles.description}>Company ranking will appear here later. Online leaderboards require server validation and are not enabled.</Text>
              </Card.Content>
            </Card>
          </>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.documentationActions}>
          <Button compact icon="file-document-outline" onPress={() => setDocumentationKind('readme')}>README</Button>
          <Button compact icon="history" onPress={() => setDocumentationKind('version-log')}>Version log</Button>
        </View>
      </ScrollView>
      <Portal>
        <Dialog dismissable={!isSwitching} onDismiss={() => setIsCompanyDialogOpen(false)} visible={isCompanyDialogOpen}>
          <Dialog.Title>Start a company</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Text style={styles.description}>Choose your company name and review its first starting condition.</Text>
            <TextInput autoCapitalize="words" label="Company name" mode="outlined" onChangeText={setCompanyName} value={companyName} />
            <Divider />
            <Text variant="titleMedium">{STARTING_CONDITIONS.standard.name}</Text>
            <Text style={styles.description}>{STARTING_CONDITIONS.standard.description}</Text>
            <Text style={styles.detail}>{STARTING_CONDITIONS.standard.openingFundsDescription}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button disabled={isSwitching} onPress={() => setIsCompanyDialogOpen(false)}>Cancel</Button>
            <Button disabled={isSwitching} loading={isSwitching} mode="contained" onPress={submitCompany}>Create company</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <DocumentationDialog kind={documentationKind} onClose={() => setDocumentationKind(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface },
  cardContent: { gap: 10 },
  content: { gap: 14, padding: 20 },
  description: { color: colors.muted, lineHeight: 21 },
  detail: { color: colors.primary, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  documentationActions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  dialogContent: { gap: 12 },
  error: { color: colors.error, lineHeight: 20 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  guideAvatar: { backgroundColor: colors.primary },
  hero: { alignItems: 'center', flexDirection: 'row', gap: 16, marginVertical: 10 },
  heroCopy: { flex: 1, gap: 5 },
  safeArea: { backgroundColor: colors.softBackground, flex: 1 },
});
