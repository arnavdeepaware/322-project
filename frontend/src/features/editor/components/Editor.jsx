import { useState, useEffect, useContext } from "react";
import { useUser } from "../../../context/UserContext";
import { produce } from "immer";
import TextBlock from "../../../components/TextBlock";
import {
  censorText,
  fetchErrors,
  fetchShakesperize,
  getCorrectionSegments,
  getSelfCorrectionSegments,
} from "./editorUtils";
import {
  getDocumentsByUserId,
  createDocument,
  updateDocument,
  getSharedDocumentIds,
  getDocumentById,
  getBlacklistWords,
} from "../../../supabaseClient";
import "../Editor.css";

function SelfCorrectedText({
  segments,
  setSegments,
  selfCorrectedWords,
  setSelfCorrectedWords,
}) {
  const [selected, setSelected] = useState();

  function handleEditSegment(e, index) {
    // must later decrement tokens in this part
    if (!(index in selfCorrectedWords)) {
      setSelfCorrectedWords((prev) => ({
        ...prev,
        [index]: true,
      }));
    }

    setSegments(
      segments.map((segment, i) =>
        index === i ? { ...segment, text: e.target.value } : segment
      )
    );
  }

  return (
    <div className="segments">
      {segments.map((segment, index) => (
        <input
          key={index}
          className={
            "highlighted editable-segment" +
            (index === selected ? " selected" : "")
          }
          value={segment.text}
          style={{ width: `${segment.text.length + 1}ch` }}
          onChange={(e) => handleEditSegment(e, index)}
          onClick={() => setSelected(index)}
        />
      ))}
    </div>
  );
}

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
  const [mode, setMode] = useState("llm");
  const [documents, setDocuments] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentTitle, setDocumentTitle] = useState("New Document"); // add title state
  const [input, setInput] = useState("");
  const [shakesText, setShakesText] = useState("");
  const [segments, setSegments] = useState([]);
  const [selectedError, setSelectedError] = useState(0);
  const [selfCorrectedWords, setSelfCorrectedWords] = useState({});
  const [blacklistWords, setBlacklistWords] = useState(null);
  const { user, guest, handleTokenChange } = useUser();

  async function handleShakesperize(text) {
    setInput(text);
    // deduct 3 tokens
    handleTokenChange(-3);
    // use the passed text to ensure latest value
    const result = await fetchShakesperize(text);
    setShakesText(result);
  }

  useEffect(() => {
    async function fetchDocs() {
      const owned = await getDocumentsByUserId(user.id);
      const shared_ids = await getSharedDocumentIds(user.id);
      const shared = await Promise.all(
        shared_ids.map((id) => getDocumentById(id))
      );
      setDocuments([...owned, ...shared]);
    }
    // only fetch when real user is present; guests see no documents
    if (user) {
      fetchDocs();
    } else if (guest) {
      setDocuments([]);
    }

    getBlacklistWords().then((data) =>
      setBlacklistWords(data.map((entry) => entry.word))
    );
  }, [user, guest]);

  function toggleMode(e) {
    const newMode = e.target.value;
    setMode(newMode);
    setSegments([]);
    setSelectedError(0);
    console.log("set to ", newMode);
  }

  function handleSelectDocument(e) {
    const docId = e.target.value;
    if (docId === "") {
      console.log("setting document to null");
      setSelectedDocument(null);
      setInput("");
      setDocumentTitle(""); // reset title
      return;
    }

    const doc = documents.find((doc) => doc.id === parseInt(docId, 10));
    console.log(doc);
    setSelectedDocument(doc);
    setInput(doc.content);
    setDocumentTitle(doc.title || ""); // load existing title
  }

  const handleSubmit = async (text) => {
    setShakesText("");

    const censored = censorText(text, blacklistWords);
    handleTokenChange(-(censored.split("*").length - 1));

    const trimmed = censored.trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    // free guest users can only submit up to 20 words
    if (guest && wordCount > 20) {
      alert("Guest users may only submit up to 20 words.");
      return;
    }
    setInput(trimmed);
    handleTokenChange(-wordCount);

    if (mode === "llm") {
      const errors = await fetchErrors(text);
      //console.log("Errors: ", errors[0].correction);
      console.log("Errors: ", errors.length);

      // bonus of 3 tokens if over 10 words and no errors
      if (
        wordCount >= 10 &&
        (errors.length === 0 ||
          errors[0].correction.trim() == "No errors found." ||
          errors[0].correction.trim() === text.trim())
      ) {
        console.log("Yer a genius Harry!");
        handleTokenChange(3);
      }
      setSegments(getCorrectionSegments(trimmed, errors));
      setSelectedError(0);
    } else if (mode === "self") {
      setSegments(getSelfCorrectionSegments(trimmed));
    }
  };

  function handleAccept() {
    if (2 * selectedError + 1 >= segments.length) return;

    setSegments((prev) =>
      produce(prev, (draft) => {
        draft[2 * selectedError + 1].status = "accepted";
      })
    );
    setSelectedError((prev) => prev + 1);
    handleTokenChange(-1);
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

  const duplicateDoc =
    !selectedDocument && documents?.find((doc) => doc.title === documentTitle);

  async function handleSave() {
    // choose shakesText if present, otherwise build corrected text
    let contentToSave;

    if (shakesText) {
      // save the shakesperized output directly
      contentToSave = shakesText;
    } else if (mode === "llm") {
      contentToSave = segments
        .map((segment) =>
          segment.type === "normal" || segment.status !== "accepted"
            ? segment.text
            : segment.correction
        )
        .join("");
    } else {
      contentToSave = segments.map((segment) => segment.text).join(" ");
    }

    if (selectedDocument || duplicateDoc) {
      const doc = selectedDocument || duplicateDoc;
      console.log("updating document", doc.id);
      const updatedDoc = {
        ...doc,
        content: contentToSave,
        title: documentTitle,
      };
      setSelectedDocument(updatedDoc);
      setDocuments(
        documents.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
      );
      await updateDocument(updatedDoc);
      console.log("Document updated successfully", updatedDoc.id);
    } else {
      console.log("creating new document");
      await createDocument(user.id, contentToSave, documentTitle);
    }

    handleTokenChange(-5);
  }

  function handleDownload() {
    // choose current content for download
    let contentToDownload;

    if (shakesText) {
      // download the shakesperized output directly
      contentToDownload = shakesText;
    } else if (mode === "llm") {
      contentToDownload = segments
        .map((segment) =>
          segment.type === "normal" || segment.status !== "accepted"
            ? segment.text
            : segment.correction
        )
        .join("");
    } else {
      contentToDownload = segments.map((segment) => segment.text).join(" ");
    }

    const blob = new Blob([contentToDownload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = documentTitle || "download.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    handleTokenChange(-5);
  }
  // Add file import handler to load .txt files into the editor
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const name = file.name.replace(/\.txt$/i, "");
      setSelectedDocument(null);
      setInput(text);
      setDocumentTitle(name); // set title from file name
      setSegments([]);
      setSelectedError(0);
    };
    reader.readAsText(file);
  }

  return (
    documents && (
      <div className="editor panel">
        <div className="editor-header">
          <label>Select Document: </label>
          <select
            className="document-select"
            value={selectedDocument ? selectedDocument.id : ""}
            onChange={handleSelectDocument}
          >
            <option key="new-doc" value="">
              New Document
            </option>
            {documents.map((document) => (
              <option key={document.id} value={document.id}>
                {document.title}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Document Name"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            className="document-name-input"
            style={{ marginLeft: "1rem" }}
          />

          {/* New Save & Download Buttons */}
          <button
            type="button"
            className="save-btn"
            onClick={handleSave}
            style={{ marginLeft: "1rem" }}
            disabled={!(segments.length > 0 || shakesText)}
          >
            Save Document
          </button>
          <button
            type="button"
            className="download-btn"
            onClick={handleDownload}
            style={{ marginLeft: "0.5rem" }}
            disabled={!(segments.length > 0 || shakesText)}
          >
            Download Document
          </button>

          <div className="editor-header2">
            <label>Upload Document: </label>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              style={{ marginLeft: "1rem" }}
            />
            <label>Mode: </label>
            <select value={mode} onChange={toggleMode}>
              <option value="llm">LLM Correction</option>
              <option value="self">Self-correction</option>
            </select>
          </div>
        </div>

        <div className="editor-text-blocks">
          <TextBlock
            title="Input Text"
            text={input}
            isEditable={true}
            onSubmit={handleSubmit}
            onChange={setInput}
            submitLabel="Correct"
            buttons={[
              <button
                key="shake"
                type="button"
                className="shake-btn"
                onClick={() => handleShakesperize(input)}
              >
                Shakesperize
              </button>,
            ]}
          />

          <hr />

          {shakesText ? (
            <TextBlock
              title="Shakesperized Text"
              text={shakesText}
              isEditable={false}
            />
          ) : (
            <TextBlock
              title="Corrected Text"
              text={
                mode === "llm" ? (
                  <HighlightedText
                    segments={segments}
                    selectedError={selectedError}
                  />
                ) : (
                  <SelfCorrectedText
                    segments={segments}
                    setSegments={setSegments}
                    setSelfCorrectedWords={setSelfCorrectedWords}
                    selfCorrectedWords={selfCorrectedWords}
                  />
                )
              }
              isEditable={false}
              buttons={
                mode === "llm"
                  ? [
                      <button
                        key="accept"
                        className="accept-btn"
                        type="button"
                        onClick={handleAccept}
                      >
                        Accept
                      </button>,
                      <button
                        key="reject"
                        className="reject-btn"
                        type="button"
                        onClick={handleReject}
                      >
                        Reject
                      </button>,
                    ]
                  : null
              }
            />
          )}
        </div>
      </div>
    )
  );
}

export default Editor;
