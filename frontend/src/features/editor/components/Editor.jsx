import React, { useState } from "react";
import TextBlock from "../../../components/TextBlock";
import HighlightedText from "../../../HighlightedText";
import "../Editor.css";

function Editor() {
  const [input, setInput] = useState("");
  const [errors, setErrors] = useState([]); // ops for highlighting
  const [acceptances, setAcceptances] = useState([]);
  const [rejections, setRejections] = useState([]);

  const fetchData = async (text) => {
    const response = await fetch("http://localhost:5000/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    return data;
  };

  const handleSubmit = async (text) => {
    setInput(text);
    const data = await fetchData(text);
    console.log(data);
    setErrors(data);
    setAcceptances([]);
    setRejections([]);
  };

  // accept handler applies replacement to `input` and logs
  const handleAccept = (i) => {
    const op = errors[i];
    // apply to input
    const before = input.slice(0, op.start);
    const after = input.slice(op.start + op.length);
    const newText = before + op.replacement + after;
    setInput(newText);
    // shift remaining error ops
    const delta = op.replacement.length - op.length;
    const updatedErrors = errors
      .filter((_, idx) => idx !== i)
      .map((e) => ({
        ...e,
        start: e.start > op.start ? e.start + delta : e.start,
      }));
    setErrors(updatedErrors);
    // log acceptance
    setAcceptances((prev) => [
      ...prev,
      {
        original: input.slice(op.start, op.start + op.length),
        replacement: op.replacement,
      },
    ]);
  };

  // reject handler prompts for reason and logs
  const handleReject = (i) => {
    const op = errors[i];
    const reason = window.prompt("Reason for rejection:");
    if (!reason) return;
    setRejections((prev) => [
      ...prev,
      {
        original: input.slice(op.start, op.start + op.length),
        replacement: op.replacement,
        reason,
      },
    ]);
    // remove the op
    setErrors((prev) => prev.filter((_, idx) => idx !== i));
  };

  return (
    <div className="editor">
      <TextBlock
        title="Input Text"
        text={input}
        isEditable={true}
        onSubmit={handleSubmit}
      />

      {errors.length > 0 && (
        <>
          <HighlightedText
            text={input}
            ops={errors}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        </>
      )}

      {/* Optionally, show logs of acceptances/rejections */}
      {/* {acceptances.length > 0 && (
        <div className="log">
          <h3>Accepted Corrections</h3>
          <ul>
            {acceptances.map((a, idx) => (
              <li key={idx}>
                "{a.original}" → "{a.replacement}"
              </li>
            ))}
          </ul>
        </div>
      )}
      {rejections.length > 0 && (
        <div className="log">
          <h3>Rejected Corrections</h3>
          <ul>
            {rejections.map((r, idx) => (
              <li key={idx}>
                "{r.original}" (suggested "{r.replacement}") — reason: {r.reason}
              </li>
            ))}
          </ul>
        </div>
      )} */}
    </div>
  );
}

export default Editor;
