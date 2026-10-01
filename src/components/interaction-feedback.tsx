"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const pendingKey="tfxzella-pending-action";

export function beginPendingAction(message:string){sessionStorage.setItem(pendingKey,message)}
export function clearPendingAction(){sessionStorage.removeItem(pendingKey)}

export function InteractionFeedback(){
  useEffect(()=>{
    const finish=(button:HTMLElement,id:string|number,message:string)=>{button.removeAttribute("data-pending");button.removeAttribute("aria-busy");clearPendingAction();toast.success(message,{id})};
    const onSubmit=(event:SubmitEvent)=>{
      const form=event.target instanceof HTMLFormElement?event.target:null,button=event.submitter instanceof HTMLElement?event.submitter:null;
      if(!form||!button||button.dataset.managedPending==="true"||button.getAttribute("aria-busy")==="true")return;
      const label=button.textContent?.trim()||"Action",message=button.dataset.successMessage||`${label} completed`;
      button.dataset.pending="true";button.setAttribute("aria-busy","true");beginPendingAction(message);
      const id=toast.loading(button.dataset.pendingLabel||"Working…");
      queueMicrotask(()=>{const observer=new MutationObserver(()=>{observer.disconnect();finish(button,id,message)});observer.observe(form.parentElement||form,{childList:true,subtree:true,characterData:true});setTimeout(()=>observer.disconnect(),15000)});
    };
    const onClick=(event:MouseEvent)=>{const target=event.target instanceof Element?event.target.closest<HTMLAnchorElement>("a.btn, a.icon-btn"):null;if(target&&!target.querySelector(".link-spinner")&&!target.hasAttribute("download")&&target.target!=="_blank")target.dataset.pending="true"};
    document.addEventListener("submit",onSubmit,true);document.addEventListener("click",onClick,true);
    return()=>{document.removeEventListener("submit",onSubmit,true);document.removeEventListener("click",onClick,true)};
  },[]);
  return null;
}

export function completePendingAction(){
  const message=sessionStorage.getItem(pendingKey);if(message){sessionStorage.removeItem(pendingKey);toast.success(message)}
}
