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
    if (name === '../components/theme') return loadModule('components/theme.ts', storage);
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

test('sound toggles, zero volume and player colors survive a fresh app session', async () => {
  const storage = memoryStorage();
  const first = loadModule('utils/preferences.ts', storage);
  const preferences = {
    settings: {
      backgroundMusicEnabled: false, backgroundMusicVolume: 0,
      clickSoundsEnabled: false, clickSoundVolume: 0.3, soundEffectsEnabled: false,
    },
    colors: { player1: '#388E3C', player2: '#F57C00' },
  };
  await first.savePreferences(preferences);
  const reopened = loadModule('utils/preferences.ts', storage);
  assert.deepEqual(await reopened.loadPreferences(), preferences);
});

test('invalid fields fall back independently and duplicate colors are repaired', () => {
  const api = loadModule('utils/preferences.ts', memoryStorage());
  const value = api.normalizePreferences({
    settings: { backgroundMusicEnabled: 'false', backgroundMusicVolume: 9, clickSoundVolume: NaN, soundEffectsEnabled: false },
    colors: { player1: '#2979ff', player2: '#2979FF' },
  });
  assert.equal(value.settings.backgroundMusicEnabled, true);
  assert.equal(value.settings.backgroundMusicVolume, 1);
  assert.equal(value.settings.clickSoundVolume, 0.8);
  assert.equal(value.settings.soundEffectsEnabled, false);
  assert.notEqual(value.colors.player1.toLowerCase(), value.colors.player2.toLowerCase());
  assert.deepEqual(api.normalizePreferences({ colors: { player1: 'invalid' } }).colors, api.DEFAULT_PREFERENCES.colors);
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
  const latest = { ...api.DEFAULT_PREFERENCES, colors: { player1: '#388E3C', player2: '#F57C00' } };
  const second = api.savePreferences(latest);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(count, 1);
  releaseFirst();
  await Promise.all([first, second]);
  assert.deepEqual(await api.loadPreferences(), latest);
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
