import React, { useState } from "react";
import TextBlock from "../../../components/TextBlock";
import { fetchErrors, getCorrectionSegments } from "./editorUtils";
import "../Editor.css";

function HighlightedText({ text, errors, selectedError }) {
  const segments = getCorrectionSegments(text, errors);
  const segmentSpans = segments.map((segment, i) =>
    i === 2 * selectedError + 1 ? (
      <span key={i} className="highlighted selected">
        {segment.text}
      </span>
    ) : (
      <span key={i} className={segment.type === "error" ? "highlighted" : ""}>
        {segment.text}
      </span>
    )
  );

  return (
    <TextBlock title="Corrected Text" text={segmentSpans}>
    </TextBlock>
  );
}

function Editor() {
  const [input, setInput] = useState("");
  const [errors, setErrors] = useState([]); // ops for highlighting
  const [acceptances, setAcceptances] = useState([]);
  const [rejections, setRejections] = useState([]);

  const handleSubmit = async (text) => {
    setInput(text);
    const data = await fetchErrors(text);
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

      <HighlightedText
        text={errors.length === 0 ? "" : input}
        errors={errors}
        selectedError={2}
        acceptances={acceptances}
        rejections={rejections}
      />
    </div>
  );
}

export default Editor;
