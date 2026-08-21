import { useRef } from 'react';
import { View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SectionHeading } from '@/ui/dashboard/components/DashboardPrimitives';
import { styles } from '@/ui/dashboard/helpers/dashboard.styles';

export function CompanyView({ companyName, onCompanyOverviewLayout }: { companyName: string; onCompanyOverviewLayout?: (layout: { height: number; width: number; x: number; y: number }) => void }) {
  const companyOverviewRef = useRef<View>(null);

  return (
    <>
      <SectionHeading eyebrow="COMPANY" title="Company overview" subtitle="Your active local industrial company." />
      <View ref={companyOverviewRef} onLayout={() => companyOverviewRef.current?.measureInWindow((x, y, width, height) => onCompanyOverviewLayout?.({ height, width, x, y }))}>
        <Card mode="contained" style={styles.featureCard}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.cardKicker}>COMPANY PROFILE</Text>
            <Text variant="titleLarge">{companyName}</Text>
            <Text style={styles.cardDescription}>
              This company is saved separately from every other company on this device.
            </Text>
          </Card.Content>
        </Card>
      </View>
    </>
  );
}

