import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { AppState } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { GameSettings } from './SettingsScreen';

interface AudioManagerContextType {
  playClickSound: () => void;
  playBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
  updateSettings: (settings: GameSettings) => void;
  playBoxCompleteSound: () => void;
  playGameOverSound: () => void;
}

const AudioManagerContext = createContext<AudioManagerContextType | undefined>(undefined);

const DEFAULT_SETTINGS: GameSettings = {
  backgroundMusicEnabled: true,
  backgroundMusicVolume: 0.7,
  clickSoundsEnabled: true,
  clickSoundVolume: 0.8,
  vibrationEnabled: true,
  soundEffectsEnabled: true,
};

const reportPlaybackError = (soundName: string, error: unknown) => {
  console.warn(`تعذر تشغيل صوت ${soundName}. قد يتطلب الويب تفاعلاً من المستخدم أولاً.`, error);
};

export const AudioManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [appState, setAppState] = useState(AppState.currentState ?? 'active');
  const backgroundPlayer = useAudioPlayer(require('../assets/game-music-gemini-2026-09-15.mp3'));
  const clickPlayer = useAudioPlayer(require('../assets/line-click.wav'));
  const boxCompletePlayer = useAudioPlayer(require('../assets/box-complete.wav'));
  const gameOverPlayer = useAudioPlayer(require('../assets/game-over.wav'));

  useEffect(() => {
    backgroundPlayer.loop = true;
  }, [backgroundPlayer]);

  useEffect(() => {
    backgroundPlayer.volume = settings.backgroundMusicVolume;
  }, [backgroundPlayer, settings.backgroundMusicVolume]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (settings.backgroundMusicEnabled && appState === 'active') {
      if (!backgroundPlayer.playing) {
        try {
          backgroundPlayer.play();
        } catch (error) {
          reportPlaybackError('background music', error);
        }
      }
      return;
    }

    try {
      backgroundPlayer.pause();
    } catch (error) {
      reportPlaybackError('background music', error);
    }
  }, [appState, backgroundPlayer, settings.backgroundMusicEnabled]);

  useEffect(() => {
    clickPlayer.volume = settings.clickSoundVolume;
  }, [clickPlayer, settings.clickSoundVolume]);

  const restartPlayer = useCallback(async (player: typeof clickPlayer, soundName: string) => {
    try {
      await player.seekTo(0);
      player.play();
    } catch (error) {
      reportPlaybackError(soundName, error);
    }
  }, []);

  const playClickSound = useCallback(() => {
    if (settings.clickSoundsEnabled) {
      void restartPlayer(clickPlayer, 'النقر');
    }
    if (settings.vibrationEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((error) => {
        console.warn('تعذر تشغيل الاهتزاز.', error);
      });
    }
  }, [clickPlayer, restartPlayer, settings.clickSoundsEnabled, settings.vibrationEnabled]);

  const playBackgroundMusic = useCallback(() => {
    if (!settings.backgroundMusicEnabled || backgroundPlayer.playing) return;
    try {
      backgroundPlayer.play();
    } catch (error) {
      reportPlaybackError('الموسيقى الخلفية', error);
    }
  }, [backgroundPlayer, settings.backgroundMusicEnabled]);

  const stopBackgroundMusic = useCallback(() => {
    try {
      backgroundPlayer.pause();
    } catch (error) {
      reportPlaybackError('الموسيقى الخلفية', error);
    }
  }, [backgroundPlayer]);

  const updateSettings = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
  }, []);

  const playBoxCompleteSound = useCallback(() => {
    if (settings.soundEffectsEnabled) {
      void restartPlayer(boxCompletePlayer, 'اكتمال المربع');
    }
  }, [boxCompletePlayer, restartPlayer, settings.soundEffectsEnabled]);

  const playGameOverSound = useCallback(() => {
    if (settings.soundEffectsEnabled) {
      void restartPlayer(gameOverPlayer, 'نهاية اللعبة');
    }
  }, [gameOverPlayer, restartPlayer, settings.soundEffectsEnabled]);

  useEffect(() => () => {
    try {
      backgroundPlayer.pause();
    } catch (error) {
      reportPlaybackError('الموسيقى الخلفية', error);
    }
  }, [backgroundPlayer]);

  const value = useMemo<AudioManagerContextType>(() => ({
    playClickSound,
    playBackgroundMusic,
    stopBackgroundMusic,
    updateSettings,
    playBoxCompleteSound,
    playGameOverSound,
  }), [playBackgroundMusic, playBoxCompleteSound, playClickSound, playGameOverSound, stopBackgroundMusic, updateSettings]);

  return <AudioManagerContext.Provider value={value}>{children}</AudioManagerContext.Provider>;
};

export const useAudioManager = (): AudioManagerContextType => {
  const context = useContext(AudioManagerContext);
  if (context === undefined) {
    throw new Error('useAudioManager must be used within an AudioManagerProvider');
  }
  return context;
};
