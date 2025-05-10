import React, { useState, useEffect } from "react";
import { produce } from "immer";
import TextBlock from "../../../components/TextBlock";
import { fetchErrors, getCorrectionSegments } from "./editorUtils";
import "../Editor.css";

function HighlightedText({ segments, selectedError }) {
  const segmentSpans = segments.map((segment, i) => {
    let spanContent;
    let spanClass = "";

    switch (true) {
      case i === 2 * selectedError + 1:
        spanContent = segment.correction;
        spanClass = "selected";
        break;
      case segment.type === "error" && segment.status === "pending":
        spanContent = segment.correction;
        spanClass = "highlighted";
        break;
      case segment.type == "error" && segment.status === "accepted":
        spanContent = segment.correction;
        spanClass = "accepted";
        break;
      case segment.type == "error" && segment.status === "rejected":
        spanContent = segment.text;
        spanClass = "rejected";
        break;
      default:
        spanContent = segment.text;
        break;
    }

    return (
      <span key={i} className={spanClass}>
        {spanContent}
      </span>
    );
  });

  return <div className="segments">{segmentSpans}</div>;
}

function Editor() {
  const [input, setInput] = useState("");
  const [segments, setSegments] = useState([]);
  const [selectedError, setSelectedError] = useState(0);

  const handleSubmit = async (text) => {
    setInput(text);
    const errors = await fetchErrors(text);
    setSegments(getCorrectionSegments(text, errors));
    setSelectedError(0);
  };

  function handleAccept() {
    if (2 * selectedError + 1 >= segments.length) return;

    setSegments((prev) =>
      produce(prev, (draft) => {
        draft[2 * selectedError + 1].status = "accepted";
      })
    );
    setSelectedError((prev) => prev + 1);
  }

  function handleReject() {
    if (2 * selectedError + 1 >= segments.length) return;

    setSegments((prev) =>
      produce(prev, (draft) => {
        draft[2 * selectedError + 1].status = "rejected";
      })
    );
    setSelectedError((prev) => prev + 1);
  }

  useEffect(() => {
    console.log(segments);
  }, [segments]);

  return (
    <div className="editor">
      <TextBlock
        title="Input Text"
        text={input}
        isEditable={true}
        onSubmit={handleSubmit}
      />

      <TextBlock
        title="Corrected Text"
        text={
          <HighlightedText segments={segments} selectedError={selectedError} />
        }
        isEditable={false}
      >
        <button onClick={handleAccept}>Accept</button>
        <button onClick={handleReject}>Reject</button>
      </TextBlock>
    </div>
  );
}

export default Editor;
