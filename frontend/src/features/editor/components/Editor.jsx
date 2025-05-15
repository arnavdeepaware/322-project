import { useState, useEffect, useContext } from "react";
import { useUser } from "../../../context/UserContext";
import { produce } from "immer";
import TextBlock from "../../../components/TextBlock";
import EditorStats from './EditorStats';
import { supabase } from "../../../supabaseClient"; // Add this import
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
  const { handleTokenChange, updateStatistics, user, guest } = useUser();
  const [mode, setMode] = useState("llm");
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentTitle, setDocumentTitle] = useState("New Document");
  const [input, setInput] = useState("");
  const [shakesText, setShakesText] = useState("");
  const [segments, setSegments] = useState([]);
  const [selectedError, setSelectedError] = useState(0);
  const [selfCorrectedWords, setSelfCorrectedWords] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blacklistWords, setBlacklistWords] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      console.log('Current auth state:', {
        user: authUser,
        error,
        contextUser: user
      });
    };
    
    checkAuth();
  }, [user]);

  const handleShakesperize = async (text) => {
    try {
      setInput(text);
      const TOKEN_COST = 3;

      const { error } = await supabase.rpc('update_user_stats', {
        p_user_id: user.id,
        p_used_tokens: TOKEN_COST,
        p_edited_texts: 1,
        p_corrections: 0
      });

      if (error) throw error;
      
      // Update local state
      handleTokenChange(-TOKEN_COST);
      updateStatistics('usedTokens', TOKEN_COST);
      updateStatistics('editedTexts', 1);
      
      const result = await fetchShakesperize(text);
      setShakesText(result);
    } catch (error) {
      console.error('Error updating statistics:', error);
    }
  };

  useEffect(() => {
    async function getDocuments() {
      try {
        setLoading(true);
        const owned = await getDocumentsByUserId(user.id);
        const shared_ids = await getSharedDocumentIds(user.id);
        const shared = await Promise.all(
          shared_ids.map(async (id) => {
            const doc = await getDocumentById(parseInt(id, 10));
            return doc;
          })
        );

        setDocuments([...(owned || []), ...(shared || [])].filter(Boolean));
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      getDocuments();
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
      setSelectedDocument(null);
      setInput("");
      setDocumentTitle("New Document");
      return;
    }

    const doc = documents.find((doc) => doc.id === parseInt(docId, 10));
    if (doc) {
      setSelectedDocument(doc);
      setInput(doc.content || "");
      setDocumentTitle(doc.title || "Untitled Document");
    }
  }

  const handleSubmit = async (text) => {
    try {
      const censored = censorText(text, blacklistWords);
      const trimmed = censored.trim();
      const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
      const censorCost = censored.split("*").length - 1;
      const totalCost = censorCost + wordCount;

      if (guest && wordCount > 20) {
        alert("Guest users may only submit up to 20 words.");
        return;
      }

      // Update stats using the new function
      const { error } = await supabase.rpc('update_user_stats', {
        p_user_id: user.id,
        p_used_tokens: totalCost,
        p_edited_texts: 1,
        p_corrections: 0
      });

      if (error) throw error;

      // Update local state
      handleTokenChange(-totalCost);
      updateStatistics('usedTokens', totalCost);
      updateStatistics('editedTexts', 1);

      // Process text based on mode
      if (mode === "llm") {
        const errors = await fetchErrors(text);
        
        console.log("Errors: ", errors.length);

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
    } catch (error) {
      console.error('Error updating statistics:', error);
    }
  };

  const handleAccept = async () => {
    try {
      if (2 * selectedError + 1 >= segments.length) return;
      const TOKEN_COST = 1;

      // Update user stats directly
      const { error } = await supabase
        .from('users')
        .update({
          tokens: supabase.raw('tokens - ?', [TOKEN_COST]),
          used_tokens: supabase.raw('used_tokens + ?', [TOKEN_COST]),
          corrections: supabase.raw('corrections + 1')
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update UI
      setSegments((prev) =>
        produce(prev, (draft) => {
          draft[2 * selectedError + 1].status = "accepted";
        })
      );
      setSelectedError((prev) => prev + 1);
      handleTokenChange(-TOKEN_COST);
      updateStatistics('usedTokens', TOKEN_COST);
      updateStatistics('corrections', 1);
    } catch (error) {
      console.error('Error updating statistics:', error);
    }
  };

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

  const handleSave = async () => {
    try {
      let contentToSave;

      if (shakesText) {
        contentToSave = segments
          .map((segment) =>
            segment.type === "normal" || segment.status !== "accepted"
              ? segment.text
              : segment.correction
          )
          .join("");
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

      console.log('Attempting to update tokens for Save:', {
        userId: user.id,
        tokenCost: 5
      });

      const { data: tokenData, error: statsError } = await supabase.rpc('increment_statistic', {
        p_user_id: user.id,
        p_column: 'used_tokens',
        p_value: 5
      });

      console.log('Token update response:', { tokenData, error: statsError });

      if (statsError) throw statsError;

      handleTokenChange(-5);
      updateStatistics('usedTokens', 5);
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  const handleDownload = async () => {
    try {
      let contentToDownload;

      if (shakesText) {
        contentToDownload = segments
          .map((segment) =>
            segment.type === "normal" || segment.status !== "accepted"
              ? segment.text
              : segment.correction
          )
          .join("");
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

      // Update database statistics with correct function name
      const { error: statsError } = await supabase.rpc('increment_statistic', {
        p_user_id: user.id,
        p_column: 'used_tokens',
        p_value: 5
      });

      if (statsError) throw statsError;

      handleTokenChange(-5);
      updateStatistics('usedTokens', 5);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const name = file.name.replace(/\.txt$/i, "");
      setSelectedDocument(null);
      setInput(text);
      setDocumentTitle(name);
      setSegments([]);
      setSelectedError(0);
    };
    reader.readAsText(file);
  }

  return (
    <div className="editor panel">
      <div className="editor-header">
        <div className="editor-top">
          <div className="editor-controls">
            <div className="control-group">
              <label>Select Document: </label>
              <select
                className="document-select"
                value={selectedDocument ? selectedDocument.id : ""}
                onChange={handleSelectDocument}
              >
                <option key="new-doc" value="">New Document</option>
                {documents.map((document) => (
                  <option key={document.id} value={document.id}>
                    {document.title || "Untitled Document"}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <input
                type="text"
                placeholder="Document Name"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="document-name-input"
              />
            </div>

            <div className="button-group">
              <button
                type="button"
                className="save-btn"
                onClick={handleSave}
                disabled={!(segments.length > 0 || shakesText)}
              >
                Save Document
              </button>
              <button
                type="button"
                className="download-btn"
                onClick={handleDownload}
                disabled={!(segments.length > 0 || shakesText)}
              >
                Download Document
              </button>
            </div>
          </div>

          <div className="editor-controls">
            <div className="control-group">
              <label>Upload Document: </label>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
              />
            </div>

            <div className="control-group">
              <label>Mode: </label>
              <select value={mode} onChange={toggleMode}>
                <option value="llm">LLM Correction</option>
                <option value="self">Self-correction</option>
              </select>
            </div>
          </div>

          <EditorStats />
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
  );
}

export default Editor;
