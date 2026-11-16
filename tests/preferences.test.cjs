const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Run the actual TypeScript storage code with an in-memory native-storage adapter.
function loadModule(relativePath, storage) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (name) => {
    if (name === '@react-native-async-storage/async-storage') return storage;
    if (name === '../components/Characters') return loadModule('components/Characters.ts', storage);
    if (name.startsWith('../caracter/') && name.endsWith('.png')) return name;
    throw new Error(`Unexpected runtime dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', source)(localRequire, module, module.exports);
  return module.exports;
}

function memoryStorage(initial = null) {
  let value = initial;
  return {
    async getItem() { return value; },
    async setItem(_key, next) { value = next; },
  };
}

test('first launch and malformed JSON use defaults', async () => {
  for (const value of [null, '{bad json', 'null', '[]']) {
    const api = loadModule('utils/preferences.ts', memoryStorage(value));
    assert.deepEqual(await api.loadPreferences(), api.DEFAULT_PREFERENCES);
  }
});

test('sound toggles, zero volume and swapped characters survive a fresh app session', async () => {
  const storage = memoryStorage();
  const first = loadModule('utils/preferences.ts', storage);
  const preferences = {
    settings: {
      backgroundMusicEnabled: false, backgroundMusicVolume: 0,
      clickSoundsEnabled: false, clickSoundVolume: 0.3, soundEffectsEnabled: false,
    },
    characters: { player1: 'bouhajra', player2: 'sikouk' },
  };
  await first.savePreferences(preferences);
  const reopened = loadModule('utils/preferences.ts', storage);
  assert.deepEqual(await reopened.loadPreferences(), preferences);
});

test('invalid audio fields fall back independently', () => {
  const api = loadModule('utils/preferences.ts', memoryStorage());
  const value = api.normalizePreferences({
    settings: { backgroundMusicEnabled: 'false', backgroundMusicVolume: 9, clickSoundVolume: NaN, soundEffectsEnabled: false },
    characters: { player1: 'bouhajra', player2: 'sikouk' },
  });
  assert.equal(value.settings.backgroundMusicEnabled, true);
  assert.equal(value.settings.backgroundMusicVolume, 1);
  assert.equal(value.settings.clickSoundVolume, 0.8);
  assert.equal(value.settings.soundEffectsEnabled, false);
  assert.deepEqual(value.characters, { player1: 'bouhajra', player2: 'sikouk' });
});

test('missing, invalid, partial and duplicate character IDs use the valid default pair', () => {
  const api = loadModule('utils/preferences.ts', memoryStorage());
  for (const characters of [
    undefined, null, [], 'sikouk', {},
    { player1: 'sikouk' }, { player2: 'sikouk' },
    { player1: 'unknown', player2: 'sikouk' },
    { player1: 'bouhajra', player2: '__proto__' },
    { player1: 'sikouk', player2: 'sikouk' },
    { player1: 'bouhajra', player2: 'bouhajra' },
  ]) {
    assert.deepEqual(api.normalizePreferences({ characters }).characters, api.DEFAULT_PREFERENCES.characters);
  }
});

test('legacy color preferences keep all audio settings and migrate on the existing storage key', async () => {
  const settings = {
    backgroundMusicEnabled: false, backgroundMusicVolume: 0,
    clickSoundsEnabled: false, clickSoundVolume: 0.2, soundEffectsEnabled: false,
  };
  const storage = memoryStorage(JSON.stringify({ settings, colors: { player1: '#388E3C', player2: '#F57C00' } }));
  const getItem = storage.getItem;
  const setItem = storage.setItem;
  storage.getItem = async (key) => {
    assert.equal(key, '@gamelok/preferences/v1');
    return getItem();
  };
  storage.setItem = async (key, value) => {
    assert.equal(key, '@gamelok/preferences/v1');
    return setItem(key, value);
  };
  const api = loadModule('utils/preferences.ts', storage);
  const migrated = await api.loadPreferences();
  assert.deepEqual(migrated.settings, settings);
  assert.deepEqual(migrated.characters, { player1: 'sikouk', player2: 'bouhajra' });
  const changed = { ...migrated, characters: { player1: 'bouhajra', player2: 'sikouk' } };
  await api.savePreferences(changed);
  assert.deepEqual(await loadModule('utils/preferences.ts', storage).loadPreferences(), changed);
});

test('choosing either character assigns the other player a different character and central color', () => {
  const { CHARACTERS, selectPlayer1Character } = loadModule('components/Characters.ts');
  assert.deepEqual(selectPlayer1Character('sikouk'), { player1: 'sikouk', player2: 'bouhajra' });
  assert.deepEqual(selectPlayer1Character('bouhajra'), { player1: 'bouhajra', player2: 'sikouk' });
  assert.equal(CHARACTERS.sikouk.color, '#0F766E');
  assert.equal(CHARACTERS.bouhajra.color, '#7C3AED');
});

test('rapid changes are written in order, leaving the latest selection on disk', async () => {
  const storage = memoryStorage();
  const originalSet = storage.setItem;
  let releaseFirst;
  const held = new Promise((resolve) => { releaseFirst = resolve; });
  let count = 0;
  storage.setItem = async (...args) => {
    if (++count === 1) await held;
    await originalSet(...args);
  };
  const api = loadModule('utils/preferences.ts', storage);
  const first = api.savePreferences(api.DEFAULT_PREFERENCES);
  const latest = { ...api.DEFAULT_PREFERENCES, characters: { player1: 'bouhajra', player2: 'sikouk' } };
  const second = api.savePreferences(latest);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(count, 1);
  releaseFirst();
  await Promise.all([first, second]);
  assert.deepEqual(await api.loadPreferences(), latest);
});

test('saving audio after changing characters preserves both preferences', async () => {
  const api = loadModule('utils/preferences.ts', memoryStorage());
  const selected = { ...api.DEFAULT_PREFERENCES, characters: { player1: 'bouhajra', player2: 'sikouk' } };
  await api.savePreferences(selected);
  const updated = { ...selected, settings: { ...selected.settings, backgroundMusicEnabled: false, clickSoundVolume: 0 } };
  await api.savePreferences(updated);
  assert.deepEqual(await api.loadPreferences(), updated);
});

test('a failed write is reported and does not prevent later saves', async () => {
  const storage = memoryStorage();
  const set = storage.setItem;
  let fail = true;
  storage.setItem = async (...args) => {
    if (fail) { fail = false; throw new Error('disk full'); }
    return set(...args);
  };
  const api = loadModule('utils/preferences.ts', storage);
  await assert.rejects(api.savePreferences(api.DEFAULT_PREFERENCES), /disk full/);
  await api.savePreferences(api.DEFAULT_PREFERENCES);
  assert.deepEqual(await api.loadPreferences(), api.DEFAULT_PREFERENCES);
});

test('storage read failures are reported without overwriting stored data', async () => {
  let writes = 0;
  const api = loadModule('utils/preferences.ts', {
    async getItem() { throw new Error('storage unavailable'); },
    async setItem() { writes++; },
  });
  await assert.rejects(api.loadPreferences(), /storage unavailable/);
  assert.equal(writes, 0);
});
