const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const React = require('react');
const ts = require('typescript');

// Render the real components with native surfaces replaced by element tags.
// AppContent only needs state/ref hooks here; game timers are tested in the browser.
function harness() {
  const slots = [];
  let cursor = 0;
  const react = { ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
  };
  const native = new Proxy({
    StyleSheet: { create: (styles) => styles },
    useWindowDimensions: () => ({ width: 568, height: 320 }),
  }, { get: (target, key) => target[key] ?? key });
  const leaves = {
    './components/AudioManager': { AudioManagerProvider: 'AudioManagerProvider', useAudioManager: () => ({ previewClickSound() {}, updateSettings() {} }) },
    './components/Game': { Game: 'Game' },
    './components/GameResultScreen': { GameResultScreen: 'GameResultScreen' },
    './components/CharacterSelectionScreen': { CharacterSelectionScreen: 'CharacterSelectionScreen' },
    './components/BoardModeSelectionScreen': { BoardModeSelectionScreen: 'BoardModeSelectionScreen' },
    './components/HomeScreen': { HomeScreen: 'HomeScreen' },
    './components/SettingsScreen': { SettingsScreen: 'SettingsScreen' },
    './utils/preferences': { savePreferences: async () => {} },
  };
  const cache = new Map();
  function load(file) {
    const filename = path.resolve(__dirname, '..', file);
    if (cache.has(filename)) return cache.get(filename);
    const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    const localRequire = (name) => {
      if (name === 'react') return react;
      if (name === 'react-native') return native;
      if (name === 'react-native-svg') return { __esModule: true, default: 'Svg', Path: 'Path' };
      if (name === 'expo-status-bar') return { StatusBar: 'StatusBar' };
      if (name.endsWith('.png')) return name;
      if (leaves[name]) return leaves[name];
      const target = path.resolve(path.dirname(filename), name);
      return load(path.relative(path.resolve(__dirname, '..'), `${target}.ts`));
    };
    new Function('require', 'module', 'exports', `${source}\n${file === 'App.tsx' ? 'module.exports.AppContent = AppContent;' : ''}`)(localRequire, module, module.exports);
    cache.set(filename, module.exports);
    return module.exports;
  }
  return { load, render(component, props) { cursor = 0; return component(props); } };
}

function nodes(element) {
  if (!element || typeof element !== 'object') return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return [element, ...nodes(element.props?.children)];
}
const find = (tree, type) => nodes(tree).find((node) => node.type === type);
const text = (element) => element == null || typeof element === 'boolean' ? ''
  : Array.isArray(element) ? element.map(text).join('')
    : typeof element === 'object' ? text(element.props?.children) : String(element);

test('both assignments keep character identity, central colors and opponent roles together', () => {
  const { load } = harness();
  const { createMatchPlayers } = load('components/MatchPlayers.ts');
  const { CHARACTERS, selectPlayer1Character } = load('components/Characters.ts');
  for (const characterId of ['sikouk', 'bouhajra']) {
    for (const mode of ['local', 'cpu']) {
      const selection = selectPlayer1Character(characterId);
      const players = createMatchPlayers(selection, mode);
      assert.equal(players[0].characterId, selection.player1);
      assert.equal(players[1].characterId, selection.player2);
      assert.equal(players[0].name, 'اللاعب 1');
      assert.equal(players[1].name, mode === 'cpu' ? 'الهاتف' : 'اللاعب 2');
      assert.ok(players.every((p) => p.score === 0 && p.color === CHARACTERS[p.characterId].color));
    }
  }
});

test('result uses the match identities and scores, crowns only the winner and preserves early-finish meaning', () => {
  const { load, render } = harness();
  const { createMatchPlayers } = load('components/MatchPlayers.ts');
  const { GameResultScreen } = load('components/GameResultScreen.tsx');
  const { getBoardMode } = load('components/BoardModes.ts');
  const players = createMatchPlayers({ player1: 'bouhajra', player2: 'sikouk' }, 'cpu');
  players[0].score = 2;
  players[1].score = 8;
  let changed = false;
  const props = { players, boardMode: getBoardMode('quick'), endedEarly: true, onChangeCharacters: () => { changed = true; } };
  const tree = render(GameResultScreen, props);
  assert.match(text(tree), /الفائز: سيكوك · الهاتف/);
  assert.match(text(tree), /حُسمت المباراة مبكراً لأن التعادل لم يعد ممكناً/);
  assert.match(text(tree), /المربعات المحسومة: 10 \/ 12/);
  assert.deepEqual(nodes(tree).filter((n) => n.type === 'Image').map((n) => n.props.source), ['../caracter/hero2_face.png', '../caracter/hero1_face.png']);
  assert.equal(nodes(tree).filter((n) => n.type === 'Svg').length, 1);
  const winner = nodes(tree).find((n) => n.props?.accessibilityLabel?.endsWith('، الفائز'));
  assert.ok(winner.props.style.some((style) => style.borderColor === '#D4AF37'));
  nodes(tree).find((n) => n.type === 'TouchableOpacity' && text(n) === 'تغيير الشخصيات').props.onPress();
  assert.ok(changed);
  for (const score of [0, 6]) {
    const drawTree = render(GameResultScreen, { ...props, endedEarly: false, players: players.map((p) => ({ ...p, score })) });
    assert.match(text(drawTree), /تعادل اللاعبان/);
    assert.equal(nodes(drawTree).filter((n) => n.type === 'Svg').length, 0);
    assert.doesNotMatch(text(drawTree), /حُسمت المباراة مبكراً/);
  }
});

test('App passes IDs to the game and retains all match settings through replay and character changes', () => {
  for (const opponentMode of ['local', 'cpu']) {
    const { load, render } = harness();
    const { AppContent } = load('App.tsx');
    const { createMatchPlayers } = load('components/MatchPlayers.ts');
    const selection = { player1: 'bouhajra', player2: 'sikouk' };
    const props = { initialPreferences: { settings: {}, characters: selection } };
    let tree = render(AppContent, props);
    find(tree, 'HomeScreen').props.onStartGame();
    tree = render(AppContent, props);
    find(tree, 'BoardModeSelectionScreen').props.onContinue('cards', opponentMode, 'expert', 'player2');
    tree = render(AppContent, props);
    find(tree, 'CharacterSelectionScreen').props.onStartGame();
    tree = render(AppContent, props);
    const game = find(tree, 'Game').props;
    assert.equal(game.player1CharacterId, 'bouhajra');
    assert.equal(game.player2CharacterId, 'sikouk');
    const players = createMatchPlayers(selection, opponentMode).map((p) => ({ ...p, score: p.id === 1 ? 15 : 2 }));
    game.onGameEnd(players, true);
    tree = render(AppContent, props);
    assert.deepEqual(find(tree, 'GameResultScreen').props.players, players);
    assert.equal(find(tree, 'GameResultScreen').props.endedEarly, true);
    find(tree, 'GameResultScreen').props.onPlayAgain();
    tree = render(AppContent, props);
    const replay = find(tree, 'Game').props;
    for (const key of ['player1CharacterId', 'player2CharacterId', 'boardMode', 'opponentMode', 'cpuDifficulty', 'startingPlayer']) assert.deepEqual(replay[key], game[key]);
    replay.onGameEnd(players, true);
    tree = render(AppContent, props);
    find(tree, 'GameResultScreen').props.onChangeCharacters();
    tree = render(AppContent, props);
    const chooser = find(tree, 'CharacterSelectionScreen').props;
    assert.deepEqual(chooser.selection, selection);
    chooser.onSelectionChange({ player1: 'sikouk', player2: 'bouhajra' });
    tree = render(AppContent, props);
    find(tree, 'CharacterSelectionScreen').props.onStartGame();
    tree = render(AppContent, props);
    const next = find(tree, 'Game').props;
    assert.equal(next.player1CharacterId, 'sikouk');
    assert.equal(next.player2CharacterId, 'bouhajra');
    for (const key of ['boardMode', 'opponentMode', 'cpuDifficulty', 'startingPlayer']) assert.deepEqual(next[key], game[key]);
    assert.ok(createMatchPlayers({ player1: next.player1CharacterId, player2: next.player2CharacterId }, opponentMode).every((p) => p.score === 0));
  }
});
