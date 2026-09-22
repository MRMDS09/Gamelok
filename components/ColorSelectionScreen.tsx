import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from './theme';

interface ColorSelectionScreenProps {
  onBack: () => void;
  onSaveColors: (player1Color: string, player2Color: string) => void;
  initialPlayer1Color?: string;
  initialPlayer2Color?: string;
}

const AVAILABLE_COLORS = [
  { name: 'أحمر', value: COLORS.playerRed }, { name: 'أزرق', value: COLORS.playerBlue },
  { name: 'أخضر', value: '#388E3C' }, { name: 'برتقالي', value: '#F57C00' },
  { name: 'بنفسجي', value: '#7B1FA2' }, { name: 'وردي', value: '#C2185B' },
  { name: 'تركوازي', value: '#0097A7' }, { name: 'ذهبي', value: '#F9A825' },
  { name: 'رمادي', value: '#616161' }, { name: 'بني', value: '#5D4037' },
  { name: 'أخضر فاتح', value: '#689F38' }, { name: 'أزرق فاتح', value: '#0288D1' },
];

export const ColorSelectionScreen: React.FC<ColorSelectionScreenProps> = ({
  onBack,
  onSaveColors,
  initialPlayer1Color = COLORS.playerRed,
  initialPlayer2Color = COLORS.playerBlue,
}) => {
  const [player1Color, setPlayer1Color] = useState(initialPlayer1Color);
  const [player2Color, setPlayer2Color] = useState(initialPlayer2Color);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const sameColor = player1Color === player2Color;
  const swatchSize = Math.max(20, Math.min(38,
    Math.floor((layout.width - 96) / 8) - 12,
    Math.floor((layout.height - 130) / 3) - 16,
  ));

  const renderPlayerPanel = (
    playerLabel: string,
    selectedColor: string,
    unavailableColor: string,
    onSelect: (color: string) => void,
  ) => (
    <View style={styles.playerPanel}>
      <View style={styles.playerHeading}>
        <View style={[styles.playerColorIndicator, { backgroundColor: selectedColor }]} />
        <View style={styles.playerHeadingText}>
          <Text style={styles.playerName}>{playerLabel}</Text>
          <Text style={styles.chooseLabel}>اختر اللون</Text>
        </View>
      </View>

      <View style={styles.colorGrid}>
        {AVAILABLE_COLORS.map((color) => {
          const isSelected = selectedColor === color.value;
          const isUnavailable = unavailableColor === color.value && !isSelected;
          return (
            <TouchableOpacity
              key={color.value}
              style={[styles.colorOption, isUnavailable && styles.unavailableOption]}
              onPress={() => onSelect(color.value)}
              disabled={isUnavailable}
              activeOpacity={0.75}
              accessibilityRole="radio"
              accessibilityLabel={`${playerLabel}: ${color.name}`}
              accessibilityState={{ selected: isSelected, disabled: isUnavailable }}
            >
              <View
                style={[
                  styles.swatch,
                  {
                    width: swatchSize,
                    height: swatchSize,
                    borderRadius: swatchSize / 2,
                    backgroundColor: color.value,
                  },
                  isSelected && styles.selectedSwatch,
                ]}
              />
              <Text style={styles.colorName} numberOfLines={1} adjustsFontSizeToFit>
                {color.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={styles.screen}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setLayout((previous) => previous.width === width && previous.height === height
            ? previous
            : { width, height });
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="الرجوع إلى الرئيسية"
          >
            <Text style={styles.backButtonText}>الرجوع</Text>
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>اختر ألوان اللاعبين</Text>
            <Text style={styles.subtitle}>لكل لاعب لون مختلف وواضح على اللوحة</Text>
          </View>
        </View>

        <View style={styles.panels}>
          {renderPlayerPanel('اللاعب 1', player1Color, player2Color, setPlayer1Color)}
          {renderPlayerPanel('اللاعب 2', player2Color, player1Color, setPlayer2Color)}
        </View>

        <View style={styles.footer}>
          <Text style={styles.warningText} numberOfLines={1}>
            {sameColor ? 'اختر لونين مختلفين للمتابعة' : 'الألوان المختارة ستظهر على الحواف والمربعات'}
          </Text>
          <TouchableOpacity
            style={[styles.startButton, sameColor && styles.disabledButton]}
            onPress={() => onSaveColors(player1Color, player2Color)}
            disabled={sameColor}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="ابدأ اللعبة"
            accessibilityState={{ disabled: sameColor }}
          >
            <Text style={styles.startButtonText}>ابدأ اللعبة</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  backButton: {
    minWidth: 92,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.board,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingHorizontal: 14,
  },
  backButtonText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  headerCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    color: COLORS.gold,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  panels: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 0,
  },
  playerPanel: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.panel,
    borderColor: '#2B354D',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  playerHeading: {
    minHeight: 42,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#273149',
    paddingBottom: 7,
  },
  playerColorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  playerHeadingText: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  chooseLabel: {
    fontSize: 11,
    color: COLORS.mutedText,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  colorGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    paddingTop: 3,
  },
  colorOption: {
    width: '25%',
    minHeight: 45,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  unavailableOption: {
    opacity: 0.24,
  },
  swatch: {
    borderWidth: 2,
    borderColor: '#6B7280',
  },
  selectedSwatch: {
    borderColor: COLORS.gold,
    borderWidth: 2,
    transform: [{ scale: 1.12 }],
  },
  colorName: {
    fontSize: 10,
    color: COLORS.mutedText,
    textAlign: 'center',
    writingDirection: 'rtl',
    width: '100%',
    marginTop: 2,
  },
  footer: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
  },
  warningText: {
    flex: 1,
    color: COLORS.mutedText,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  startButton: {
    minWidth: 190,
    minHeight: 46,
    backgroundColor: COLORS.emerald,
    borderColor: '#34D399',
    borderWidth: 1,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  disabledButton: {
    backgroundColor: COLORS.mutedControl,
    borderColor: COLORS.neutralLine,
  },
  startButtonText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
});
