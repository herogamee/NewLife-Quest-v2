export const STORAGE_KEY = 'newlife.quest.v2.preferences';
export const DEFAULTS = Object.freeze({ music: true, sfx: true, musicVolume: .35, sfxVolume: .55, motion: true, fps: false });
export function preferences(input) {
  const data = input && typeof input === 'object' ? input : {};
  const result = { ...DEFAULTS };
  for (const key of ['music', 'sfx', 'motion', 'fps']) if (typeof data[key] === 'boolean') result[key] = data[key];
  for (const key of ['musicVolume', 'sfxVolume']) if (typeof data[key] === 'number' && Number.isFinite(data[key])) result[key] = Math.min(1, Math.max(0, data[key]));
  return result;
}
export function readPreferences(storage) {
  try { return preferences(JSON.parse(storage.getItem(STORAGE_KEY))); } catch { return preferences(); }
}
export function writePreferences(storage, data) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(preferences(data))); return true; } catch { return false; }
}
export const FEATURES = Object.freeze({
  adventure: { title: 'ผจญภัย', icon: '#i-map', description: 'เริ่มต้นจากกิลด์นักผจญภัย เตรียมอุปกรณ์ รับภารกิจ แล้วเดินทางไปค้นพบเรื่องราวในดันเจี้ยน', tags: ['กิลด์นักผจญภัย', 'ภารกิจ', 'ดันเจี้ยน'] },
  wardrobe: { title: 'แต่งตัวในแบบคุณ', icon: '#i-shirt', description: 'เลือกทรงผม เสื้อผ้า อาวุธ และเครื่องประดับ ให้ทุกการเดินทางมีสไตล์ที่เป็นของคุณ', tags: ['กระเป๋านักผจญภัย', 'แฟชั่น', 'อุปกรณ์'] },
  friends: { title: 'พบเพื่อนใหม่', icon: '#i-friends', description: 'จากเพื่อนร่วมผจญภัย สู่มิตรภาพในเมือง แวะตลาด เดินเล่นริมน้ำ แล้วพักผ่อนด้วยกันที่บ่อน้ำพุร้อน', tags: ['เพื่อน', 'เมืองเริ่มต้น', 'บ่อน้ำพุร้อน'] }
});
export const IMAGE_ASSETS = Object.freeze([
  'assets/art/riverside-town.webp', 'assets/art/newlife-logo.webp',
  'assets/art/adventurers-open.webp', 'assets/art/adventurers-blink.webp', 'assets/art/cloud.webp'
]);
export function sceneAssets(music = 'assets/audio/riverside-theme.ogg') {
  return [...IMAGE_ASSETS, 'assets/fonts/Mali-Bold.ttf', 'assets/fonts/NotoSansThaiLooped-Variable.ttf', music,
    'assets/audio/menu-click.wav', 'assets/audio/menu-enter.wav', 'assets/audio/menu-back.wav'];
}
export function loadingAssets(music = 'assets/audio/riverside-theme.ogg') {
  return [...sceneAssets(music), 'assets/art/loading-town.webp', 'assets/art/loading-cat.webp', ...GAME_IMAGE_ASSETS];
}
export const GAME_IMAGE_ASSETS=Object.freeze(['city-ground','male','female','blacksmith','auction-house','adventurer-guild','hall-of-fame','dungeon','market','academy','hot-springs','wedding-chapel','river-harbor','icon-buy-coin','icon-shop','icon-bag','icon-mail','icon-quests','icon-friends','icon-gifts','icon-news','icon-back','sword','potion','upgrade_stone','pet_fox','outfit','wings','fish','bag-stage','bag-slot','bag-header'].map(name=>`assets/game/${name}.webp`));
export function sceneFromHash(hash) { if(['#loading','#start'].includes(hash))return 'loading';const name=hash.slice(1);return ['login','register','character','confirm','city'].includes(name)?name:'home'; }
export function nextBlink(random = Math.random, character = 'male') {
  return (character === 'female' ? 3200 : 2500) + Math.floor(random() * 2800);
}
export async function loadResources(urls, { fetcher = fetch, signal, onProgress = () => {} } = {}) {
  const unique = [...new Set(urls)];
  const result = { loaded: [], failed: [] };
  let completed = 0;
  onProgress({ completed: 0, total: unique.length, percent: 0 });
  await Promise.all(unique.map(async url => {
    try {
      const response = await fetcher(url, { signal, cache: 'force-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = await response.arrayBuffer();
      if (!bytes.byteLength) throw new Error('Empty resource');
      result.loaded.push(url);
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError') throw error;
      result.failed.push(url);
    } finally {
      completed++;
      if (!signal?.aborted) onProgress({ completed, total: unique.length, percent: Math.round(completed / unique.length * 100) });
    }
  }));
  return result;
}
