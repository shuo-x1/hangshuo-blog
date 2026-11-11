const turn = Math.PI * 2;
const flowerFamilies = [
  {
    petals: 9, width: .25, reach: 1, height: 1.03, face: .64,
    light: '#ffe3df', middle: '#e88da4', shade: '#a64b70', vein: '#fff1de', core: '#ac643e', pollen: '#ffd989'
  },
  {
    petals: 11, width: .17, reach: 1.06, height: .86, face: .72,
    light: '#fff9da', middle: '#fff1c5', shade: '#d3aa70', vein: '#ffffed', core: '#b87934', pollen: '#ffdd72'
  },
  {
    petals: 5, width: .34, reach: .94, height: 1.18, face: .8,
    light: '#e0d4ff', middle: '#9b98ea', shade: '#6356a7', vein: '#f6eeff', core: '#555382', pollen: '#fff4ad'
  }
];

function drawLeaf(ctx, {joint, tip, side, highlighted}) {
  const dx = tip.x - joint.x;
  const dy = tip.y - joint.y;
  const wing = .24 * side;
  ctx.beginPath();
  ctx.moveTo(joint.x, joint.y);
  ctx.quadraticCurveTo(joint.x + dx * .3 - dy * wing, joint.y + dy * .3 + dx * wing, tip.x, tip.y);
  ctx.quadraticCurveTo(joint.x + dx * .7 + dy * wing, joint.y + dy * .7 - dx * wing, joint.x, joint.y);
  ctx.fillStyle = highlighted ? '#a1ce7d' : '#548556';
  ctx.fill();
  if (joint.s < 65) return;
  ctx.beginPath();
  ctx.moveTo(joint.x, joint.y);
  ctx.quadraticCurveTo(joint.x + dx * .5 - dy * .05, joint.y + dy * .5 + dx * .05, tip.x, tip.y);
  ctx.strokeStyle = highlighted ? '#dfdfa187' : '#b6ce7d8f';
  ctx.lineWidth = .6;
  ctx.stroke();
}

function drawStem(ctx, {foot, bend, head, leaves}) {
  ctx.fillStyle = '#102e2547';
  ctx.beginPath();
  ctx.ellipse(foot.x + foot.s * .008, foot.y, foot.s * .019, foot.s * .009, 0, 0, turn);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(foot.x, foot.y);
  ctx.quadraticCurveTo(bend.x, bend.y, head.x, head.y);
  ctx.strokeStyle = '#365b43';
  ctx.lineWidth = Math.max(.65, foot.s * .009);
  ctx.stroke();
  ctx.strokeStyle = '#96b96d';
  ctx.lineWidth = Math.max(.35, foot.s * .004);
  ctx.stroke();
  for (const leaf of leaves) drawLeaf(ctx, leaf);
}

function drawPetal(ctx, {width, reach, fill, vein}) {
  ctx.beginPath();
  ctx.moveTo(-.07, -.12);
  ctx.bezierCurveTo(-width, -reach * .37, -width * 1.38, -reach * .88, -width * .37, -reach * .97);
  ctx.bezierCurveTo(width * .76, -reach * 1.13, width * 1.12, -reach * .77, width * .77, -reach * .49);
  ctx.quadraticCurveTo(width * .53, -reach * .29, .07, -.12);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-.02, -.29);
  ctx.quadraticCurveTo(-width * .19, -reach * .51, -width * .12, -reach * .78);
  ctx.strokeStyle = vein;
  ctx.lineWidth = .032;
  ctx.stroke();
}

function drawPollen(ctx, family, detailed) {
  ctx.beginPath();
  ctx.arc(0, 0, .248, 0, turn);
  ctx.fillStyle = family.core;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-.035, -.035, .175, 0, turn);
  ctx.fillStyle = family.pollen;
  ctx.fill();
  if (!detailed) return;
  ctx.fillStyle = family.core;
  for (let i = 0; i < 7; i++) {
    const theta = i * turn / 7;
    ctx.beginPath();
    ctx.arc(Math.cos(theta) * .13, Math.sin(theta) * .13, .034, 0, turn);
    ctx.fill();
  }
}

function drawBloom(ctx, {head, radius, family, yaw, face}) {
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(yaw);
  ctx.scale(radius, radius * face);
  const step = turn / family.petals;
  for (let index = 0; index < family.petals; index++) {
    const side = Math.cos(index * step + yaw);
    const fill = side > .18 ? family.light : side > -.63 ? family.middle : family.shade;
    drawPetal(ctx, {...family, fill});
    ctx.rotate(step);
  }
  drawPollen(ctx, family, radius > 3);
  ctx.restore();
}

function poseFlower(flower, project, {time, amount}) {
  const {x, y, phase, height, headSize, family} = flower;
  const growth = Math.sqrt(amount);
  const lift = height * growth;
  const wind = Math.sin(time * 1.65 + x * 4.1 + y * 2.2) * .018 + Math.sin(time * 2.55 + phase) * .012;
  const lean = (flower.lean + wind) * growth;
  const foot = project(x, y, 0);
  const bend = project(x + lean * .32, y, lift * .48);
  const head = project(x + lean, y - .011 * growth, lift);
  const leaves = [-1, 1].map((side, index) => {
    const joint = project(x + lean * (.23 + index * .21), y, lift * (.32 + index * .27));
    const tip = project(x + lean * .61 + side * .055 * growth, y + side * .019 * growth, lift * (.5 + index * .25));
    return {joint, tip, side, highlighted: index === 0};
  });
  const open = Math.min(1, amount * 1.45);
  return {
    foot, bend, head, leaves, family,
    radius: Math.max(.72, head.s * headSize) * open,
    yaw: flower.yaw + wind * 2.8,
    face: family.face + Math.sin(time * 1.5 + phase) * .07
  };
}

function makeWildflower(random, index) {
  const angle = index * 2.399963 + (random() - .5) * .16;
  const radius = Math.sqrt(.25 ** 2 + random() * (.88 ** 2 - .25 ** 2));
  const family = flowerFamilies[index % flowerFamilies.length];
  const flower = {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    family,
    phase: random() * turn,
    lean: (random() - .5) * .089,
    yaw: (random() - .5) * 1.15,
    height: (.105 + random() * .116) * family.height,
    headSize: .031 + random() * .029
  };
  return {
    x: flower.x,
    y: flower.y,
    draw(ctx, project, time, amount) {
      if (amount <= 0) return;
      const pose = poseFlower(flower, project, {time, amount});
      drawStem(ctx, pose);
      drawBloom(ctx, pose);
    }
  };
}

export function createSummer(random) {
  return Array.from({length: 39}, (_, index) => makeWildflower(random, index));
}
