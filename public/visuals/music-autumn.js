const fullTurn = Math.PI * 2;
const copper = ['#8f342e', '#ad4738', '#ca5740', '#e7724b', '#eaa354', '#f6bc68'];
const branches = [
  {joint: .29, x: -.53, y: .06, z: .62},
  {joint: .35, x: .44, y: .20, z: .57},
  {joint: .40, x: -.34, y: -.31, z: .73},
  {joint: .46, x: .39, y: -.26, z: .76},
  {joint: .50, x: -.42, y: .18, z: .82},
  {joint: .56, x: .36, y: .08, z: .92},
  {joint: .58, x: .02, y: .29, z: .79},
  {joint: .65, x: -.08, y: -.11, z: 1.03}
];

const maple = new Path2D(
  'M0-1.12-.16-.64-.3-.76-.24-.34-.55-.56-.97-.59-.75-.3-.89-.22-.46-.07-.82.09-.73.21-.91.3-.48.4-.57.55-.14.48 0 .62.14.48.57.55.48.4.91.3.73.21.82.09.46-.07.89-.22.75-.3.97-.59.55-.56.24-.34.3-.76.16-.64Z'
);
const veins = new Path2D('M-.07.88 0 .45 0-.96M0 .43-.79-.49M0 .43.79-.49M0 .43-.72.27M0 .43.72.27');

function drawMaple(ctx, leaf) {
  const {point, radius, angle, tilt, color} = leaf;
  if (radius < .28) return;
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(angle);
  ctx.scale(radius, radius * tilt);
  ctx.fillStyle = color;
  ctx.fill(maple);
  if (radius >= 2.7) {
    ctx.strokeStyle = '#ffe0a179';
    ctx.lineWidth = .065;
    ctx.stroke(veins);
  }
  ctx.restore();
}

function growCanopy(random) {
  const leaves = [];
  for (const branch of branches) {
    for (let index = 0; index < 8; index++) {
      const angle = (index / 8 + random() * .18) * fullTurn;
      const offset = .05 + random() * .23;
      leaves.push({
        x: branch.x + Math.cos(angle) * offset,
        y: branch.y + Math.sin(angle) * offset,
        z: branch.z + (random() - .45) * .25,
        angle: random() * fullTurn,
        size: .063 + random() * .083,
        color: copper[Math.floor(random() * copper.length)]
      });
    }
  }
  return leaves.sort((first, second) => first.y - second.y || first.z - second.z);
}

function treeSpace(project, tree, motion) {
  const {growth, wind} = motion;
  return (x, y, z) => project(
    tree.x + (x + wind * z * z) * tree.height,
    tree.y + y * tree.height,
    z * tree.height * growth
  );
}

function drawBark(ctx, place, radius) {
  const base = place(0, 0, 0);
  const bend = place(-.07, 0, .28);
  const crown = place(.01, 0, .83);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#603931';
  ctx.lineWidth = Math.max(.65, radius * .075);
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.quadraticCurveTo(bend.x, bend.y, crown.x, crown.y);
  ctx.stroke();
  ctx.lineWidth *= .48;
  ctx.strokeStyle = '#845242';
  for (const branch of branches) {
    const start = place(-.03, 0, branch.joint);
    const fork = place(branch.x * .52, branch.y * .52, branch.z * .76);
    const tip = place(branch.x, branch.y, branch.z);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(fork.x, fork.y, tip.x, tip.y);
    ctx.stroke();
  }
}

function drawTree(ctx, tree, motion) {
  const {project, t, amount} = motion;
  const wind = Math.sin(t * 1.45 + tree.phase) * .042;
  const place = treeSpace(project, tree, {wind, growth: .58 + .42 * amount});
  const ground = place(0, 0, 0);
  const radius = ground.s * tree.height;
  ctx.save();
  ctx.globalAlpha *= amount;
  ctx.fillStyle = '#4929243b';
  ctx.beginPath();
  ctx.ellipse(ground.x + radius * .15, ground.y, radius * .40, radius * .095, -.10, 0, fullTurn);
  ctx.fill();
  drawBark(ctx, place, radius);
  for (const leaf of tree.leaves) {
    const flutter = Math.sin(t * 2.6 + leaf.angle + tree.phase);
    const point = place(leaf.x + .032 * flutter, leaf.y, leaf.z);
    drawMaple(ctx, {
      point, radius: point.s * tree.height * leaf.size,
      angle: leaf.angle + flutter * .18, tilt: .72 + .23 * Math.abs(flutter), color: leaf.color
    });
  }
  ctx.restore();
}

function drawDriftingLeaf(ctx, leaf, motion) {
  const {project, t, amount} = motion;
  const progress = (leaf.offset + t * leaf.speed) % 1;
  const roll = Math.sin(progress * fullTurn * 2 + leaf.angle);
  const point = project(leaf.x + .15 * progress + roll * .04, leaf.y + .15 * progress, leaf.height * (1 - progress) ** 1.15);
  ctx.save();
  ctx.globalAlpha *= amount * Math.min(1, progress * 10, (1 - progress) * 8);
  drawMaple(ctx, {point, radius: point.s * leaf.size, angle: leaf.angle + progress * 4, tilt: .20 + Math.abs(roll) * .8, color: leaf.color});
  ctx.restore();
}

export function createAutumn(random) {
  const chooseColor = () => copper[Math.floor(random() * copper.length)];
  const trees = [
    {x: -.56, y: -.07, height: .51},
    {x: .45, y: -.35, height: .44},
    {x: .55, y: .44, height: .31}
  ].map(position => {
    const tree = {...position, phase: random() * fullTurn, leaves: growCanopy(random)};
    return {...position, draw: (ctx, project, t, amount) => drawTree(ctx, tree, {project, t, amount})};
  });
  const litter = Array.from({length: 36}, () => {
    const bearing = random() * fullTurn;
    const distance = .24 + Math.sqrt(random()) * .65;
    const x = Math.cos(bearing) * distance, y = Math.sin(bearing) * distance;
    const angle = random() * fullTurn, size = .011 + random() * .023, color = chooseColor();
    return {x, y, draw(ctx, project, _t, amount) {
      const point = project(x, y, .003);
      drawMaple(ctx, {point, radius: point.s * size * amount, angle, tilt: .48, color});
    }};
  });
  const flurry = Array.from({length: 13}, (_, index) => {
    const tree = trees[index % trees.length];
    const x = tree.x - .11 + random() * .17, y = tree.y - .10 + random() * .16;
    const leaf = {x, y, height: .24 + random() * .25, offset: random(), speed: .14 + random() * .13, angle: random() * fullTurn, size: .02 + random() * .023, color: chooseColor()};
    return {x, y, draw: (ctx, project, t, amount) => drawDriftingLeaf(ctx, leaf, {project, t, amount})};
  });
  return [...litter, ...trees, ...flurry];
}
