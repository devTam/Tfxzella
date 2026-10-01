"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { completePendingAction } from "@/components/interaction-feedback";

const knownErrors:Record<string,string>={exists:"An account with that email already exists."};

export function ToastCoordinator(){
  const pathname=usePathname(),params=useSearchParams(),previousPath=useRef(pathname);
  useEffect(()=>{
    const success=params.get("success"),warning=params.get("warning"),error=params.get("error");
    if(success)toast.success(success);
    if(warning)toast.warning(warning);
    if(error)toast.error(knownErrors[error]||error);
  },[params]);
  useEffect(()=>{if(previousPath.current!==pathname){toast.dismiss();completePendingAction();previousPath.current=pathname}},[pathname]);
  return null;
}
