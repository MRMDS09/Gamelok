import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameSettings } from '../components/SettingsScreen';
import { COLORS } from '../components/theme';

const STORAGE_KEY = '@gamelok/preferences/v1';

export interface Preferences {
  settings: GameSettings;
  colors: { player1: string; player2: string };
}

export const DEFAULT_PREFERENCES: Preferences = {
  settings: {
    backgroundMusicEnabled: true,
    backgroundMusicVolume: 0.7,
    clickSoundsEnabled: true,
    clickSoundVolume: 0.8,
    soundEffectsEnabled: true,
  },
  colors: { player1: COLORS.playerRed, player2: COLORS.playerBlue },
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};

export const normalizePreferences = (value: unknown): Preferences => {
  const stored = asRecord(value);
  const settings = asRecord(stored.settings);
  const colors = asRecord(stored.colors);
  const defaults = DEFAULT_PREFERENCES.settings;
  const boolean = (key: keyof GameSettings): boolean =>
    typeof settings[key] === 'boolean' ? settings[key] as boolean : defaults[key] as boolean;
  const volume = (key: 'backgroundMusicVolume' | 'clickSoundVolume'): number => {
    const value = settings[key];
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.round(Math.max(0, Math.min(1, value)) * 10) / 10 : defaults[key];
  };
  const color = (value: unknown, fallback: string): string =>
    typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  const player1 = color(colors.player1, DEFAULT_PREFERENCES.colors.player1);
  let player2 = color(colors.player2, DEFAULT_PREFERENCES.colors.player2);
  if (player1.toLowerCase() === player2.toLowerCase()) {
    player2 = player1.toLowerCase() === DEFAULT_PREFERENCES.colors.player2.toLowerCase()
      ? DEFAULT_PREFERENCES.colors.player1 : DEFAULT_PREFERENCES.colors.player2;
  }
  return {
    settings: {
      backgroundMusicEnabled: boolean('backgroundMusicEnabled'),
      backgroundMusicVolume: volume('backgroundMusicVolume'),
      clickSoundsEnabled: boolean('clickSoundsEnabled'),
      clickSoundVolume: volume('clickSoundVolume'),
      soundEffectsEnabled: boolean('soundEffectsEnabled'),
    },
    colors: { player1, player2 },
  };
};

export const loadPreferences = async (): Promise<Preferences> => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored === null) return normalizePreferences(null);
  try {
    return normalizePreferences(JSON.parse(stored));
  } catch {
    return normalizePreferences(null);
  }
};

// Serialize writes so rapid changes cannot restore an older selection.
let pendingWrite: Promise<void> = Promise.resolve();
export const savePreferences = (preferences: Preferences): Promise<void> => {
  const serialized = JSON.stringify(normalizePreferences(preferences));
  const write = pendingWrite.catch(() => undefined)
    .then(() => AsyncStorage.setItem(STORAGE_KEY, serialized));
  pendingWrite = write;
  return write;
};
