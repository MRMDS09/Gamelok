import React, { useState } from 'react';
import { Alert, BackHandler, ImageBackground, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AudioManagerProvider, useAudioManager } from './components/AudioManager';
import { ColorSelectionScreen } from './components/ColorSelectionScreen';
import { Game } from './components/Game';
import { GameResultScreen } from './components/GameResultScreen';
import { HomeScreen } from './components/HomeScreen';
import { GameSettings, SettingsScreen } from './components/SettingsScreen';

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
  const [playerColors, setPlayerColors] = useState({ player1: '#d32f2f', player2: '#1976d2' });
  const [gameResult, setGameResult] = useState<Array<{id: number, name: string, score: number, color: string}> | null>(null);
  const { previewClickSound, updateSettings } = useAudioManager();

  const handleStartGame = () => {
    setCurrentScreen('colorSelection');
  };

  const handleOpenColorSelection = () => {
    setCurrentScreen('colorSelection');
  };

  const handleOpenSettings = () => {
    setCurrentScreen('settings');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleSaveColors = (player1Color: string, player2Color: string) => {
    setPlayerColors({ player1: player1Color, player2: player2Color });
    setCurrentScreen('game');
  };

  const handleExitGame = () => {
    Alert.alert(
      'تأكيد الخروج',
      'هل أنت متأكد من أنك تريد الخروج من اللعبة؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'خروج',
          style: 'destructive',
          onPress: () => {
            try {
              BackHandler.exitApp();
            } catch (e) {
              setCurrentScreen('home');
            }
          },
        },
      ]
    );
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
    setCurrentScreen('gameResult');
  };

  const handlePlayAgain = () => {
    setGameResult(null);
    setCurrentScreen('game');
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onStartGame={handleStartGame}
            onOpenSettings={handleOpenSettings}
            onOpenColorSelection={handleOpenColorSelection}
            onExitGame={handleExitGame}
          />
        );
      
      case 'game':
        return (
          <Game
            onBackToHome={handleBackToHome}
            player1Color={playerColors.player1}
            player2Color={playerColors.player2}
            onGameEnd={handleGameEnd}
          />
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
          <GameResultScreen
            players={gameResult}
            onPlayAgain={handlePlayAgain}
            onBackToHome={handleBackToHome}
          />
        ) : null;
      
      default:
        return <HomeScreen onStartGame={handleStartGame} onOpenSettings={handleOpenSettings} onOpenColorSelection={handleOpenColorSelection} onExitGame={handleExitGame} />;
    }
  };

  return (
    <ImageBackground source={require('./assets/gamelok-background.png')} resizeMode="cover" style={styles.container}>
      {renderCurrentScreen()}
    </ImageBackground>
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
    backgroundColor: '#081535',
  },
});

export default App;
