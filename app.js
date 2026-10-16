import { FEATURES, readPreferences, writePreferences, sceneAssets, loadResources } from './core.js';
import { Soundscape } from './audio.js';
import { LivingWorld, FrameMeter } from './world.js';

const $ = id => document.getElementById(id);
let storage;
try { storage = localStorage; } catch { storage = null; }
const settings = readPreferences(storage);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const world = new LivingWorld($('world-effects'), $('adventurers'));
const frameMeter = new FrameMeter($('performance-meter'));
const audio = new Soundscape(settings, updateSoundUI);
let toastTimer, loadController;
const triggers = new WeakMap();

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
function updateMotion() {
  const enabled = settings.motion && !reduceMotion.matches;
  document.body.dataset.motion = enabled ? 'on' : 'off';
  document.body.dataset.paused = String(document.hidden);
  $('motion-toggle').checked = enabled;
  $('motion-toggle').disabled = reduceMotion.matches;
  $('motion-toggle').title = reduceMotion.matches ? 'อุปกรณ์นี้เปิดโหมดลดภาพเคลื่อนไหว' : '';
  world.update(enabled);
  frameMeter.update(settings.fps);
  if (!enabled) { document.documentElement.style.setProperty('--pointer-x', '0px'); document.documentElement.style.setProperty('--pointer-y', '0px'); }
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
  dialog.addEventListener('close', () => {
    audio.duck(false); triggers.get(dialog)?.focus({ preventScroll: true });
    if (dialog === $('launch-dialog')) {
      loadController?.abort();
      if (location.hash === '#start') history.replaceState(null, '', location.pathname + location.search);
    }
  });
}
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => {
  audio.gesture(); audio.effect('back'); button.closest('dialog').close();
}));
$('music-toggle').addEventListener('click', () => {
  const enabled = !audio.unlocked || !audio.playing;
  audio.setMusic(enabled); audio.effect(); persist();
});
$('sfx-toggle').addEventListener('click', () => {
  settings.sfx = !settings.sfx; audio.gesture(); if (settings.sfx) audio.effect();
  updateSoundUI(); persist(); toast(settings.sfx ? 'เปิดเสียงกดปุ่มแล้ว' : 'ปิดเสียงกดปุ่มแล้ว');
});
$('settings-button').addEventListener('click', () => { audio.gesture(); audio.effect(); openDialog($('settings-dialog'), $('settings-button')); });
for (const [id, key] of [['music-volume', 'musicVolume'], ['sfx-volume', 'sfxVolume']]) {
  $(id).value = String(Math.round(settings[key] * 100));
  $(`${id}-value`).value = `${$(id).value}%`;
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
  const feature = FEATURES[button.dataset.feature];
  audio.gesture(); audio.effect();
  $('feature-title').textContent = feature.title;
  $('feature-icon').setAttribute('href', feature.icon);
  $('feature-description').textContent = feature.description;
  $('feature-tags').replaceChildren(...feature.tags.map(tag => { const element = document.createElement('span'); element.textContent = tag; return element; }));
  openDialog($('feature-dialog'), button);
});

async function prepareLaunch() {
  loadController?.abort();
  const controller = new AbortController(); loadController = controller;
  const dialog = $('launch-dialog'); dialog.dataset.state = 'loading'; dialog.setAttribute('aria-busy', 'true');
  $('launch-title').textContent = 'เตรียมตัวออกเดินทาง';
  $('launch-description').textContent = 'กำลังตรวจและโหลดทรัพยากรของหน้าเริ่มเกม';
  $('launch-progress').value = 0; $('load-status').textContent = 'กำลังเตรียมไฟล์…';
  $('build-note').hidden = true; $('launch-retry').hidden = true;
  try {
    const result = await loadResources(sceneAssets(audio.music.src.endsWith('.mp3') ? 'assets/audio/riverside-theme.mp3' : 'assets/audio/riverside-theme.ogg'), {
      signal: controller.signal,
      onProgress: ({ completed, total, percent }) => {
        if (controller.signal.aborted || !dialog.open) return;
        $('launch-progress').value = percent;
        $('load-status').textContent = `โหลดทรัพยากร ${completed} / ${total} ไฟล์ · ${percent}%`;
      }
    });
    if (controller.signal.aborted || !dialog.open) return;
    if (result.failed.length) {
      dialog.dataset.state = 'error'; $('launch-title').textContent = 'มีบางไฟล์ยังโหลดไม่สำเร็จ';
      $('launch-description').textContent = 'ตรวจการเชื่อมต่อ แล้วลองโหลดอีกครั้งได้เลย';
      $('load-status').textContent = `โหลดสำเร็จ ${result.loaded.length} ไฟล์ · ไม่สำเร็จ ${result.failed.length} ไฟล์`;
      $('launch-retry').hidden = false;
    } else {
      dialog.dataset.state = 'ready'; $('launch-title').textContent = 'พร้อมสำหรับก้าวต่อไป';
      $('launch-description').textContent = 'ฉาก ภาพตัวละคร ฟอนต์ และเสียง โหลดครบแล้ว';
      $('build-note').hidden = false;
    }
  } catch (error) {
    if (error.name !== 'AbortError' && !controller.signal.aborted) {
      dialog.dataset.state = 'error'; $('launch-title').textContent = 'โหลดข้อมูลไม่สำเร็จ';
      $('load-status').textContent = 'ลองโหลดอีกครั้งได้เลย'; $('launch-retry').hidden = false;
    }
  } finally { if (loadController === controller) dialog.setAttribute('aria-busy', 'false'); }
}
function launch(trigger, updateHash = true) {
  if ($('launch-dialog').open) return;
  audio.gesture(); audio.effect('enter');
  openDialog($('launch-dialog'), trigger);
  if (updateHash && location.hash !== '#start') history.pushState(null, '', '#start');
  prepareLaunch();
}
$('start-button').addEventListener('click', () => launch($('start-button')));
$('feature-start').addEventListener('click', () => { $('feature-dialog').close(); launch($('start-button')); });
$('launch-retry').addEventListener('click', () => { audio.gesture(); audio.effect('enter'); prepareLaunch(); });
addEventListener('hashchange', () => { if (location.hash !== '#start' && $('launch-dialog').open) $('launch-dialog').close(); else if (location.hash === '#start') launch($('start-button'), false); });
document.addEventListener('visibilitychange', () => { document.body.dataset.paused = String(document.hidden); world.update(settings.motion && !reduceMotion.matches); frameMeter.update(settings.fps); audio.visibility(document.hidden); });
reduceMotion.addEventListener('change', updateMotion);
document.addEventListener('pointermove', event => {
  if (!finePointer.matches || !settings.motion || reduceMotion.matches || document.hidden || document.querySelector('dialog[open]')) return;
  document.documentElement.style.setProperty('--pointer-x', `${(event.clientX / innerWidth - .5) * -16}px`);
  document.documentElement.style.setProperty('--pointer-y', `${(event.clientY / innerHeight - .5) * -10}px`);
}, { passive: true });
document.addEventListener('pointerleave', () => { document.documentElement.style.setProperty('--pointer-x', '0px'); document.documentElement.style.setProperty('--pointer-y', '0px'); });
updateSoundUI(); updateMotion();
if (location.hash === '#start') { openDialog($('launch-dialog'), $('start-button')); prepareLaunch(); }
