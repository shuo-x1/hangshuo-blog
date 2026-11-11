'use client';

import {useEffect} from 'react';
import {usePathname} from 'next/navigation';

export function VisitTracker() {
  const path = usePathname();
  useEffect(()=>{
    if (/^\/(admin|login)/.test(path)) return;
    void fetch('/api/visits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path}),keepalive:true}).catch(()=>{});
  },[path]);
  return null;
}
