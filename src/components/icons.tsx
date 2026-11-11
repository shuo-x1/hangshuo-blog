import type { ReactElement, SVGProps } from "react";

type IconName = "arrow" | "arrowUp" | "mail" | "chat" | "github" | "sun" | "moon" | "close" | "photo" | "code" | "music" | "search";
interface IconProps extends SVGProps<SVGSVGElement> { name: IconName }
const paths: Record<IconName, ReactElement> = {
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  arrowUp: <path d="M6 18 18 6M6 6h12v12" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
  chat: <path d="M20 11a8 8 0 0 1-8 8H4v-5a8 8 0 1 1 16-3Z" />,
  github: <><path d="M9 19c-4 1-4-2-6-2m12 5v-3.5c0-1 .1-1.5-.5-2 3-.3 6-1.5 6-6a5 5 0 0 0-1.4-3.5c.1-.4.6-1.9-.2-3.5 0 0-1.2-.4-3.8 1.4a13 13 0 0 0-6.8 0C5.7 2.1 4.5 2.5 4.5 2.5c-.8 1.6-.3 3.1-.2 3.5A5 5 0 0 0 3 9.5c0 4.5 3 5.7 6 6-.5.5-.6 1.3-.5 2V22" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
  moon: <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  photo: <><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="8" cy="9" r="1.5" /><path d="m4 17 5-5 4 4 3-3 4 4" /></>,
  code: <path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16" />,
  music: <><path d="M9 18V5l11-2v13M9 8l11-2" /><ellipse cx="6" cy="18" rx="3" ry="2" /><ellipse cx="17" cy="16" rx="3" ry="2" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
};

export function Icon({ name, className = "h-5 w-5", ...props }: IconProps): ReactElement {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>{paths[name]}</svg>;
}
