import {paintSpringBrook} from './music-spring.js';

const turn = Math.PI * 2;
const ground = [
  ['#33583c', '#96b97a', '#c5d990', '#527b55'],
  ['#3d625b', '#83ab76', '#bee1a1', '#609072'],
  ['#77513e', '#c38e55', '#f4c17d', '#a26b51'],
  ['#8aa7bd', '#e2edf2', '#f8fcff', '#b0c9da']
];

export function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function makeMusicTerrain(index) {
  const texture = document.createElement('canvas');
  texture.width = texture.height = 480;
  const ctx = texture.getContext('2d');
  const random = seededRandom(2718 + index);
  const [shade, light, grain, moss] = ground[index];
  const glow = ctx.createRadialGradient(182, 142, 10, 250, 235, 310);
  glow.addColorStop(0, light);
  glow.addColorStop(1, shade);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 480, 480);
  for (let i = 0; i < 9400; i++) {
    ctx.fillStyle = [grain, moss, shade][i % 3];
    ctx.globalAlpha = .12 + random() * .34;
    ctx.fillRect(random() * 480, random() * 480, 1 + random() * 1.9, 1 + random() * 2.8);
  }
  ctx.globalAlpha = 1;
  if (index === 0) paintSpringBrook(ctx, 240);
  ctx.globalAlpha = .22;
  ctx.strokeStyle = grain;
  for (let ring = 206; ring <= 237; ring += 8) {
    ctx.beginPath();
    ctx.arc(240, 240, ring, 0, turn);
    ctx.stroke();
  }
  return texture;
}

function paintBase(ctx, radius) {
  const edge = ctx.createLinearGradient(-radius, 0, radius, 0);
  edge.addColorStop(0, '#1d3543');
  edge.addColorStop(.36, '#55646d');
  edge.addColorStop(.7, '#263c48');
  edge.addColorStop(1, '#132637');
  for (const [height, size, color] of [
    [.093, 1.045, '#071521'], [.065, 1.045, edge],
    [.022, 1.045, '#68818a'], [0, 1.029, '#243d4b']
  ]) {
    ctx.beginPath();
    ctx.ellipse(0, height * radius, size * radius, size * radius, 0, 0, turn);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function paintNeedle(ctx, radius, angle) {
  ctx.save();
  ctx.rotate(angle);
  const light = ctx.createLinearGradient(0, 0, radius, 0);
  light.addColorStop(0, '#f4d18e35');
  light.addColorStop(1, '#ffe4a2');
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.moveTo(radius * .08, -radius * .004);
  ctx.lineTo(radius * .86, -radius * .013);
  ctx.lineTo(radius * .88, -radius * .033);
  ctx.lineTo(radius * .98, 0);
  ctx.lineTo(radius * .88, radius * .033);
  ctx.lineTo(radius * .86, radius * .013);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  for (const [size, color, ring] of [[.115, '#0e202c', '#e3c782'], [.071, '#263e46', '#788c8a']]) {
    ctx.lineWidth = Math.max(.55, radius * .005);
    ctx.beginPath();
    ctx.arc(0, 0, radius * size, 0, turn);
    ctx.fillStyle = color;
    ctx.strokeStyle = ring;
    ctx.fill();
    ctx.stroke();
  }
}

export function paintMusicSurface(ctx, pose, terrain) {
  const {x, y, radius, angle, sweep} = pose;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, .55);
  paintBase(ctx, radius);
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, turn);
  ctx.clip();
  ctx.drawImage(terrain.current, -radius, -radius, radius * 2, radius * 2);
  if (sweep > 0) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + sweep * turn);
    ctx.clip();
    ctx.drawImage(terrain.next, -radius, -radius, radius * 2, radius * 2);
  }
  ctx.restore();
  paintNeedle(ctx, radius, angle);
  ctx.restore();
}
