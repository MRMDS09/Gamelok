import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameSettings } from '../components/SettingsScreen';
import { CharacterSelection, DEFAULT_CHARACTER_SELECTION, normalizeCharacterSelection } from '../components/Characters';

const STORAGE_KEY = '@gamelok/preferences/v1';

export interface Preferences {
  settings: GameSettings;
  characters: CharacterSelection;
}

export const DEFAULT_PREFERENCES: Preferences = {
  settings: {
    backgroundMusicEnabled: true,
    backgroundMusicVolume: 0.7,
    clickSoundsEnabled: true,
    clickSoundVolume: 0.8,
    soundEffectsEnabled: true,
  },
  characters: DEFAULT_CHARACTER_SELECTION,
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};

export const normalizePreferences = (value: unknown): Preferences => {
  const stored = asRecord(value);
  const settings = asRecord(stored.settings);
  const defaults = DEFAULT_PREFERENCES.settings;
  const boolean = (key: keyof GameSettings): boolean =>
    typeof settings[key] === 'boolean' ? settings[key] as boolean : defaults[key] as boolean;
  const volume = (key: 'backgroundMusicVolume' | 'clickSoundVolume'): number => {
    const value = settings[key];
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.round(Math.max(0, Math.min(1, value)) * 10) / 10 : defaults[key];
  };
  return {
    settings: {
      backgroundMusicEnabled: boolean('backgroundMusicEnabled'),
      backgroundMusicVolume: volume('backgroundMusicVolume'),
      clickSoundsEnabled: boolean('clickSoundsEnabled'),
      clickSoundVolume: volume('clickSoundVolume'),
      soundEffectsEnabled: boolean('soundEffectsEnabled'),
    },
    // v1 color-only preferences have no character IDs; keep their audio settings.
    characters: normalizeCharacterSelection(stored.characters),
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
