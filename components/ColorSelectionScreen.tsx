import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ColorSelectionScreenProps {
  onBack: () => void;
  onSaveColors: (player1Color: string, player2Color: string) => void;
  initialPlayer1Color?: string;
  initialPlayer2Color?: string;
}

const AVAILABLE_COLORS = [
  { name: 'أحمر', value: '#d32f2f' },
  { name: 'أزرق', value: '#1976d2' },
  { name: 'أخضر', value: '#388e3c' },
  { name: 'برتقالي', value: '#f57c00' },
  { name: 'بنفسجي', value: '#7b1fa2' },
  { name: 'وردي', value: '#c2185b' },
  { name: 'تركوازي', value: '#0097a7' },
  { name: 'ذهبي', value: '#f9a825' },
  { name: 'رمادي', value: '#616161' },
  { name: 'بني', value: '#5d4037' },
  { name: 'أخضر فاتح', value: '#689f38' },
  { name: 'أزرق فاتح', value: '#0288d1' },
];

export const ColorSelectionScreen: React.FC<ColorSelectionScreenProps> = ({
  onBack,
  onSaveColors,
  initialPlayer1Color = '#d32f2f',
  initialPlayer2Color = '#1976d2',
}) => {
  const [player1Color, setPlayer1Color] = useState(initialPlayer1Color);
  const [player2Color, setPlayer2Color] = useState(initialPlayer2Color);

  const handleSave = () => {
    onSaveColors(player1Color, player2Color);
    // سيتم الانتقال للعبة تلقائياً من App.tsx
  };

  const ColorButton = ({ color, isSelected, onPress }: { 
    color: { name: string; value: string }; 
    isSelected: boolean; 
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.colorButton,
        { backgroundColor: color.value },
        isSelected && styles.selectedColorButton,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.colorName, { color: isSelected ? '#fff' : '#333' }]}>
        {color.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>اختيار الألوان</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* اللاعب الأول */}
        <View style={styles.playerSection}>
          <View style={[styles.playerPreview, { backgroundColor: player1Color + '20', borderColor: player1Color }]}>
            <View style={[styles.playerColorIndicator, { backgroundColor: player1Color }]} />
            <Text style={[styles.playerName, { color: player1Color }]}>اللاعب الأول</Text>
          </View>
          
          <Text style={styles.sectionTitle}>اختر لون اللاعب الأول:</Text>
          <View style={styles.colorGrid}>
            {AVAILABLE_COLORS.map((color) => (
              <ColorButton
                key={color.value}
                color={color}
                isSelected={player1Color === color.value}
                onPress={() => setPlayer1Color(color.value)}
              />
            ))}
          </View>
        </View>

        {/* اللاعب الثاني */}
        <View style={styles.playerSection}>
          <View style={[styles.playerPreview, { backgroundColor: player2Color + '20', borderColor: player2Color }]}>
            <View style={[styles.playerColorIndicator, { backgroundColor: player2Color }]} />
            <Text style={[styles.playerName, { color: player2Color }]}>اللاعب الثاني</Text>
          </View>
          
          <Text style={styles.sectionTitle}>اختر لون اللاعب الثاني:</Text>
          <View style={styles.colorGrid}>
            {AVAILABLE_COLORS.map((color) => (
              <ColorButton
                key={color.value}
                color={color}
                isSelected={player2Color === color.value}
                onPress={() => setPlayer2Color(color.value)}
              />
            ))}
          </View>
        </View>

        {/* تحذير إذا كان اللونان متشابهان */}
        {player1Color === player2Color && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>⚠️ لا يمكن للاعبين أن يكون لهما نفس اللون!</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.saveButton, player1Color === player2Color && styles.disabledButton]} 
        onPress={handleSave}
        disabled={player1Color === player2Color}
      >
        <Text style={styles.saveButtonText}>💾 حفظ الألوان</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 10,
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 18,
    color: '#3498db',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  playerSection: {
    marginBottom: 0,
  },
  playerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    borderRadius: 15,
    borderWidth: 3,
    marginBottom: 15,
  },
  playerColorIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  colorButton: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginHorizontal: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorButton: {
    borderColor: '#fff',
    transform: [{ scale: 1.1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  colorName: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  warningContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  warningText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    paddingHorizontal: 30,
    margin: 20,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
