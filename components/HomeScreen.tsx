import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { COLORS } from './theme';

interface HomeScreenProps {
  onStartGame: () => void;
  onOpenSettings: () => void;
}

const APP_VERSION = require('../app.json').expo.version as string;

const GameEmblem: React.FC = () => (
  <View style={styles.emblem} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <View style={[styles.emblemLine, styles.emblemLineTop]} />
    <View style={[styles.emblemLine, styles.emblemLineBottom]} />
    <View style={[styles.emblemLine, styles.emblemLineLeft]} />
    <View style={[styles.emblemLine, styles.emblemLineRight]} />
    <View style={[styles.emblemDot, styles.dotTopLeft]} />
    <View style={[styles.emblemDot, styles.dotTopRight]} />
    <View style={[styles.emblemDot, styles.dotBottomLeft]} />
    <View style={[styles.emblemDot, styles.dotBottomRight]} />
  </View>
);

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame, onOpenSettings }) => {
  const { width, height } = useWindowDimensions();
  const desktop = width >= 1024 && height >= 600;
  return (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <GameEmblem />
      <Text style={[styles.title, desktop && desktopStyles.title]}>Gamelok</Text>
      <Text style={[styles.subtitle, desktop && desktopStyles.subtitle]}>لعبة النقاط والمربعات</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, desktop && desktopStyles.button, styles.primaryButton]}
          onPress={onStartGame}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="ابدأ اللعب"
        >
          <Text style={styles.primaryButtonText}>ابدأ اللعب</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, desktop && desktopStyles.button, styles.secondaryButton]}
          onPress={onOpenSettings}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="الإعدادات"
        >
          <Text style={styles.secondaryButtonText}>الإعدادات</Text>
        </TouchableOpacity>
      </View>
    </View>
    <Text style={styles.version}>الإصدار {APP_VERSION}</Text>
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  content: {
    width: '100%',
    maxWidth: 660,
    alignItems: 'center',
  },
  emblem: {
    width: 76,
    height: 48,
    marginBottom: 6,
  },
  emblemLine: {
    position: 'absolute',
    backgroundColor: COLORS.neutralLine,
    borderRadius: 2,
  },
  emblemLineTop: { left: 10, right: 10, top: 8, height: 3 },
  emblemLineBottom: { left: 10, right: 10, bottom: 8, height: 3 },
  emblemLineLeft: { left: 8, top: 10, bottom: 10, width: 3 },
  emblemLineRight: { right: 8, top: 10, bottom: 10, width: 3 },
  emblemDot: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.gold,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  dotTopLeft: { left: 4, top: 4 },
  dotTopRight: { right: 4, top: 4 },
  dotBottomLeft: { left: 4, bottom: 4 },
  dotBottomRight: { right: 4, bottom: 4 },
  title: {
    color: COLORS.gold,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  actions: {
    width: '100%',
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 22,
  },
  button: {
    flex: 1,
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: COLORS.emerald,
    borderColor: '#34D399',
  },
  secondaryButton: {
    backgroundColor: COLORS.board,
    borderColor: COLORS.gold,
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  version: {
    position: 'absolute',
    bottom: 10,
    color: COLORS.mutedText,
    fontSize: 11,
    writingDirection: 'rtl',
  },
});

const desktopStyles = StyleSheet.create({
  title: { fontSize: 60, lineHeight: 70 },
  subtitle: { fontSize: 22, lineHeight: 32 },
  button: { minHeight: 64 },
});
