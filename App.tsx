import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AudioManagerProvider, useAudioManager } from './components/AudioManager';
import { ColorSelectionScreen } from './components/ColorSelectionScreen';
import { Game } from './components/Game';
import { GameResultScreen } from './components/GameResultScreen';
import { HomeScreen } from './components/HomeScreen';
import { GameSettings, SettingsScreen } from './components/SettingsScreen';
import { COLORS } from './components/theme';

type Screen = 'home' | 'game' | 'colorSelection' | 'settings' | 'gameResult';

const DEFAULT_SETTINGS: GameSettings = {
  backgroundMusicEnabled: true,
  backgroundMusicVolume: 0.7,
  clickSoundsEnabled: true,
  clickSoundVolume: 0.8,
  soundEffectsEnabled: true,
};

const clampVolume = (value: number) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

const normalizeSettings = (settings: GameSettings): GameSettings => ({
  backgroundMusicEnabled: settings.backgroundMusicEnabled,
  backgroundMusicVolume: clampVolume(settings.backgroundMusicVolume),
  clickSoundsEnabled: settings.clickSoundsEnabled,
  clickSoundVolume: clampVolume(settings.clickSoundVolume),
  soundEffectsEnabled: settings.soundEffectsEnabled,
});

const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [playerColors, setPlayerColors] = useState<{ player1: string; player2: string }>({
    player1: COLORS.playerRed,
    player2: COLORS.playerBlue,
  });
  const [gameResult, setGameResult] = useState<Array<{id: number, name: string, score: number, color: string}> | null>(null);
  const [gameSettingsOpen, setGameSettingsOpen] = useState(false);
  const { previewClickSound, updateSettings } = useAudioManager();

  const handleStartGame = () => {
    setGameSettingsOpen(false);
    setCurrentScreen('colorSelection');
  };

  const handleOpenSettings = () => {
    setCurrentScreen('settings');
  };

  const handleBackToHome = () => {
    setGameSettingsOpen(false);
    setCurrentScreen('home');
  };

  const handleSaveColors = (player1Color: string, player2Color: string) => {
    setPlayerColors({ player1: player1Color, player2: player2Color });
    setGameSettingsOpen(false);
    setCurrentScreen('game');
  };

  const handleSaveSettings = (settings: GameSettings) => {
    const normalizedSettings = normalizeSettings(settings);
    setGameSettings(normalizedSettings);
    updateSettings(normalizedSettings);
  };

  const handlePreviewSettings = (settings: GameSettings) => {
    updateSettings(normalizeSettings(settings));
  };

  const handleGameEnd = (players: Array<{id: number, name: string, score: number, color: string}>) => {
    setGameResult(players);
    setGameSettingsOpen(false);
    setCurrentScreen('gameResult');
  };

  const handlePlayAgain = () => {
    setGameResult(null);
    setGameSettingsOpen(false);
    setCurrentScreen('game');
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onStartGame={handleStartGame}
            onOpenSettings={handleOpenSettings}
          />
        );
      
      case 'game':
        return (
          <View style={styles.screenStack}>
            <Game
              onBackToHome={handleBackToHome}
              onOpenSettings={() => setGameSettingsOpen(true)}
              player1Color={playerColors.player1}
              player2Color={playerColors.player2}
              onGameEnd={handleGameEnd}
            />
            {gameSettingsOpen && (
              <View style={styles.settingsOverlay}>
                <SettingsScreen
                  onBack={() => setGameSettingsOpen(false)}
                  onSaveSettings={handleSaveSettings}
                  onPreviewSettings={handlePreviewSettings}
                  onPreviewClickSound={previewClickSound}
                  initialSettings={gameSettings}
                />
              </View>
            )}
          </View>
        );
      
      case 'colorSelection':
        return (
          <ColorSelectionScreen
            onBack={handleBackToHome}
            onSaveColors={handleSaveColors}
            initialPlayer1Color={playerColors.player1}
            initialPlayer2Color={playerColors.player2}
          />
        );
      
      case 'settings':
        return (
          <SettingsScreen
            onBack={handleBackToHome}
            onSaveSettings={handleSaveSettings}
            onPreviewSettings={handlePreviewSettings}
            onPreviewClickSound={previewClickSound}
            initialSettings={gameSettings}
          />
        );
      
      case 'gameResult':
        return gameResult ? (
          <View style={styles.screenStack}>
            <GameResultScreen
              players={gameResult}
              onPlayAgain={handlePlayAgain}
              onBackToHome={handleBackToHome}
              onOpenSettings={() => setGameSettingsOpen(true)}
            />
            {gameSettingsOpen && (
              <View style={styles.settingsOverlay}>
                <SettingsScreen
                  onBack={() => setGameSettingsOpen(false)}
                  onSaveSettings={handleSaveSettings}
                  onPreviewSettings={handlePreviewSettings}
                  onPreviewClickSound={previewClickSound}
                  initialSettings={gameSettings}
                />
              </View>
            )}
          </View>
        ) : null;
      
      default:
        return <HomeScreen onStartGame={handleStartGame} onOpenSettings={handleOpenSettings} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentScreen()}
    </View>
  );
};

const App: React.FC = () => {
  return (
    <AudioManagerProvider>
      <StatusBar hidden />
      <AppContent />
    </AudioManagerProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenStack: {
    flex: 1,
  },
  settingsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: COLORS.background,
  },
});

export default App;
