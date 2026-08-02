import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { colors } from '@/theme';

export type DocumentationKind = 'readme' | 'version-log' | null;

const DOCUMENTS: Record<Exclude<DocumentationKind, null>, { asset: number; title: string }> = {
  readme: { asset: require('../../../readme.md'), title: 'Industri Clicker README' },
  'version-log': { asset: require('../../../docs/WorkingDocs/versionlog.md'), title: 'Version log' },
};

export function DocumentationDialog({ kind, onClose }: { kind: DocumentationKind; onClose: () => void }) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!kind) return;
    const source = Image.resolveAssetSource(DOCUMENTS[kind].asset);
    setContent(null);
    setError(null);
    void fetch(source.uri)
      .then((response) => {
        if (!response.ok) throw new Error('The document could not be loaded.');
        return response.text();
      })
      .then(setContent)
      .catch(() => setError('This document could not be loaded from the app bundle.'));
  }, [kind]);

  const document = kind ? DOCUMENTS[kind] : null;
  return (
    <Portal>
      <Dialog onDismiss={onClose} style={styles.dialog} visible={document !== null}>
        <Dialog.Title>{document?.title}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.content}>
            {content ? <MarkdownDocument content={content} /> : <Text style={styles.body}>{error ?? 'Loading document…'}</Text>}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions><Button onPress={onClose}>Close</Button></Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

function MarkdownDocument({ content }: { content: string }) {
  return <View style={styles.document}>{content.split(/\r?\n/).map((line, index) => {
    if (line.startsWith('### ')) return <Text key={index} style={styles.headingThree}>{line.slice(4)}</Text>;
    if (line.startsWith('## ')) return <Text key={index} style={styles.headingTwo}>{line.slice(3)}</Text>;
    if (line.startsWith('# ')) return <Text key={index} style={styles.headingOne}>{line.slice(2)}</Text>;
    if (line.startsWith('- ')) return <Text key={index} style={styles.bullet}>• {line.slice(2)}</Text>;
    if (/^\d+\. /.test(line)) return <Text key={index} style={styles.body}>{line}</Text>;
    if (!line.trim()) return <View key={index} style={styles.spacer} />;
    return <Text key={index} style={styles.body}>{line}</Text>;
  })}</View>;
}

const styles = StyleSheet.create({
  body: { color: colors.muted, lineHeight: 21 },
  bullet: { color: colors.muted, lineHeight: 21, paddingLeft: 8 },
  content: { paddingHorizontal: 24, paddingVertical: 4 },
  dialog: { maxHeight: '84%' },
  document: { gap: 4 },
  headingOne: { color: colors.charcoal, fontSize: 24, fontWeight: '700', lineHeight: 30, marginTop: 10 },
  headingTwo: { color: colors.charcoal, fontSize: 20, fontWeight: '700', lineHeight: 27, marginTop: 12 },
  headingThree: { color: colors.charcoal, fontSize: 17, fontWeight: '700', lineHeight: 24, marginTop: 10 },
  spacer: { height: 7 },
});
