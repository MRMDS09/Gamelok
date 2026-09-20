import { useAudioPlayer } from 'expo-audio';
import { AppState } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GameSettings } from './SettingsScreen';

interface AudioManagerContextType {
  playClickSound: () => void;
  previewClickSound: (volume: number) => void;
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

const reportPlaybackError = (soundName: string, error: unknown) => {
  console.warn(`تعذر تشغيل صوت ${soundName}. قد يتطلب الويب تفاعلاً من المستخدم أولاً.`, error);
};

export const AudioManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const settingsRef = useRef<GameSettings>(DEFAULT_SETTINGS);
  const [appState, setAppState] = useState(AppState.currentState ?? 'active');
  const backgroundPlayer = useAudioPlayer(require('../assets/game-music-gemini-2026-09-15.mp3'));
  const clickPlayer = useAudioPlayer(require('../assets/line-click.wav'));
  const clickPreviewRequestRef = useRef(0);
  const boxCompletePlayer = useAudioPlayer(require('../assets/box-complete.wav'));
  const gameOverPlayer = useAudioPlayer(require('../assets/game-over.wav'));

  useEffect(() => {
    backgroundPlayer.loop = true;
  }, [backgroundPlayer]);

  useEffect(() => {
    const musicVolume = clampVolume(settings.backgroundMusicVolume);
    backgroundPlayer.volume = musicVolume;
    backgroundPlayer.muted = musicVolume <= 0;
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
    const clickVolume = clampVolume(settings.clickSoundVolume);
    clickPlayer.volume = clickVolume;
    clickPlayer.muted = clickVolume <= 0;
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
    const latestSettings = settingsRef.current;
    const clickVolume = clampVolume(latestSettings.clickSoundVolume);
    if (!latestSettings.clickSoundsEnabled || clickVolume <= 0) {
      return;
    }

    const requestId = ++clickPreviewRequestRef.current;
    clickPlayer.volume = clickVolume;
    clickPlayer.muted = false;
    void (async () => {
      try {
        clickPlayer.pause();
        await clickPlayer.seekTo(0);
        if (requestId !== clickPreviewRequestRef.current) return;
        clickPlayer.volume = clickVolume;
        clickPlayer.muted = false;
        clickPlayer.play();
      } catch (error) {
        reportPlaybackError('النقر', error);
      }
    })();
  }, [clickPlayer]);

  const previewClickSound = useCallback((volume: number) => {
    const requestedVolume = clampVolume(volume);
    const requestId = ++clickPreviewRequestRef.current;

    if (!settingsRef.current.clickSoundsEnabled || requestedVolume <= 0) {
      clickPlayer.pause();
      clickPlayer.volume = requestedVolume;
      clickPlayer.muted = true;
      if (__DEV__) {
        console.log(`[CLICK PREVIEW] skipped volume=${requestedVolume.toFixed(2)}`);
      }
      return;
    }

    void (async () => {
      try {
        clickPlayer.pause();
        clickPlayer.volume = requestedVolume;
        clickPlayer.muted = false;
        await clickPlayer.seekTo(0);
        if (requestId !== clickPreviewRequestRef.current) return;

        clickPlayer.volume = requestedVolume;
        clickPlayer.muted = false;
        if (__DEV__) {
          console.log(`[CLICK PREVIEW] played volume=${requestedVolume.toFixed(2)}`);
        }
        clickPlayer.play();
      } catch (error) {
        reportPlaybackError('معاينة النقر', error);
      }
    })();
  }, [clickPlayer]);

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
    const normalizedSettings = normalizeSettings(newSettings);
    settingsRef.current = normalizedSettings;
    setSettings(normalizedSettings);
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
    previewClickSound,
    playBackgroundMusic,
    stopBackgroundMusic,
    updateSettings,
    playBoxCompleteSound,
    playGameOverSound,
  }), [playBackgroundMusic, playBoxCompleteSound, playClickSound, playGameOverSound, previewClickSound, stopBackgroundMusic, updateSettings]);

  return <AudioManagerContext.Provider value={value}>{children}</AudioManagerContext.Provider>;
};

export const useAudioManager = (): AudioManagerContextType => {
  const context = useContext(AudioManagerContext);
  if (context === undefined) {
    throw new Error('useAudioManager must be used within an AudioManagerProvider');
  }
  return context;
};
