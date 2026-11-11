export const photoLayouts = [
  ["spiral", "螺旋柱墙"], ["grid", "视差网格"], ["orbit", "扇形轨道"],
  ["wave", "波浪帘"], ["explode", "聚合照片墙"], ["carousel", "旋转木马"], ["ribbon", "丝带飘带"],
] as const;
export type PhotoLayout = typeof photoLayouts[number][0];
interface PhotoPose { x: number; y: number; z: number; ry: number; rz: number }
interface PoseInput { layout: PhotoLayout; index: number; count: number; time: number }

export function isPhotoLayout(value: string): value is PhotoLayout {
  return photoLayouts.some(([key]) => key === value);
}

export function getPhotoPose({ layout, index, count, time }: PoseInput): PhotoPose {
  const centered = index - (count - 1) / 2;
  const columns = Math.min(count, 4);
  const column = index % columns - (columns - 1) / 2;
  const row = Math.floor(index / columns) - (Math.ceil(count / columns) - 1) / 2;
  const angle = count <= 2 ? centered * 1.4 + time * .13 : index / count * Math.PI * 2 + time * .13;
  if (layout === "spiral") return { x: Math.sin(angle) * 240, y: centered * Math.min(68, 330 / count), z: Math.cos(angle) * 145, ry: -Math.sin(angle) * 27, rz: Math.sin(angle) * 3 };
  if (layout === "grid") return { x: column * 185 + Math.sin(time * .3 + row) * 14, y: row * 215, z: (index % 2) * 45, ry: -6, rz: 0 };
  if (layout === "orbit") return { x: Math.sin(angle) * 300, y: Math.cos(angle) * 28, z: Math.cos(angle) * 145, ry: -Math.sin(angle) * 27, rz: 0 };
  if (layout === "wave") return { x: column * 185, y: row * 190 + Math.sin(time * .5 + index) * 24, z: Math.cos(time * .4 + index) * 100, ry: Math.sin(time * .4 + index) * 9, rz: Math.sin(time * .4 + index) * 3 };
  if (layout === "explode") return { x: column * (180 + Math.sin(time * .35) * 15), y: row * 210, z: Math.sin(time * .35 + index) * 50, ry: Math.sin(time * .35 + index) * 6, rz: 0 };
  if (layout === "ribbon") return { x: centered * Math.min(125, 660 / count), y: Math.sin(centered * .66 + time * .3) * 95, z: Math.cos(centered * .66 + time * .3) * 100, ry: Math.sin(centered * .66) * 22, rz: Math.cos(centered * .66) * 7 };
  return { x: Math.sin(angle) * 270, y: 0, z: Math.cos(angle) * 165, ry: -Math.sin(angle) * 23, rz: 0 };
}

export function poseTransform(pose: PhotoPose): string {
  return `translate3d(${pose.x}px,${pose.y}px,${pose.z}px) rotateY(${pose.ry}deg) rotateZ(${pose.rz}deg)`;
}
