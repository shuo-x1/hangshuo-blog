const grassColors = ['#204d35', '#34754b', '#75ac51', '#c1d87c', '#8abc62', '#558d46'];
const brookX = y => -.4 + .11 * Math.sin(y * 5.2) - .105 * y;

export function paintSpringBrook(ctx, radius) {
  ctx.lineCap = 'round';
  for (const [color, width, offset] of [
    ['#264d3c', .158, 0], ['#88a574', .132, -.016], ['#355e65', .109, 0],
    ['#78aeb4', .081, -.006], ['#b7d9c6', .018, -.028]
  ]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width * radius;
    ctx.beginPath();
    for (let step = 0; step <= 60; step++) {
      const y = -1.1 + step * .037;
      ctx.lineTo(radius * (1 + brookX(y) + offset), radius * (1 + y));
    }
    ctx.stroke();
  }
}

function makeTuft(x, y, random) {
  const phase = random() * 6.28;
  const height = .055 + random() * .10;
  const blades = Array.from({length: 7}, (_, i) => ({
    root: (random() - .5) * .047,
    lean: (random() - .5) * .143,
    height: height * (.45 + random() * .6),
    width: .004 + random() * .007,
    color: grassColors[i % grassColors.length]
  }));
  return {x, y, draw(ctx, project, time, amount) {
    const wind = Math.sin(time * 2.2 + phase) * .027 + .014 * Math.sin(time * 3.2 + x * 3);
    const base = project(x, y);
    ctx.fillStyle = '#233e385c';
    ctx.beginPath();
    ctx.ellipse(base.x, base.y, base.s * .042, base.s * .013, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const blade of blades) {
      const root = project(x + blade.root, y);
      const tip = project(x + (blade.root + blade.lean + wind) * amount, y + blade.lean * .2, blade.height * amount);
      const bladeWidth = Math.max(.35, root.s * blade.width * amount);
      ctx.fillStyle = blade.color;
      ctx.beginPath();
      ctx.moveTo(root.x - bladeWidth, root.y);
      ctx.quadraticCurveTo(root.x, root.y - (root.y - tip.y) * .64, tip.x, tip.y);
      ctx.quadraticCurveTo(root.x + bladeWidth * 1.9, root.y - (root.y - tip.y) * .36, root.x + bladeWidth, root.y);
      ctx.fill();
    }
  }};
}

function makePebble(x, y, size) {
  return {x, y, draw(ctx, project, time, amount) {
    const point = project(x, y);
    const width = size * point.s * amount;
    if (width < .3) return;
    ctx.fillStyle = '#1c423e68';
    ctx.beginPath();
    ctx.ellipse(point.x + width * .23, point.y + width * .28, width * 1.13, width * .46, -.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#667d72';
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, width, width * .61, -.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c0cbb0';
    ctx.beginPath();
    ctx.ellipse(point.x - width * .12, point.y - width * .2, width * .78, width * .32, -.28, 0, Math.PI * 2);
    ctx.fill();
  }};
}

function makeWaterLight(y, phase) {
  const x = brookX(y);
  return {x, y, draw(ctx, project, time, amount) {
    const point = project(x + Math.sin(time + phase) * .025, y);
    const width = point.s * .038 * amount;
    ctx.strokeStyle = '#d6f2e0';
    ctx.globalAlpha *= .32 + .36 * Math.pow(Math.sin(time * 1.6 + phase), 2);
    ctx.lineWidth = Math.max(.5, width * .1);
    ctx.beginPath();
    ctx.moveTo(point.x - width, point.y + width * .1);
    ctx.quadraticCurveTo(point.x, point.y - width * .35, point.x + width, point.y);
    ctx.stroke();
  }};
}

export function createSpring(random) {
  const objects = [];
  for (let index = 0; index < 132; index++) {
    const angle = index * 2.399963;
    const radius = .9 * Math.sqrt((index + .6) / 132);
    const x = Math.cos(angle) * radius + (random() - .5) * .063;
    const y = Math.sin(angle) * radius + (random() - .5) * .063;
    if (Math.hypot(x, y) < .17 || Math.abs(x - brookX(y)) < .079) continue;
    objects.push(makeTuft(x, y, random));
  }
  for (let index = 0; index < 13; index++) {
    const y = -.75 + index * .118;
    objects.push(makeWaterLight(y, random() * 6.28));
    objects.push(makePebble(brookX(y) + (index % 2 ? -.075 : .076), y, .012 + random() * .03));
  }
  return objects;
}
