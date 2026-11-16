import type { ImageSourcePropType } from 'react-native';

export type CharacterId = 'sikouk' | 'bouhajra';

export interface Character {
  readonly id: CharacterId;
  readonly name: string;
  readonly color: string;
  readonly cardImage: ImageSourcePropType;
  readonly faceImage: ImageSourcePropType;
}

export interface CharacterSelection {
  readonly player1: CharacterId;
  readonly player2: CharacterId;
}

// Literal local paths let Metro include the original assets on every platform.
export const CHARACTERS: Readonly<Record<CharacterId, Character>> = {
  sikouk: {
    id: 'sikouk',
    name: 'سيكوك',
    color: '#0F766E',
    cardImage: require('../caracter/hero1.png'),
    faceImage: require('../caracter/hero1_face.png'),
  },
  bouhajra: {
    id: 'bouhajra',
    name: 'بوحجرة',
    color: '#7C3AED',
    cardImage: require('../caracter/hero2.png'),
    faceImage: require('../caracter/hero2_face.png'),
  },
};

export const CHARACTER_LIST: readonly Character[] = [CHARACTERS.sikouk, CHARACTERS.bouhajra];

export const DEFAULT_CHARACTER_SELECTION: CharacterSelection = {
  player1: 'sikouk',
  player2: 'bouhajra',
};

export const selectPlayer1Character = (player1: CharacterId): CharacterSelection => ({
  player1,
  player2: player1 === 'sikouk' ? 'bouhajra' : 'sikouk',
});

const isCharacterId = (value: unknown): value is CharacterId =>
  value === 'sikouk' || value === 'bouhajra';

export const normalizeCharacterSelection = (value: unknown): CharacterSelection => {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const { player1, player2 } = value as Record<string, unknown>;
    if (isCharacterId(player1) && isCharacterId(player2) && player1 !== player2) {
      return { player1, player2 };
    }
  }
  return { ...DEFAULT_CHARACTER_SELECTION };
};
