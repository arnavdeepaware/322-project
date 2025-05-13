import { useEffect, useState } from "react";
import DocumentPreview from "../features/documents/components/DocumentPreview";
import {
  getDocumentById,
  getDocumentsByUserId,
  getSharedDocumentIds,
} from "../supabaseClient";
import { useUser } from "../context/UserContext";

function DocumentsPage() {
  const { user } = useUser();
  const [documents, setDocuments] = useState(null);
  const [viewMode, setViewMode] = useState("own");

  useEffect(() => {
    async function getDocuments() {
      if (viewMode === "own") {
        getDocumentsByUserId(user.id)
          .then((data) => setDocuments(data))
          .catch((err) => console.error(err));
      } else {
        const doc_ids = await getSharedDocumentIds(user.id);
        const docs = await Promise.all(
          doc_ids.map(async (id) => {
            const doc = await getDocumentById(id);
            return doc;
          })
        );

        setDocuments(docs);
      }
    }
    getDocuments();
  }, [viewMode]);

  if (!user) return <div>Please sign in to view your documents.</div>;

  return (
    <div className="documents-page">
      <label>View Mode: </label>
      <select name="view" onChange={(e) => setViewMode(e.target.value)}>
        <option value="own">Own</option>
        <option value="shared">Shared</option>
      </select>
      <div className="documents">
        {documents?.map((document) => (
          <DocumentPreview key={document.id} document={document} />
        ))}
      </div>
    </div>
  );
}

export default DocumentsPage;
