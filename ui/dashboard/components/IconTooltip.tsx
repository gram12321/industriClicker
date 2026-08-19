import { createContext, useContext, useState, type ReactNode } from 'react';
import { Pressable, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Portal, Surface, Text } from 'react-native-paper';
import { getResource, getResourceIcon, type ResourceType } from '@/game/resources';
import { getAppIconLabel, type AppIconKey, APP_ICONS } from '@/icons';
import { colors } from '@/theme';

type TooltipContextValue = (label: string) => void;
const TooltipContext = createContext<TooltipContextValue | null>(null);

export function IconTooltipProvider({ children }: { children: ReactNode }) {
  const [label, setLabel] = useState<string | null>(null);

  return (
    <TooltipContext.Provider value={setLabel}>
      {children}
      <Portal>
        <Modal dismissable onDismiss={() => setLabel(null)} visible={label !== null} contentContainerStyle={tooltipStyles.modal}>
          <Surface elevation={4} style={tooltipStyles.surface}>
            <Text accessibilityRole="text" variant="titleMedium">{label}</Text>
          </Surface>
        </Modal>
      </Portal>
    </TooltipContext.Provider>
  );
}

function useShowTooltip(label: string) {
  const showTooltip = useContext(TooltipContext);
  return () => showTooltip?.(label);
}

export function TooltipIcon({ children, label, style }: { children: ReactNode; label: string; style?: StyleProp<ViewStyle> }) {
  const showTooltip = useShowTooltip(label);
  return <Pressable accessibilityLabel={`Show ${label}`} accessibilityRole="button" onPress={(event) => { event.stopPropagation(); showTooltip(); }} style={style}>{children}</Pressable>;
}

export function TooltipMaterialIcon({ color, label, name, size, style }: { color?: string; label: string; name: string; size: number; style?: StyleProp<ViewStyle> }) {
  return <TooltipIcon label={label} style={style}><MaterialCommunityIcons color={color} name={name as never} size={size} /></TooltipIcon>;
}

export function TooltipAppIcon({ color, iconKey, label = getAppIconLabel(iconKey), size, style }: { color?: string; iconKey: AppIconKey; label?: string; size: number; style?: StyleProp<ViewStyle> }) {
  return <TooltipMaterialIcon color={color} label={label} name={APP_ICONS[iconKey]} size={size} style={style} />;
}

/** Inline emoji icon for resource and recipe labels. */
export function TooltipTextIcon({ children, label, style }: { children: string; label: string; style?: StyleProp<TextStyle> }) {
  const showTooltip = useShowTooltip(label);
  return <Text accessibilityLabel={`Show ${label}`} accessibilityRole="button" onPress={(event) => { event.stopPropagation(); showTooltip(); }} style={style}>{children}</Text>;
}

export function TooltipResourceIcon({ resourceType, style }: { resourceType: ResourceType; style?: StyleProp<TextStyle> }) {
  return <TooltipTextIcon label={getResource(resourceType).name} style={style}>{getResourceIcon(resourceType)}</TooltipTextIcon>;
}

const tooltipStyles = {
  modal: { alignItems: 'center', justifyContent: 'center', margin: 24 } satisfies ViewStyle,
  surface: { backgroundColor: colors.surface, borderRadius: 12, maxWidth: '80%', paddingHorizontal: 18, paddingVertical: 12 } satisfies ViewStyle,
};
