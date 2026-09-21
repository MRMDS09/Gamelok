import { AudioPlayer, useAudioPlayer } from 'expo-audio';
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

const toPlayerVolume = (uiVolume: number) => {
  const normalized = clampVolume(uiVolume);

  if (normalized <= 0) {
    return 0;
  }

  return normalized * normalized;
};

const applyPlayerVolume = (
  player: AudioPlayer,
  source: 'music' | 'click',
  uiVolume: number,
) => {
  const normalizedUi = clampVolume(uiVolume);
  const playerVolume = toPlayerVolume(normalizedUi);

  player.volume = playerVolume;
  player.muted = playerVolume <= 0;

  // expo-audio 0.4.9 restores its remembered volume when unmuting on Android.
  // Reassert the requested value so it is the final native volume write.
  if (playerVolume > 0) {
    player.volume = playerVolume;
  }

  if (__DEV__) {
    console.log(
      `[PLAYER STATE] source=${source}` +
      ` ui=${normalizedUi.toFixed(2)}` +
      ` requested=${playerVolume.toFixed(2)}` +
      ` actual=${Number(player.volume).toFixed(2)}` +
      ` muted=${String(player.muted)}`
    );
  }

  return playerVolume;
};

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
    applyPlayerVolume(backgroundPlayer, 'music', settings.backgroundMusicVolume);
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
    applyPlayerVolume(clickPlayer, 'click', settings.clickSoundVolume);
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
    const clickUiVolume = clampVolume(latestSettings.clickSoundVolume);
    const requestId = ++clickPreviewRequestRef.current;

    if (!latestSettings.clickSoundsEnabled || clickUiVolume <= 0) {
      clickPlayer.pause();
      applyPlayerVolume(clickPlayer, 'click', clickUiVolume);
      return;
    }

    clickPlayer.pause();
    applyPlayerVolume(clickPlayer, 'click', clickUiVolume);
    void (async () => {
      try {
        await clickPlayer.seekTo(0);
        if (requestId !== clickPreviewRequestRef.current) return;
        clickPlayer.play();
      } catch (error) {
        reportPlaybackError('النقر', error);
      }
    })();
  }, [clickPlayer]);

  const previewClickSound = useCallback((_volume: number) => {
    const latestSettings = settingsRef.current;
    const clickUiVolume = clampVolume(latestSettings.clickSoundVolume);
    const requestId = ++clickPreviewRequestRef.current;

    if (!latestSettings.clickSoundsEnabled || clickUiVolume <= 0) {
      clickPlayer.pause();
      const clickPlayerVolume = applyPlayerVolume(clickPlayer, 'click', clickUiVolume);
      if (__DEV__) {
        console.log(`[CLICK PREVIEW] skipped ui=${clickUiVolume.toFixed(2)} player=${clickPlayerVolume.toFixed(2)}`);
      }
      return;
    }

    clickPlayer.pause();
    const clickPlayerVolume = applyPlayerVolume(clickPlayer, 'click', clickUiVolume);
    void (async () => {
      try {
        await clickPlayer.seekTo(0);
        if (requestId !== clickPreviewRequestRef.current) return;

        if (__DEV__) {
          console.log(`[CLICK PREVIEW] ui=${clickUiVolume.toFixed(2)} player=${clickPlayerVolume.toFixed(2)}`);
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
    const normalized = normalizeSettings(newSettings);

    settingsRef.current = normalized;

    applyPlayerVolume(
      backgroundPlayer,
      'music',
      normalized.backgroundMusicVolume
    );

    applyPlayerVolume(
      clickPlayer,
      'click',
      normalized.clickSoundVolume
    );

    setSettings(normalized);
  }, [backgroundPlayer, clickPlayer]);

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
