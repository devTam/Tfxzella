"use client";

import Link, { useLinkStatus } from "next/link";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

function PendingIndicator(){
  const {pending}=useLinkStatus();
  return pending?<LoaderCircle className="link-spinner spin" size={15} aria-label="Loading"/>:null;
}

export function NavigationLink({children,...props}:Omit<ComponentProps<typeof Link>,"children">&{children:ReactNode}){
  return <Link {...props}>{children}<PendingIndicator/></Link>;
}
