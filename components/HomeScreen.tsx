import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HomeScreenProps {
  onStartGame: () => void;
  onOpenSettings: () => void;
  onOpenColorSelection: () => void;
  onExitGame: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame, onOpenSettings, onExitGame }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.hero}>
      <View style={styles.accent} />
      <Text style={styles.title}>لعبة النقاط والمربعات</Text>
      <Text style={styles.subtitle}>استمتع باللعب! 🎯</Text>
    </View>
    <View style={styles.menuContainer}>
      <TouchableOpacity style={[styles.menuButton, styles.startButton]} onPress={onStartGame} accessibilityRole="button">
        <Text style={styles.menuButtonText}>🎮 بدء اللعبة</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.menuButton, styles.settingsButton]} onPress={onOpenSettings} accessibilityRole="button">
        <Text style={styles.menuButtonText}>⚙️ الإعدادات</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.menuButton, styles.exitButton]} onPress={onExitGame} accessibilityRole="button">
        <Text style={styles.menuButtonText}>🚪 الخروج</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 24 },
  hero: { width: '100%', maxWidth: 770, alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, backgroundColor: 'rgba(7, 20, 51, 0.78)', borderColor: 'rgba(113, 207, 255, 0.25)', borderWidth: 1, borderRadius: 26, shadowColor: '#020716', shadowOpacity: 0.38, shadowRadius: 20, elevation: 8 },
  accent: { width: 72, height: 4, borderRadius: 2, backgroundColor: '#22D3EE', marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', writingDirection: 'rtl' },
  subtitle: { marginTop: 8, fontSize: 16, color: '#B8D8F3', textAlign: 'center', writingDirection: 'rtl' },
  menuContainer: { width: '100%', maxWidth: 770, flexDirection: 'row', gap: 12 },
  menuButton: { flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1, paddingHorizontal: 10, shadowColor: '#020716', shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  startButton: { backgroundColor: '#0796B6', borderColor: '#57E8FA' },
  settingsButton: { backgroundColor: '#6040C9', borderColor: '#A78BFA' },
  exitButton: { backgroundColor: 'rgba(9, 25, 60, 0.88)', borderColor: 'rgba(255, 122, 26, 0.7)' },
  menuButtonText: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', textAlign: 'center', writingDirection: 'rtl' },
});
