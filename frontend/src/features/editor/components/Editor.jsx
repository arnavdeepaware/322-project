import { useState, useEffect, useContext } from "react";
import { useUser } from "../../../context/UserContext";
import { produce } from "immer";
import TextBlock from "../../../components/TextBlock";
import { fetchErrors, fetchShakesperize, getCorrectionSegments } from "./editorUtils";
import {
  getDocumentsByUserId,
  createDocument,
  updateDocument,
} from "../../../supabaseClient";
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
  const [documents, setDocuments] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentTitle, setDocumentTitle] = useState("New Document");  // add title state
  const [input, setInput] = useState("");
  const [shakesText, setShakesText] = useState("");
  const [segments, setSegments] = useState([]);
  const [selectedError, setSelectedError] = useState(0);
  const { user, handleTokenChange } = useUser();

  async function handleShakesperize(text) {
    setInput(text);
    // deduct 3 tokens
    handleTokenChange(-3);
    // use the passed text to ensure latest value
    const result = await fetchShakesperize(text);
    setShakesText(result);
  }

  useEffect(() => {
    getDocumentsByUserId(user.id).then((data) => setDocuments(data));
  }, []);

  function handleSelectDocument(e) {
    const docId = e.target.value;
    if (docId === "") {
      console.log("setting document to null");
      setSelectedDocument(null);
      setInput("");
      setDocumentTitle("");  // reset title
      return;
    }

    const doc = documents.find((doc) => doc.id === parseInt(docId, 10));
    console.log(doc);
    setSelectedDocument(doc);
    setInput(doc.content);
    setDocumentTitle(doc.title || '');  // load existing title
  }

  const handleSubmit = async (text) => {
    setShakesText("");
    setInput(text);
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    handleTokenChange(-wordCount);

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

  const duplicateDoc = !selectedDocument && documents?.find(doc => doc.title === documentTitle);

  async function handleSave() {
    // choose shakesText if present, otherwise build corrected text
    const contentToSave = shakesText
      ? shakesText
      : segments
          .map((segment) =>
            segment.type === "normal" || segment.status !== "accepted"
              ? segment.text
              : segment.correction
          )
          .join("");

    if (selectedDocument || duplicateDoc) {
      const doc = selectedDocument || duplicateDoc;
      console.log("updating document", doc.id);
      const updatedDoc = { ...doc, content: contentToSave, title: documentTitle };
      setSelectedDocument(updatedDoc);
      setDocuments(documents.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
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
    const contentToDownload = shakesText
      ? shakesText
      : segments
          .map((segment) =>
            segment.type === "normal" || segment.status !== "accepted"
              ? segment.text
              : segment.correction
          )
          .join("");
    const blob = new Blob([contentToDownload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href
      = url;
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
      const name = file.name.replace(/\.txt$/i, '');
      setSelectedDocument(null);
      setInput(text);
      setDocumentTitle(name);  // set title from file name
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
            style={{ marginLeft: '1rem' }}
          />

          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            style={{ marginLeft: '1rem' }}
          />

          {/* New Save & Download Buttons */}
          <button
            type="button"
            className="save-btn"
            onClick={handleSave}
            style={{ marginLeft: '1rem' }}
            disabled={!(segments.length > 0 || shakesText)}
          >
            Save Document
          </button>
          <button
            type="button"
            className="download-btn"
            onClick={handleDownload}
            style={{ marginLeft: '0.5rem' }}
            disabled={!(segments.length > 0 || shakesText)}
          >
            Download Document
          </button>
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
              </button>
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
                <HighlightedText
                  segments={segments}
                  selectedError={selectedError}
                />
              }
              isEditable={false}
              buttons={[
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
                ]}
            />
          )}
        </div>
      </div>
    )
  );
}

export default Editor;
