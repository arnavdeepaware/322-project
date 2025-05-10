import React, { useEffect, useState } from "react";
import DocumentPreview from "../features/documents/components/DocumentPreview";
import { getDocumentsByUserId } from "../supabaseClient";
import { useUser } from "../context/UserContext";

function DocumentsPage() {
  const { user, loading } = useUser();
  const [documents, setDocuments] = useState(null);

  useEffect(() => {
    if (!loading && user) {
      getDocumentsByUserId(user.id)
        .then((data) => setDocuments(data))
        .catch((err) => console.error(err));
    }
  }, [user, loading]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in to view your documents.</div>;

  return (
    <div className="documents-page">
      <div className="documents">
        {documents?.map((document) => (
          <DocumentPreview key={document.id} document={document} />
        ))}
      </div>
    </div>
  );
}

export default DocumentsPage;
