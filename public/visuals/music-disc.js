import {makeMusicTerrain, paintMusicSurface, seededRandom} from './music-disc-surface.js';
import {createSpring} from './music-spring.js';
import {createSummer} from './music-summer.js';
import {createAutumn} from './music-autumn.js';
import {createWinter} from './music-winter.js';

const turn = Math.PI * 2;
const builders = [createSpring, createSummer, createAutumn, createWinter];
const skyTints = ['#304f56', '#334a65', '#594b51', '#3b5671'];
const clamp = value => Math.max(0, Math.min(1, value));

export function musicSeasonAt(time, duration) {
  return Math.min(3, Math.floor(clamp(time / duration) * 4));
}

function paintSky(ctx, {width, height, stars, time, season}) {
  const sky = ctx.createRadialGradient(width * .5, height * .62, 1, width * .53, height * .51, width * .68);
  sky.addColorStop(0, skyTints[season]);
  sky.addColorStop(.6, '#162b40');
  sky.addColorStop(1, '#081728');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#e0eefb';
  for (const [x, y, phase] of stars) {
    ctx.globalAlpha = .20 + .24 * (1 + Math.sin(time * .66 + phase));
    const size = width > 200 && phase > 4 ? 1.6 : .8;
    ctx.fillRect(x * width, y * height, size, size);
  }
  ctx.globalAlpha = 1;
}

function makeScene(index) {
  return {
    texture: makeMusicTerrain(index),
    objects: builders[index](seededRandom(619 + index * 253)).map((object, order) => ({
      object, order,
      bearing: ((Math.atan2(object.y, object.x) + Math.PI / 2 + turn) % turn) / turn
    })).sort((a, b) => a.object.y - b.object.y)
  };
}

function paintModels(ctx, pose, layers) {
  const {x, y, radius, sweep, motionTime, compact} = pose;
  const project = (dx, dy, z = 0) => ({
    x: x + dx * radius,
    y: y + (dy * .55 - z) * radius,
    s: radius * (.96 + dy * .09)
  });
  for (const {object, order, bearing, incoming} of layers) {
    if (compact && order % 3 !== 0) continue;
    const reveal = sweep >= 1 ? 1 : sweep <= 0 ? 0 : clamp((sweep - bearing) * 32 + .5);
    const amount = incoming ? reveal : 1 - reveal;
    if (amount <= .02) continue;
    ctx.save();
    ctx.globalAlpha = amount;
    object.draw(ctx, project, motionTime, amount);
    ctx.restore();
  }
}

export function createMusicDisc() {
  const random = seededRandom(914);
  const stars = Array.from({length: 74}, () => [random(), random(), random() * turn]);
  const scenes = [];
  const layerPairs = [];
  return (canvas, {time, duration, reduced}) => {
    const {clientWidth: width, clientHeight: height} = canvas;
    if (!width || !height) return;
    const index = musicSeasonAt(time, duration);
    const next = (index + 1) % 4;
    const fraction = clamp(time * 4 / duration - index);
    const sweep = reduced ? 0 : clamp((fraction - .62) / .38);
    const current = scenes[index] ??= makeScene(index);
    const upcoming = sweep > 0 ? scenes[next] ??= makeScene(next) : null;
    const layers = upcoming ? layerPairs[index] ??= [...current.objects, ...upcoming.objects.map(object => ({...object, incoming:true}))].sort((a,b) => a.object.y - b.object.y) : current.objects;
    const ctx = fitCanvas(canvas);
    if (!ctx) return;
    const compact = width < 150;
    const motionTime = reduced ? 0 : time;
    const pose = {
      x: width / 2, y: height * .58,
      radius: Math.min(width * .414, height * .62),
      motionTime, compact, sweep,
      angle: -Math.PI / 2 + (reduced ? 0 : fraction * turn)
    };
    paintSky(ctx, {width, height, stars, time: motionTime, season:index});
    paintMusicSurface(ctx, pose, {current: current.texture, next: upcoming?.texture});
    paintModels(ctx, pose, layers);
  };
}

function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(canvas.clientWidth * dpr);
  const height = Math.round(canvas.clientHeight * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d', {alpha:false});
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function watchMusicDisc({audio, thumbnail, dialog}) {
  const stage = dialog.querySelector('canvas');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const render = createMusicDisc();
  let frame = 0, lastFrame = -Infinity, lastSeason = -1, visible = false;
  const duration = () => Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 32;
  function wake() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(paint);
  }
  function paint(now) {
    frame = 0;
    if (document.hidden || (!dialog.open && !visible)) return;
    const playing = !audio.paused && !motion.matches;
    if (!playing || now - lastFrame >= 38) {
      const time = audio.currentTime;
      render(dialog.open ? stage : thumbnail, {time, duration:duration(), reduced:motion.matches});
      lastSeason = musicSeasonAt(time, duration());
      lastFrame = now;
    }
    if (playing) wake();
  }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); }).observe(thumbnail);
  const resize = new ResizeObserver(wake);
  resize.observe(thumbnail);
  resize.observe(stage);
  for (const event of ['play', 'pause', 'seeked', 'loadedmetadata']) audio.addEventListener(event, wake);
  audio.addEventListener('timeupdate', () => { if (motion.matches && musicSeasonAt(audio.currentTime, duration()) !== lastSeason) wake(); });
  document.addEventListener('visibilitychange', wake);
  motion.addEventListener('change', wake);
  return wake;
}
