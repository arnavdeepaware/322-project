import { useState, useEffect, useContext } from "react";
import { useUser } from "../../../context/UserContext";
import { produce } from "immer";
import TextBlock from "../../../components/TextBlock";
import { fetchErrors, getCorrectionSegments } from "./editorUtils";
import { createDocument } from "../../../supabaseClient";
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
  const { user } = useUser();
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

  function handleSave() {
    const modifiedText = segments.map((segment) =>
      segment.type === "normal" || segment.status !== "accepted"
        ? segment.text
        : segment.correction
    ).join("");

    console.log(modifiedText);
    createDocument(user.id, modifiedText)
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
        submitLabel="Correct"
      />

      <TextBlock
        title="Corrected Text"
        text={
          <HighlightedText segments={segments} selectedError={selectedError} />
        }
        isEditable={false}
        onSubmit={handleSave}
        submitLabel="Save Text"
        buttons={[
          <button key="accept" onClick={handleAccept}>
            Accept
          </button>,
          <button key="reject" onClick={handleReject}>
            Reject
          </button>,
        ]}
      ></TextBlock>
    </div>
  );
}

export default Editor;
