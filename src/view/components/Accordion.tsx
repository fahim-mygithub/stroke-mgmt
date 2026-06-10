import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '@/view/theme';

type AccordionProps = {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Controlled expandable card (outcome accordion in the redesign). The parent owns
 * `expanded` so it can enforce one-open-at-a-time. Header shows a chevron that
 * rotates when open; the body animates open/closed.
 */
function Accordion({
  title,
  expanded,
  onToggle,
  children,
  style = undefined,
}: AccordionProps) {
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <View
      style={[styles.card, expanded ? styles.cardOpen : styles.cardClosed, style]}
    >
      <Pressable
        onPress={handleToggle}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text style={styles.title}>{title}</Text>
        <FontAwesome5
          name="chevron-down"
          size={14}
          color={theme.colors.ink3}
          style={expanded ? styles.chevronOpen : undefined}
        />
      </Pressable>
      {expanded && (
        <View style={styles.body}>
          <View style={styles.separator} />
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  cardClosed: {
    borderColor: theme.colors.border,
  },
  cardOpen: {
    borderColor: theme.colors.ink3,
    ...theme.elevations.md,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  title: {
    ...theme.fonts.cardTitle,
    fontSize: 15,
    color: theme.colors.ink,
    flex: 1,
    paddingRight: 12,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  body: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border2,
    marginBottom: 14,
  },
});

export { Accordion };
