import React, { useState } from 'react';
import './features/editor/Editor.css';
import "./index.css"

/**
 * Renders text with highlighted error ranges. 
 * onAccept(idx) and onReject(idx) handlers:
 * Reject should open a prompt to collect reason.
 */
export default function HighlightedText({ text, ops, onAccept, onReject }) {
  console.log(ops[0])
  const [selected, setSelected] = useState(null);
  const segments = [];
  let cursor = 0;

  // ops.forEach((op, i) => {
  //   const { start, length, replacement } = op;
  //   // Plain before error
  //   if (start > cursor) {
  //     segments.push(
  //       <span key={`plain-${i}`}>{text.slice(cursor, start)}</span>
  //     );
  //   }
  //   // Error span
  //   segments.push(
  //     <span
  //       key={`error-${i}`}
  //       className="suggestion"
  //       onClick={() => setSelected(i)}
  //       title={`Accept or reject this suggestion: '${replacement}'`}
  //     >
  //       {text.slice(start, start + length)}
  //     </span>
  //   );
  //   if (selected === i) {
  //     segments.push(
  //       <span key={`actions-${i}`} className="suggestion-actions">
  //         <button onClick={() => { onAccept(i); setSelected(null); }}>Accept</button>
  //         <button onClick={() => { onReject(i); setSelected(null); }}>Reject</button>
  //       </span>
  //     );
  //   }
  //   cursor = start + length;
  // });

  // // Tail
  // if (cursor < text.length) {
  //   segments.push(<span key="tail">{text.slice(cursor)}</span>);
  // }

  return <div className="panel highlighted-text">{segments}</div>;
}
