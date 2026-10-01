"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

export function CalendarImageExport({month}:{month:string}){
  const [exporting,setExporting]=useState(false);
  async function download(){
    const calendar=document.getElementById("social-calendar");
    if(!calendar||exporting)return;
    setExporting(true);
    const toastId=toast.loading("Creating calendar image…");
    try{
      await document.fonts.ready;
      calendar.classList.add("calendar-exporting");
      const previousWidth=calendar.style.width,previousMaxWidth=calendar.style.maxWidth,previousPadding=calendar.style.padding;
      calendar.style.width="1200px";
      calendar.style.maxWidth="none";
      calendar.style.padding="32px";
      await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
      const width=Math.ceil(Math.max(1200,calendar.scrollWidth));
      const height=Math.ceil(Math.max(calendar.scrollHeight,calendar.getBoundingClientRect().height))+4;
      const dataUrl=await toPng(calendar,{cacheBust:true,pixelRatio:2,backgroundColor:"#08080d",width,height,style:{width:`${width}px`,height:`${height}px`,maxWidth:"none",overflow:"visible"}});
      calendar.style.width=previousWidth;
      calendar.style.maxWidth=previousMaxWidth;
      calendar.style.padding=previousPadding;
      calendar.classList.remove("calendar-exporting");
      const link=document.createElement("a");
      link.download=`tfxzella-calendar-${month}.png`;
      link.href=dataUrl;
      link.click();
      toast.success("Calendar image downloaded",{id:toastId});
    }catch(error){toast.error(error instanceof Error?error.message:"Could not create calendar image",{id:toastId})}finally{calendar.classList.remove("calendar-exporting");calendar.style.width="";calendar.style.maxWidth="";calendar.style.padding="";setExporting(false)}
  }
  return <button className="btn secondary" type="button" onClick={download} disabled={exporting}>{exporting?<LoaderCircle className="spin" size={16}/>:<Download size={16}/>} {exporting?"Creating image…":"Download image"}</button>;
}
