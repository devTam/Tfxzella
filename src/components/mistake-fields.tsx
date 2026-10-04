"use client";

import { useId, useState } from "react";
import { STANDARD_MISTAKES } from "@/lib/trade-mistakes";

export function MistakeFields({ selected = [] }: { selected?: string[] }) {
  const customMistakes = selected.filter((mistake) => !STANDARD_MISTAKES.includes(mistake));
  const [showOther, setShowOther] = useState(customMistakes.length > 0);
  const [otherMistake, setOtherMistake] = useState(customMistakes.join(", "));
  const inputId = useId();

  return <div className="field full">
    <label>Mistakes</label>
    <div className="choice-chips">
      {STANDARD_MISTAKES.map((mistake) => <label key={mistake}><input type="checkbox" name="mistakes" value={mistake} defaultChecked={selected.includes(mistake)}/><span>{mistake}</span></label>)}
      <label><input type="checkbox" checked={showOther} onChange={(event) => setShowOther(event.target.checked)}/><span>Other</span></label>
    </div>
    {showOther ? <div className="other-mistake-field"><label htmlFor={inputId}>Describe the mistake</label><input id={inputId} name="otherMistake" value={otherMistake} onChange={(event) => setOtherMistake(event.target.value)} placeholder="Type the mistake" required/></div> : null}
  </div>;
}
