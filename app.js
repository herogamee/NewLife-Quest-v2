import { FEATURES, readPreferences, writePreferences, loadingAssets, sceneFromHash } from './core.js?v=flow1';
import { Soundscape } from './audio.js';
import { LivingWorld, FrameMeter } from './world.js';
import { LoadingSession } from './loader.js';
import { LandscapeMode } from './orientation.js';
import { createGameUI } from './game.js?v=flow1';

const $ = id => document.getElementById(id);
let storage;
try { storage = localStorage; } catch { storage = null; }
const settings = readPreferences(storage);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const portrait = matchMedia('(max-width: 900px) and (orientation: portrait)');
const world = new LivingWorld($('world-effects'), $('adventurers'));
const loadingWorld = new LivingWorld($('loading-effects'), null, { river: true });
const frameMeter = new FrameMeter($('performance-meter'));
const audio = new Soundscape(settings, updateSoundUI);
const sharedHeader = document.querySelector('.site-header');
const triggers = new WeakMap();
let activeScene = 'home', toastTimer, hintTimer, hintIndex = 0;
let sessionStore;try { sessionStore=sessionStorage; } catch { sessionStore=null; }
const gameUI=createGameUI({storage,sessionStorage:sessionStore,audio,toast,navigate,openDialog});
const landscape = new LandscapeMode({ document, orientation: screen.orientation,
  isMobile: () => matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent),
  isActive: () => activeScene !== 'home' });
const hints = ['พบเพื่อนใหม่ แล้วออกผจญภัยไปด้วยกัน', 'แวะกิลด์นักผจญภัย ก่อนเริ่มเรื่องราวบทใหม่', 'เสื้อผ้าและอุปกรณ์ เล่าเรื่องราวในแบบคุณ', 'พักสักนิด แล้วค่อยออกเดินทางต่อ'];
const loader = new LoadingSession({ onState: renderLoading, prepare: prepareLoadingArt });

function persist() { writePreferences(storage, settings); }
function toast(message) {
  $('toast').textContent = message; $('toast').classList.add('is-visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('is-visible'), 2600);
}
function updateSoundUI(reason) {
  const playing = audio.playing && settings.music;
  $('music-toggle').setAttribute('aria-pressed', String(playing));
  $('music-toggle').setAttribute('aria-label', playing ? 'ปิดเพลง' : 'เปิดเพลง');
  $('music-label').textContent = playing ? 'เพลงเปิด' : 'เปิดเพลง';
  $('sfx-toggle').setAttribute('aria-pressed', String(settings.sfx));
  $('sfx-toggle').setAttribute('aria-label', `เสียงปุ่ม: ${settings.sfx ? 'เปิด' : 'ปิด'}`);
  $('sound-hint').querySelector('span').textContent = playing ? 'Riverside Morning · บทเพลงแห่งการเริ่มต้น' : 'เปิดเพลง แล้วออกเดินทางไปด้วยกัน';
  if (reason === 'music-error') toast('โหลดเพลงไม่สำเร็จ ลองกดเปิดเพลงอีกครั้ง');
  if (reason === 'play-blocked') $('sound-hint').querySelector('span').textContent = 'แตะปุ่มเปิดเพลง เพื่อเริ่มฟัง';
}
function updateHints() {
  clearInterval(hintTimer);
  if (activeScene !== 'loading' || document.hidden || portrait.matches || !settings.motion || reduceMotion.matches) return;
  hintTimer = setInterval(() => { hintIndex = (hintIndex + 1) % hints.length; $('loading-hint').textContent = hints[hintIndex]; }, 8000);
}
function updateMotion() {
  const enabled = settings.motion && !reduceMotion.matches;
  document.body.dataset.motion = enabled ? 'on' : 'off';
  document.body.dataset.paused = String(document.hidden);
  $('motion-toggle').checked = enabled; $('motion-toggle').disabled = reduceMotion.matches;
  $('motion-toggle').title = reduceMotion.matches ? 'อุปกรณ์นี้เปิดโหมดลดภาพเคลื่อนไหว' : '';
  world.update(enabled, document.hidden || activeScene !== 'home');
  loadingWorld.update(enabled, document.hidden || activeScene !== 'loading' || portrait.matches);
  frameMeter.update(settings.fps); updateHints();
  if (!enabled) resetPointer();
}
function resetPointer() {
  document.documentElement.style.setProperty('--pointer-x', '0px');
  document.documentElement.style.setProperty('--pointer-y', '0px');
}
function syncOrientation(focus = false) {
  const show = activeScene !== 'home' && portrait.matches;
  const wasShown = !$('rotate-notice').hidden;
  $('rotate-notice').hidden = !show;
  for(const id of ['loading-page','login-page','wizard-page','city-page'])$(id).inert=show;
  $('loading-page').classList.toggle('orientation-blocked', show);
  $('rotate-try').hidden = !landscape.available;
  if (focus && show) $('rotate-title').focus({ preventScroll: true });
  else if (focus && wasShown && activeScene !== 'home') $(activeScene==='loading'?'loading-heading':gameUI.focusTarget(activeScene)).focus({ preventScroll: true });
  if(show)for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
}
function openDialog(dialog, trigger) {
  if (dialog.open) return;
  triggers.set(dialog, trigger || document.activeElement);
  dialog.showModal(); audio.duck(true);
}
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) { audio.gesture(); audio.effect('back'); dialog.close(); }
  });
  dialog.addEventListener('cancel', () => { audio.gesture(); audio.effect('back'); });
  dialog.addEventListener('close', () => { audio.duck(false); triggers.get(dialog)?.focus({ preventScroll: true }); });
}
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => {
  audio.gesture(); audio.effect('back'); button.closest('dialog').close();
}));
$('music-toggle').addEventListener('click', () => { audio.setMusic(!audio.unlocked || !audio.playing); audio.effect(); persist(); });
$('sfx-toggle').addEventListener('click', () => {
  settings.sfx = !settings.sfx; audio.gesture(); if (settings.sfx) audio.effect();
  updateSoundUI(); persist(); toast(settings.sfx ? 'เปิดเสียงกดปุ่มแล้ว' : 'ปิดเสียงกดปุ่มแล้ว');
});
$('settings-button').addEventListener('click', () => { audio.gesture(); audio.effect(); openDialog($('settings-dialog'), $('settings-button')); });
for (const [id, key] of [['music-volume', 'musicVolume'], ['sfx-volume', 'sfxVolume']]) {
  $(id).value = String(Math.round(settings[key] * 100)); $(`${id}-value`).value = `${$(id).value}%`;
  $(id).addEventListener('input', () => {
    settings[key] = Number($(id).value) / 100; $(`${id}-value`).value = `${$(id).value}%`;
    audio.setVolumes(); persist();
  });
  $(id).addEventListener('change', () => { audio.gesture(); audio.effect(); });
}
$('motion-toggle').addEventListener('change', () => { settings.motion = $('motion-toggle').checked; updateMotion(); persist(); audio.gesture(); audio.effect(); });
$('fps-toggle').checked = settings.fps;
$('fps-toggle').addEventListener('change', () => { settings.fps = $('fps-toggle').checked; frameMeter.update(settings.fps); persist(); audio.gesture(); audio.effect(); });
for (const button of document.querySelectorAll('[data-feature]')) button.addEventListener('click', () => {
  const feature = FEATURES[button.dataset.feature]; audio.gesture(); audio.effect();
  $('feature-title').textContent = feature.title; $('feature-icon').setAttribute('href', feature.icon);
  $('feature-description').textContent = feature.description;
  $('feature-tags').replaceChildren(...feature.tags.map(tag => { const element = document.createElement('span'); element.textContent = tag; return element; }));
  openDialog($('feature-dialog'), button);
});

function renderLoading(state) {
  if (activeScene !== 'loading') return;
  $('loading-page').dataset.state = state.phase;
  $('loading-panel').setAttribute('aria-busy', String(['loading', 'preparing'].includes(state.phase)));
  $('loading-progress').value = state.percent; $('loading-percent').value = `${state.percent}%`;
  $('loading-panel').style.setProperty('--load-progress', `${state.percent}%`);
  $('loading-actions').hidden = state.phase !== 'error'; $('loading-next').hidden = state.phase !== 'ready';
  if (state.phase === 'error') {
    $('loading-heading').textContent = 'การเชื่อมต่อสะดุดนิดหน่อย';
    $('loading-phase').textContent = state.failure === 'prepare' ? 'จัดเตรียมภาพไม่สำเร็จ ลองโหลดอีกครั้งได้เลย' : 'บางไฟล์ยังโหลดไม่สำเร็จ ลองอีกครั้งได้เลย';
    $('loading-file-status').textContent = `โหลดสำเร็จ ${state.completed} / ${state.total} ไฟล์`;
  } else if (state.phase === 'ready') {
    $('loading-heading').textContent = 'เตรียมข้อมูลเรียบร้อยแล้ว';
    $('loading-phase').textContent = 'ฉาก ภาพตัวละคร ฟอนต์ และเสียง พร้อมแล้ว';
    $('loading-file-status').textContent = `โหลดทรัพยากรครบ ${state.total} / ${state.total} ไฟล์`;
  } else {
    $('loading-heading').textContent = 'กำลังเตรียมการผจญภัย';
    $('loading-phase').textContent = state.phase === 'preparing' ? 'กำลังจัดฉากและตรวจภาพ…' : 'กำลังโหลดข้อมูลเกม…';
    $('loading-file-status').textContent = `ตรวจและโหลดไฟล์ ${state.completed} / ${state.total}`;
  }
}
async function prepareLoadingArt(signal) {
  await Promise.all([$('loading-town'), $('loading-cat')].map(async image => {
    if (signal.aborted) throw signal.reason;
    if (image.decode) await image.decode();
    else if (!image.complete || !image.naturalWidth) await new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', reject, { once: true });
    });
    if (!image.naturalWidth) throw new Error('Image not decoded');
  }));
  if (document.fonts?.load) await Promise.all([document.fonts.load('700 24px Mali'), document.fonts.load('400 20px NotoThai')]);
  if (signal.aborted) throw signal.reason;
}
function beginLoad() { return loader.start(loadingAssets(audio.music.src.endsWith('.mp3') ? 'assets/audio/riverside-theme.mp3' : 'assets/audio/riverside-theme.ogg')); }
function renderRoute({ initial = false } = {}) {
  const requested=sceneFromHash(location.hash),next=gameUI.resolveRoute(requested);
  if(next!==requested)history.replaceState(null,'','#'+next);
  if (!initial && next === activeScene) return;
  for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
  gameUI.leave();
  activeScene = next;
  $('home').hidden = next !== 'home'; $('loading-page').hidden = next !== 'loading';
  document.body.dataset.scene = next;
  document.querySelector('.edition').hidden = next !== 'home'; $('route-back').hidden = next === 'home'||next==='city';
  gameUI.show(next);
  const skip=document.querySelector('.skip-link');skip.href=next==='home'?'#start-button':next==='loading'?'#loading-heading':'#'+gameUI.focusTarget(next);skip.textContent=next==='home'?'ข้ามไปปุ่มเริ่มเล่นเกม':'ข้ามไปเนื้อหาหลัก';
  if (next === 'loading') {
    $('loading-controls').append(sharedHeader);
    for (const image of [$('loading-town'), $('loading-cat')]) if (!image.getAttribute('src')) image.src = image.dataset.src;
    loadingWorld.resize(); document.title = 'NewLife Quest — กำลังเตรียมการผจญภัย';
    beginLoad(); if (!initial) $('loading-heading').focus({ preventScroll: true });
  } else if(next==='home') {
    loader.cancel(); landscape.release(); $('header-home-slot').after(sharedHeader);
    world.resize(); document.title = 'NewLife Quest — เริ่มต้นการผจญภัย';
    if (!initial) $('start-button').focus({ preventScroll: true });
  } else {
    loader.cancel();const slot=next==='city'?'city-controls':next==='login'?'login-controls':'wizard-controls';$(slot).append(sharedHeader);
    const title=next==='city'?'เมืองริมน้ำ':next==='login'?'เข้าสู่เกม':'เริ่มต้นการผจญภัย';document.title=`NewLife Quest — ${title}`;
    if(!initial)$(gameUI.focusTarget(next)).focus({preventScroll:true});
  }
  resetPointer(); syncOrientation(!initial); updateMotion(); window.scrollTo(0, 0);
}
function navigate(next){history.pushState({nlqRoute:next},'','#'+next);renderRoute();}
function launch() {
  audio.gesture(); audio.effect('enter'); if (activeScene === 'loading') return;
  history.pushState({ nlqRoute: 'loading', fromHome: true }, '', '#loading'); renderRoute(); landscape.request();
}
function goHome() {
  audio.gesture(); audio.effect('back'); loader.cancel(); landscape.release();
  history.pushState(null, '', location.pathname + location.search); renderRoute();
}
$('start-button').addEventListener('click', launch);
$('feature-start').addEventListener('click', () => { $('feature-dialog').close(); launch(); });
$('route-back').addEventListener('click', goHome);
$('loading-brand').addEventListener('click', event => { event.preventDefault(); goHome(); });
$('loading-retry').addEventListener('click', () => { audio.gesture(); audio.effect('enter'); beginLoad(); });
$('loading-next').addEventListener('click',()=>{audio.gesture();audio.effect('enter');navigate(gameUI.hasSession()?'city':'login');});
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();const target=$(event.currentTarget.getAttribute('href').slice(1));target?.focus({preventScroll:false});});
$('rotate-back').addEventListener('click', goHome);
$('rotate-try').addEventListener('click', async () => { audio.gesture(); audio.effect(); if (!await landscape.request()) toast('หมุนโทรศัพท์เป็นแนวนอน เพื่อไปต่อได้เลย'); });
addEventListener('hashchange', () => renderRoute()); addEventListener('popstate', () => renderRoute());
portrait.addEventListener('change', () => { syncOrientation(true); updateMotion(); });
document.addEventListener('visibilitychange', () => { updateMotion(); audio.visibility(document.hidden); });
reduceMotion.addEventListener('change', updateMotion);
document.addEventListener('pointermove', event => {
  if (!finePointer.matches || !settings.motion || reduceMotion.matches || document.hidden || document.querySelector('dialog[open]')) return;
  document.documentElement.style.setProperty('--pointer-x', `${(event.clientX / innerWidth - .5) * -16}px`);
  document.documentElement.style.setProperty('--pointer-y', `${(event.clientY / innerHeight - .5) * -10}px`);
}, { passive: true });
document.addEventListener('pointerleave', resetPointer);
updateSoundUI(); renderRoute({ initial: true });
