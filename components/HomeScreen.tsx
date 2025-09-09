import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HomeScreenProps {
  onStartGame: () => void;
  onOpenSettings: () => void;
  onOpenColorSelection: () => void;
  onExitGame: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onStartGame, 
  onOpenSettings, 
  onOpenColorSelection,
  onExitGame
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>لعبة النقاط والمربعات</Text>
        <Text style={styles.subtitle}>Dots and Boxes</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={[styles.menuButton, styles.startButton]} onPress={onStartGame}>
          <Text style={styles.menuButtonText}>🎮 بدء اللعبة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuButton, styles.settingsButton]} onPress={onOpenSettings}>
          <Text style={styles.menuButtonText}>⚙️ الإعدادات</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuButton, styles.exitButton]} onPress={onExitGame}>
          <Text style={styles.menuButtonText}>🚪 الخروج</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>استمتع باللعب! 🎯</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  menuContainer: {
    width: '100%',
    maxWidth: 300,
  },
  menuButton: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  startButton: {
    backgroundColor: '#27ae60',
  },
  settingsButton: {
    backgroundColor: '#3498db',
  },
  exitButton: {
    backgroundColor: '#e74c3c',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
  },
});
