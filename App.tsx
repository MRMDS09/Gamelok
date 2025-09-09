import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, StyleSheet, View } from 'react-native';
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
  vibrationEnabled: true,
  soundEffectsEnabled: true,
};

const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [playerColors, setPlayerColors] = useState({ player1: '#d32f2f', player2: '#1976d2' });
  const [gameResult, setGameResult] = useState<Array<{id: number, name: string, score: number, color: string}> | null>(null);
  const { updateSettings, playBackgroundMusic, stopBackgroundMusic } = useAudioManager();

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
    setGameSettings(settings);
    updateSettings(settings);
  };

  // إدارة الموسيقى الخلفية بناءً على الشاشة والإعدادات
  useEffect(() => {
    if (gameSettings.backgroundMusicEnabled && (currentScreen === 'home' || currentScreen === 'game')) {
      playBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [currentScreen, gameSettings.backgroundMusicEnabled]);

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
    <View style={styles.container}>
      {renderCurrentScreen()}
    </View>
  );
};

const App: React.FC = () => {
  return (
    <AudioManagerProvider>
      <AppContent />
    </AudioManagerProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
});

export default App;
