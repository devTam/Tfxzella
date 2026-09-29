"use client";

import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps=ButtonHTMLAttributes<HTMLButtonElement>&{pendingLabel?:string;confirmMessage?:string};

export function SubmitButton({children,pendingLabel="Working…",confirmMessage,disabled,onClick,...props}:SubmitButtonProps){
  const {pending}=useFormStatus();
  return <button {...props} type={props.type??"submit"} disabled={disabled||pending} aria-busy={pending} onClick={event=>{onClick?.(event);if(!event.defaultPrevented&&confirmMessage&&!window.confirm(confirmMessage))event.preventDefault();}}>{pending?<><LoaderCircle className="spin" size={16} aria-hidden="true"/><span>{pendingLabel}</span></>:children}</button>;
}

export function ConfirmSubmitButton({message,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{message:string;pendingLabel?:string}){
  return <SubmitButton {...props} confirmMessage={message}/>;
}
