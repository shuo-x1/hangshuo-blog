const TAU = Math.PI * 2;
const snow = ['#b4d0e6', '#d1e5f4', '#ecf8ff', '#f9fdff', '#e3f3fe', '#c2dcec'];
const needles = ['#204754', '#2b5a62', '#3b7277', '#4a8282', '#33636c', '#254b58'];

function ring(radius, height, {count, noise, phase, squash = 1}) {
  return Array.from({length: count}, (_, index) => {
    const angle = phase + TAU * index / count;
    const edge = 1 + Math.sin(index * 2.31 + phase) * noise;
    return {
      x: Math.cos(angle) * radius * edge,
      y: Math.sin(angle) * radius * edge * squash,
      z: height + Math.cos(index * 2.9 + phase) * noise * radius * .37
    };
  });
}

function makeBand(lower, upper, colors) {
  const faces = lower.map((vertex, index) => {
    const next = (index + 1) % lower.length;
    const vertices = [vertex, lower[next], upper[next], upper[index]];
    const dx = vertex.x + lower[next].x;
    const dy = vertex.y + lower[next].y;
    const light = .5 - .5 * (dx * .78 + dy * .63) / (Math.hypot(dx, dy) || 1);
    const color = colors[Math.min(colors.length - 1, Math.floor(light * colors.length))];
    return {vertices, color, depth: dy};
  });
  return faces.sort((a, b) => a.depth - b.depth);
}

function drawMesh(ctx, mesh, projectVertex) {
  for (const face of mesh) {
    const first = projectVertex(face.vertices[0]);
    ctx.fillStyle = face.color;
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (let index = 1; index < face.vertices.length; index++) {
      const point = projectVertex(face.vertices[index]);
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.fill();
  }
}

function createDrift(x, y, {radius, height, phase, squash = .63}) {
  const options = {count: 10, noise: .14, phase, squash};
  const foot = ring(radius, .002, options);
  const crown = ring(radius * .54, height * .83, options);
  const tip = ring(0, height, {...options, noise: 0});
  const sides = makeBand(foot, crown, snow.slice(0, 5));
  const dome = makeBand(crown, tip, snow.slice(1, 5));
  return {
    x, y,
    draw(ctx, project, t, amount) {
      const toScreen = point => project(x + point.x, y + point.y, point.z * (.85 + amount * .15));
      drawMesh(ctx, sides, toScreen);
      drawMesh(ctx, dome, toScreen);
    }
  };
}

function treeLayer({base, tip, radius, phase}) {
  const options = {count: 8, noise: .23, phase};
  const height = tip - base;
  const trunkRim = ring(radius, base, options);
  const capRim = ring(radius * .81, base + height * .19, {...options, noise: .17});
  const point = ring(0, tip, options);
  return {
    bough: makeBand(trunkRim, capRim, needles),
    cap: makeBand(capRim, point, snow)
  };
}

function createFir(x, y, {height, phase}) {
  const layers = [
    {base: .13, tip: .69, radius: .26},
    {base: .31, tip: .81, radius: .207},
    {base: .49, tip: .90, radius: .157},
    {base: .64, tip: 1, radius: .106}
  ].map((layer, index) => treeLayer({
    base: layer.base * height,
    tip: layer.tip * height,
    radius: layer.radius * height,
    phase: phase + index * .8
  }));
  return {
    x, y,
    draw(ctx, project, t, amount) {
      const foot = project(x, y, 0);
      const wind = Math.sin(t * 1.09 + phase) * .018;
      const growth = .85 + .15 * amount;
      const toScreen = point => project(x + point.x + wind * point.z, y + point.y, point.z * growth);
      ctx.fillStyle = '#624a4d';
      const trunkWidth = height * foot.s * .078;
      ctx.fillRect(foot.x - trunkWidth / 2, foot.y - height * foot.s * .18, trunkWidth, height * foot.s * .185);
      for (const layer of layers) {
        drawMesh(ctx, layer.bough, toScreen);
        drawMesh(ctx, layer.cap, toScreen);
      }
    }
  };
}

function drawCrystal(ctx, {x, y, size, rotation}) {
  ctx.beginPath();
  for (let arm = 0; arm < 6; arm++) {
    const angle = rotation + TAU * arm / 6;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx * size, y + dy * size);
    const bx = x + dx * size * .58;
    const by = y + dy * size * .58;
    ctx.moveTo(bx - dy * size * .22 + dx * size * .16, by + dx * size * .22 + dy * size * .16);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + dy * size * .22 + dx * size * .16, by - dx * size * .22 + dy * size * .16);
  }
  ctx.lineWidth = Math.max(.52, size * .21);
  ctx.strokeStyle = '#f4fcff';
  ctx.stroke();
}

function createFlake(random) {
  const angle = random() * TAU;
  const distance = Math.sqrt(random()) * .84;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  const phase = random();
  const speed = .12 + random() * .23;
  const radius = .004 + random() * .012;
  return {
    x, y,
    draw(ctx, project, t) {
      const fall = (phase + t * speed) % 1;
      const drift = Math.sin(t * .65 + phase * TAU) * .048;
      const point = project(x + drift, y + drift * .2, .022 + (1 - fall) * .51);
      const size = Math.max(.54, radius * point.s * (1.03 + y * .28));
      ctx.globalAlpha *= Math.min(1, fall * 7, (1 - fall) * 9) * (.63 + y * .26);
      if (size > 1.72) {
        drawCrystal(ctx, {x: point.x, y: point.y, size, rotation: phase * TAU + t * .67});
      } else {
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, TAU);
        ctx.fillStyle = '#f2fbff';
        ctx.fill();
      }
    }
  };
}

export function createWinter(random) {
  const drifts = [
    [-.48, -.51, .22, .060], [-.17, -.59, .21, .056], [.33, -.49, .21, .068],
    [.61, -.28, .22, .076], [-.65, -.03, .18, .060], [-.54, .33, .22, .077],
    [.55, .34, .22, .071], [.28, .62, .22, .077], [-.23, .67, .18, .051],
    [-.07, .32, .13, .037], [.26, -.14, .12, .042]
  ].map(([x, y, radius, height]) => createDrift(x, y, {radius, height, phase: random() * TAU}));
  const forest = [
    [-.50, -.52, .31], [-.26, -.58, .36], [-.67, -.34, .22], [.35, -.46, .35],
    [.56, -.34, .31], [.67, -.09, .22], [-.59, .25, .235], [.45, .36, .23]
  ].map(([x, y, height]) => createFir(x, y, {height, phase: random() * TAU}));
  const flakes = Array.from({length: 69}, () => createFlake(random));
  return [...drifts, ...forest, ...flakes];
}
