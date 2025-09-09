import React, { createContext, useContext, useEffect, useState } from 'react';
import AudioUtils from '../utils/AudioUtils';
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

interface AudioManagerProviderProps {
  children: React.ReactNode;
}

export const AudioManagerProvider: React.FC<AudioManagerProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<GameSettings>({
    backgroundMusicEnabled: true,
    backgroundMusicVolume: 0.7,
    clickSoundsEnabled: true,
    clickSoundVolume: 0.8,
    vibrationEnabled: true,
    soundEffectsEnabled: true,
  });

  const [isBackgroundMusicPlaying, setIsBackgroundMusicPlaying] = useState(false);
  let backgroundMusic: HTMLAudioElement | null = null;

  // تشغيل صوت النقر
  const playClickSound = () => {
    if (!settings.clickSoundsEnabled) return;
    
    AudioUtils.setVolume(settings.clickSoundVolume);
    AudioUtils.playClickSound();
    
    // تفعيل الاهتزاز إذا كان مفعلاً
    if (settings.vibrationEnabled) {
      AudioUtils.vibrate(50);
    }
  };

  // تشغيل الموسيقى الخلفية
  const playBackgroundMusic = () => {
    if (!settings.backgroundMusicEnabled || isBackgroundMusicPlaying) return;
    
    if (!backgroundMusic) {
      backgroundMusic = new Audio('assets/background-music.mp3'); // تأكد من صحة المسار
      backgroundMusic.loop = true;
      backgroundMusic.volume = getVolume('music');
    }
    backgroundMusic.play().catch(err => console.error('Error playing background music:', err));
    setIsBackgroundMusicPlaying(true);
  };

  // إيقاف الموسيقى الخلفية
  const stopBackgroundMusic = () => {
    if (!isBackgroundMusicPlaying) return;
    
    backgroundMusic?.pause();
    setIsBackgroundMusicPlaying(false);
  };

  // تحديث الإعدادات
  const updateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    
    // إذا تم إيقاف الموسيقى الخلفية، أوقفها
    if (!newSettings.backgroundMusicEnabled && isBackgroundMusicPlaying) {
      stopBackgroundMusic();
    }
    
    // إذا تم تفعيل الموسيقى الخلفية، شغلها
    if (newSettings.backgroundMusicEnabled && !isBackgroundMusicPlaying) {
      playBackgroundMusic();
    }
  };

  // تشغيل صوت إكمال المربع
  const playBoxCompleteSound = () => {
    if (!settings.soundEffectsEnabled) return;
    AudioUtils.playBoxCompleteSound();
  };

  // تشغيل صوت نهاية اللعبة
  const playGameOverSound = () => {
    if (!settings.soundEffectsEnabled) return;
    AudioUtils.playGameOverSound();
  };

  // تنظيف عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      stopBackgroundMusic();
    };
  }, []);

  const value: AudioManagerContextType = {
    playClickSound,
    playBackgroundMusic,
    stopBackgroundMusic,
    updateSettings,
    playBoxCompleteSound,
    playGameOverSound,
  };

  return (
    <AudioManagerContext.Provider value={value}>
      {children}
    </AudioManagerContext.Provider>
  );
};

export const useAudioManager = (): AudioManagerContextType => {
  const context = useContext(AudioManagerContext);
  if (context === undefined) {
    throw new Error('useAudioManager must be used within an AudioManagerProvider');
  }
  return context;
};
