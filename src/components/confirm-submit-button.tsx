"use client";

import type { ButtonHTMLAttributes } from "react";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { beginPendingAction, clearPendingAction } from "@/components/interaction-feedback";

type SubmitButtonProps=ButtonHTMLAttributes<HTMLButtonElement>&{pendingLabel?:string;successMessage?:string;confirmMessage?:string};

export function SubmitButton({children,pendingLabel="Working…",successMessage="Done successfully",confirmMessage,disabled,onClick,...props}:SubmitButtonProps){
  const {pending}=useFormStatus();
  const [submitted,setSubmitted]=useState(false),wasPending=useRef(false),toastId=useRef<string|number|undefined>(undefined),isPending=pending&&submitted;
  useEffect(()=>{if(isPending){wasPending.current=true;beginPendingAction(successMessage);toastId.current=toast.loading(pendingLabel)}else if(wasPending.current){clearPendingAction();toast.success(successMessage,{id:toastId.current});wasPending.current=false;setSubmitted(false)}},[isPending,pendingLabel,successMessage]);
  return <button {...props} type={props.type??"submit"} data-managed-pending="true" disabled={disabled||isPending} aria-busy={isPending} onClick={event=>{onClick?.(event);if(!event.defaultPrevented&&confirmMessage&&!window.confirm(confirmMessage))event.preventDefault();if(!event.defaultPrevented)setSubmitted(true);}}>{isPending?<><LoaderCircle className="spin" size={16} aria-hidden="true"/><span>{pendingLabel}</span></>:children}</button>;
}

export function ConfirmSubmitButton({message,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{message:string;pendingLabel?:string}){
  return <SubmitButton {...props} confirmMessage={message}/>;
}
