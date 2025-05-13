import { useState, useEffect, useContext } from "react";
import { useUser } from "../../../context/UserContext";
import { produce } from "immer";
import TextBlock from "../../../components/TextBlock";
import { fetchErrors, getCorrectionSegments } from "./editorUtils";
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
  const [segments, setSegments] = useState([]);
  const [selectedError, setSelectedError] = useState(0);
  const { user, handleTokenChange } = useUser();

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
    const modifiedText = segments
      .map((segment) =>
        segment.type === "normal" || segment.status !== "accepted"
          ? segment.text
          : segment.correction
      )
      .join("");

    if (selectedDocument || duplicateDoc) {
      const doc = selectedDocument || duplicateDoc;
      console.log("updating document", doc.id);
      const modifiedDocument = { ...doc, content: modifiedText, title: documentTitle };
      const updatedDocuments = documents.map((d) =>
        d.id === modifiedDocument.id ? modifiedDocument : d
      );
      setSelectedDocument(modifiedDocument);
      setDocuments(updatedDocuments);
      await updateDocument(modifiedDocument);
      console.log("Document updated successfully", modifiedDocument.id);
    } else {
      console.log("creating new document");
      await createDocument(user.id, modifiedText, documentTitle);
    }

    handleTokenChange(-5);

  }
    function handleDonwload() {
    const modifiedText = segments
      .map((segment) =>
        segment.type === "normal" || segment.status !== "accepted"
          ? segment.text
          : segment.correction
      )
      .join("");
    const blob = new Blob([modifiedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href
      = url;
    a.download = documentTitle || "corrected_text.txt";  // use document title or default name
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          {/* Document name input */}
          <input
            type="text"
            placeholder="Document Name"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            className="document-name-input"
            style={{ marginLeft: '1rem' }}
          />
          {/* File input for importing .txt files */}
          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            style={{ marginLeft: '1rem' }}
          />
        </div>
        <div className="editor-text-blocks">
          <TextBlock
            title="Input Text"
            text={input}
            isEditable={true}
            onSubmit={handleSubmit}
            submitLabel="Correct"
          />
          <hr />
          <TextBlock
            title="Corrected Text"
            text={
              <HighlightedText
                segments={segments}
                selectedError={selectedError}
              />
            }
            isEditable={false}
            onSubmit={handleSave}
            submitLabel={selectedDocument || duplicateDoc ? "Update Text" : "Save Text"}
            buttons={[
              <button
                className="accept-btn"
                key="accept"
                type="button"
                onClick={handleAccept}
              >
                Accept
              </button>,
              <button
                className="reject-btn"
                key="reject"
                type="button"
                onClick={handleReject}
              >
                Reject
              </button>,
              <button
                className="download-btn"
                key="download"
                type="button"
                onClick={handleDonwload}
                >Download</button>,
            ]}
          ></TextBlock>
        </div>
      </div>
    )
  );
}

export default Editor;
