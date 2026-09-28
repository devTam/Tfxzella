"use client";

import { useRouter } from "next/navigation";

export function ClickableTableRow({href,label,children}:{href:string;label:string;children:React.ReactNode}){
  const router=useRouter();
  const open=(target:EventTarget|null)=>{
    if(target instanceof Element&&target.closest("a,button,input,select,textarea,label,form"))return;
    if(window.getSelection()?.toString())return;
    router.push(href);
  };
  return <tr className="clickable-row" tabIndex={0} role="link" aria-label={label} onClick={event=>open(event.target)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();open(event.target)}}}>{children}</tr>;
}
