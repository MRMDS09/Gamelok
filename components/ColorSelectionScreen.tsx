import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ColorSelectionScreenProps {
  onBack: () => void;
  onSaveColors: (player1Color: string, player2Color: string) => void;
  initialPlayer1Color?: string;
  initialPlayer2Color?: string;
}

const AVAILABLE_COLORS = [
  { name: 'أحمر', value: '#d32f2f' }, { name: 'أزرق', value: '#1976d2' },
  { name: 'أخضر', value: '#388e3c' }, { name: 'برتقالي', value: '#f57c00' },
  { name: 'بنفسجي', value: '#7b1fa2' }, { name: 'وردي', value: '#c2185b' },
  { name: 'تركوازي', value: '#0097a7' }, { name: 'ذهبي', value: '#f9a825' },
  { name: 'رمادي', value: '#616161' }, { name: 'بني', value: '#5d4037' },
  { name: 'أخضر فاتح', value: '#689f38' }, { name: 'أزرق فاتح', value: '#0288d1' },
];

export const ColorSelectionScreen: React.FC<ColorSelectionScreenProps> = ({
  onBack, onSaveColors, initialPlayer1Color = '#d32f2f', initialPlayer2Color = '#1976d2',
}) => {
  const [player1Color, setPlayer1Color] = useState(initialPlayer1Color);
  const [player2Color, setPlayer2Color] = useState(initialPlayer2Color);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const sameColor = player1Color === player2Color;
  const swatchSize = Math.max(20, Math.min(42,
    Math.floor((layout.width - 64) / 8) - 12,
    Math.floor((layout.height - 130) / 3) - 16,
  ));

  const renderPlayerPanel = (name: string, selectedColor: string, onSelect: (color: string) => void) => (
    <View style={styles.playerPanel}>
      <View style={[styles.playerPreview, { borderColor: selectedColor, backgroundColor: selectedColor + '20' }]}>
        <View style={[styles.playerColorIndicator, { backgroundColor: selectedColor }]} />
        <Text style={styles.playerName} numberOfLines={1}>{name}</Text>
      </View>
      <View style={styles.colorGrid}>
        {AVAILABLE_COLORS.map(color => {
          const isSelected = selectedColor === color.value;
          return (
            <TouchableOpacity key={color.value} style={styles.colorOption}
              onPress={() => onSelect(color.value)} accessibilityRole="button"
              accessibilityLabel={`${name}: ${color.name}`} accessibilityState={{ selected: isSelected }}>
              <View style={[styles.swatch,
                { width: swatchSize, height: swatchSize, borderRadius: swatchSize / 2, backgroundColor: color.value },
                isSelected && styles.selectedSwatch]}>
                {isSelected && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.colorName} numberOfLines={1} adjustsFontSizeToFit>{color.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen} onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        setLayout(previous => previous.width === width && previous.height === height ? previous : { width, height });
      }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}><Text style={styles.backButtonText}>← رجوع</Text></TouchableOpacity>
          <Text style={styles.title}>اختيار الألوان</Text>
        </View>
        <View style={styles.panels}>
          {renderPlayerPanel('اللاعب الأول', player1Color, setPlayer1Color)}
          {renderPlayerPanel('اللاعب الثاني', player2Color, setPlayer2Color)}
        </View>
        <View style={styles.footer}>
          <Text style={styles.warningText} numberOfLines={1}>{sameColor ? 'لا يمكن للاعبين اختيار اللون نفسه' : ''}</Text>
          <TouchableOpacity style={[styles.saveButton, sameColor && styles.disabledButton]}
            onPress={() => onSaveColors(player1Color, player2Color)} disabled={sameColor}>
            <Text style={styles.saveButtonText}>حفظ الألوان</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  screen: { flex: 1, paddingHorizontal: 16, paddingVertical: 8 },
  header: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { minWidth: 80, minHeight: 44, justifyContent: 'center', backgroundColor: 'rgba(9, 25, 60, 0.82)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(34, 211, 238, 0.35)' },
  backButtonText: { fontSize: 15, color: '#B9F5FF', fontWeight: 'bold', textAlign: 'center' },
  title: { fontSize: 21, color: '#FFFFFF', fontWeight: 'bold', textAlign: 'right', flex: 1, writingDirection: 'rtl' },
  panels: { flex: 1, flexDirection: 'row', gap: 8, minHeight: 0 },
  playerPanel: { flex: 1, backgroundColor: 'rgba(7, 20, 51, 0.84)', borderColor: 'rgba(130, 194, 255, 0.22)', borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 7, justifyContent: 'center', shadowColor: '#020716', shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  playerPreview: { height: 32, flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 2, borderRadius: 10, paddingHorizontal: 8, gap: 6 },
  playerColorIndicator: { width: 17, height: 17, borderRadius: 9 },
  playerName: { fontSize: 15, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'right', writingDirection: 'rtl' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', flex: 1 },
  colorOption: { width: '25%', minHeight: 45, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  swatch: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center' },
  selectedSwatch: { borderColor: '#FFFFFF', borderWidth: 3, elevation: 7, shadowColor: '#22D3EE', shadowOpacity: 0.6, shadowRadius: 6 },
  checkMark: { color: '#fff', fontSize: 20, fontWeight: 'bold', textShadowColor: '#222', textShadowRadius: 3 },
  colorName: { fontSize: 11, color: '#D7E9FA', textAlign: 'center', writingDirection: 'rtl', width: '100%' },
  footer: { height: 47, flexDirection: 'row', alignItems: 'center', gap: 8 },
  warningText: { flex: 1, color: '#FFB06C', fontSize: 13, fontWeight: 'bold', textAlign: 'right', writingDirection: 'rtl' },
  saveButton: { minWidth: 140, minHeight: 44, backgroundColor: '#168F48', borderColor: '#54E386', borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  disabledButton: { backgroundColor: 'rgba(65, 82, 110, 0.8)', borderColor: '#71829B' },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
