import React, { useEffect, useState } from "react";
import Document from "../features/documents/components/Document";
import { useParams } from "react-router";
import { getDocumentById } from "../supabaseClient";

function DocumentPage() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);

  useEffect(() => {
    getDocumentById(id).then((data) => setDocument(data));
  }, []);

  return (
    document && (
      <div className="document-page">
        <main>
          <Document document={document} />
        </main>
      </div>
    )
  );
}

export default DocumentPage;
