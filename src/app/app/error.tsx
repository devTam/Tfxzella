"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function AppError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  useEffect(()=>{toast.error(error.message||"Something went wrong. Please try again.")},[error]);
  return <div className="content"><section className="card empty" role="alert"><h1>Something went wrong</h1><p>{error.message||"The request could not be completed."}</p><button className="btn" type="button" onClick={reset}>Try again</button></section></div>;
}
