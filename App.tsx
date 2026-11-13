import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AudioManagerProvider, useAudioManager } from './components/AudioManager';
import { BoardModeSelectionScreen } from './components/BoardModeSelectionScreen';
import {
  BoardModeId,
  CpuDifficulty,
  DEFAULT_BOARD_MODE_ID,
  DEFAULT_CPU_DIFFICULTY,
  DEFAULT_STARTING_PLAYER,
  getBoardMode,
  OpponentMode,
  StartingPlayerMode,
} from './components/BoardModes';
import { ColorSelectionScreen } from './components/ColorSelectionScreen';
import { Game } from './components/Game';
import { GameResultScreen } from './components/GameResultScreen';
import { HomeScreen } from './components/HomeScreen';
import { GameSettings, SettingsScreen } from './components/SettingsScreen';
import { COLORS } from './components/theme';
import { DEFAULT_PREFERENCES, loadPreferences, Preferences, savePreferences } from './utils/preferences';

type Screen = 'home' | 'boardModeSelection' | 'game' | 'colorSelection' | 'settings' | 'gameResult';

const clampVolume = (value: number) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

const normalizeSettings = (settings: GameSettings): GameSettings => ({
  backgroundMusicEnabled: settings.backgroundMusicEnabled,
  backgroundMusicVolume: clampVolume(settings.backgroundMusicVolume),
  clickSoundsEnabled: settings.clickSoundsEnabled,
  clickSoundVolume: clampVolume(settings.clickSoundVolume),
  soundEffectsEnabled: settings.soundEffectsEnabled,
});

const AppContent: React.FC<{ initialPreferences: Preferences }> = ({ initialPreferences }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [gameSettings, setGameSettings] = useState<GameSettings>(initialPreferences.settings);
  const [selectedBoardMode, setSelectedBoardMode] = useState<BoardModeId>(DEFAULT_BOARD_MODE_ID);
  const [opponentMode, setOpponentMode] = useState<OpponentMode>('local');
  const [cpuDifficulty, setCpuDifficulty] = useState<CpuDifficulty>(DEFAULT_CPU_DIFFICULTY);
  const [startingPlayer, setStartingPlayer] = useState<StartingPlayerMode>(DEFAULT_STARTING_PLAYER);
  const [playerColors, setPlayerColors] = useState(initialPreferences.colors);
  const [saveError, setSaveError] = useState(false);
  const preferencesRef = useRef(initialPreferences);
  const writeVersion = useRef(0);

  const persistPreferences = (preferences: Preferences) => {
    preferencesRef.current = preferences;
    const version = ++writeVersion.current;
    void savePreferences(preferences).then(() => {
      if (writeVersion.current === version) setSaveError(false);
    }).catch(() => {
      if (writeVersion.current === version) setSaveError(true);
    });
  };
  const [gameResult, setGameResult] = useState<Array<{id: number, name: string, score: number, color: string}> | null>(null);
  const [gameEndedEarly, setGameEndedEarly] = useState(false);
  const [gameSettingsOpen, setGameSettingsOpen] = useState(false);
  const { previewClickSound, updateSettings } = useAudioManager();

  const handleStartGame = () => {
    setGameEndedEarly(false);
    setGameSettingsOpen(false);
    setCurrentScreen('boardModeSelection');
  };

  const handleSaveBoardSelection = (
    selectedBoardModeId: BoardModeId,
    selectedOpponentMode: OpponentMode,
    selectedCpuDifficulty: CpuDifficulty,
    selectedStartingPlayer: StartingPlayerMode,
  ) => {
    setSelectedBoardMode(selectedBoardModeId);
    setOpponentMode(selectedOpponentMode);
    setCpuDifficulty(selectedCpuDifficulty);
    setStartingPlayer(selectedStartingPlayer);
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
    handleColorsChange(player1Color, player2Color);
    setGameEndedEarly(false);
    setGameSettingsOpen(false);
    setCurrentScreen('game');
  };

  const handleColorsChange = (player1: string, player2: string) => {
    const colors = { player1, player2 };
    setPlayerColors(colors);
    persistPreferences({ ...preferencesRef.current, colors });
  };

  const handleSaveSettings = (settings: GameSettings) => {
    const normalizedSettings = normalizeSettings(settings);
    setGameSettings(normalizedSettings);
    updateSettings(normalizedSettings);
    persistPreferences({ ...preferencesRef.current, settings: normalizedSettings });
  };

  const handleCloseGameSettings = () => {
    setGameSettingsOpen(false);
  };

  const handleGameEnd = (
    players: Array<{id: number, name: string, score: number, color: string}>,
    endedEarly: boolean,
  ) => {
    setGameResult(players);
    setGameEndedEarly(endedEarly);
    setGameSettingsOpen(false);
    setCurrentScreen('gameResult');
  };

  const handlePlayAgain = () => {
    setGameResult(null);
    setGameEndedEarly(false);
    setGameSettingsOpen(false);
    setCurrentScreen('game');
  };

  const handleChooseAnotherBoard = () => {
    setGameResult(null);
    setGameEndedEarly(false);
    setGameSettingsOpen(false);
    setCurrentScreen('boardModeSelection');
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
              paused={gameSettingsOpen}
              player1Color={playerColors.player1}
              player2Color={playerColors.player2}
              boardMode={getBoardMode(selectedBoardMode)}
              opponentMode={opponentMode}
              cpuDifficulty={cpuDifficulty}
              startingPlayer={startingPlayer}
              onGameEnd={handleGameEnd}
            />
          </View>
        );
      
      case 'boardModeSelection':
        return (
          <BoardModeSelectionScreen
            initialBoardModeId={selectedBoardMode}
            initialOpponentMode={opponentMode}
            initialCpuDifficulty={cpuDifficulty}
            initialStartingPlayer={startingPlayer}
            onBack={handleBackToHome}
            onContinue={handleSaveBoardSelection}
          />
        );

      case 'colorSelection':
        return (
          <ColorSelectionScreen
            onBack={() => setCurrentScreen('boardModeSelection')}
            onSaveColors={handleSaveColors}
            onColorsChange={handleColorsChange}
            initialPlayer1Color={playerColors.player1}
            initialPlayer2Color={playerColors.player2}
            player2Label={opponentMode === 'cpu' ? 'الهاتف' : 'اللاعب 2'}
          />
        );
      
      case 'settings':
        return (
          <SettingsScreen
            onBack={handleBackToHome}
            onSaveSettings={handleSaveSettings}
            onPreviewClickSound={previewClickSound}
            initialSettings={gameSettings}
          />
        );
      
      case 'gameResult':
        return gameResult ? (
          <View style={styles.screenStack}>
            <GameResultScreen
              players={gameResult}
              endedEarly={gameEndedEarly}
              boardMode={getBoardMode(selectedBoardMode)}
              onPlayAgain={handlePlayAgain}
              onChooseAnotherBoard={handleChooseAnotherBoard}
              onBackToHome={handleBackToHome}
            />
          </View>
        ) : null;
      
      default:
        return <HomeScreen onStartGame={handleStartGame} onOpenSettings={handleOpenSettings} />;
    }
  };

  return (
    <View style={styles.container}>
      {saveError && <Text accessibilityRole="alert" style={styles.storageWarning}>تعذر حفظ الاختيارات على الجهاز. أعد المحاولة بتغيير الإعداد.</Text>}
      {renderCurrentScreen()}
      <Modal
        visible={currentScreen === 'game' && gameSettingsOpen}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        supportedOrientations={['landscape-left', 'landscape-right']}
        hardwareAccelerated
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={handleCloseGameSettings}
      >
        <View style={styles.settingsBackdrop}>
          {saveError && <Text accessibilityRole="alert" style={styles.storageWarning}>تعذر حفظ الاختيارات على الجهاز. أعد المحاولة بتغيير الإعداد.</Text>}
          {currentScreen === 'game' && gameSettingsOpen && (
            <SettingsScreen
              modal
              onBack={handleCloseGameSettings}
              onSaveSettings={handleSaveSettings}
              onPreviewClickSound={previewClickSound}
              initialSettings={gameSettings}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const App: React.FC = () => {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    let active = true;
    void loadPreferences().then((stored) => {
      if (active) setPreferences(stored);
    }).catch(() => {
      if (active) {
        setLoadError(true);
        setPreferences(DEFAULT_PREFERENCES);
      }
    });
    return () => { active = false; };
  }, []);

  if (!preferences) {
    return <View style={[styles.container, styles.loading]}><StatusBar hidden /><ActivityIndicator color={COLORS.gold} accessibilityLabel="تحميل الاختيارات" /></View>;
  }
  return (
    <AudioManagerProvider initialSettings={preferences.settings}>
      <StatusBar hidden />
      <View style={styles.container}>
        {loadError && <Text accessibilityRole="alert" style={styles.storageWarning}>تعذر استعادة الاختيارات المحفوظة. تم استخدام الإعدادات الافتراضية.</Text>}
        <AppContent initialPreferences={preferences} />
      </View>
    </AudioManagerProvider>
  );
};

const styles = StyleSheet.create({
  loading: { alignItems: 'center', justifyContent: 'center' },
  storageWarning: { backgroundColor: COLORS.background, color: COLORS.text, textAlign: 'center', padding: 8 },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenStack: {
    flex: 1,
  },
  settingsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 8, 22, 0.82)',
  },
});

export default App;
