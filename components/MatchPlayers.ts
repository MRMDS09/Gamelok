import type { OpponentMode } from './BoardModes';
import { CHARACTERS, CharacterId, CharacterSelection } from './Characters';

// The player label describes their role; character identity stays separate.
export interface Player {
  id: number;
  name: string;
  characterId: CharacterId;
  score: number;
  color: string;
}

export const createMatchPlayers = (characters: CharacterSelection, opponentMode: OpponentMode): Player[] => [
  { id: 1, name: 'اللاعب 1', characterId: characters.player1, score: 0, color: CHARACTERS[characters.player1].color },
  {
    id: 2,
    name: opponentMode === 'cpu' ? 'الهاتف' : 'اللاعب 2',
    characterId: characters.player2,
    score: 0,
    color: CHARACTERS[characters.player2].color,
  },
];

export const getMatchResult = (players: readonly Player[]) => {
  const [player1, player2] = players;
  if (player1.score === player2.score) return { type: 'draw' as const };
  return { type: 'winner' as const, winner: player1.score > player2.score ? player1 : player2 };
};
