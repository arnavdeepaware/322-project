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
  const [documents, setDocuments] = useState([]);
  const [viewMode, setViewMode] = useState("own");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function getDocuments() {
      try {
        setLoading(true);
        setError(null);

        if (viewMode === "own") {
          const ownedDocs = await getDocumentsByUserId(user.id);
          setDocuments(ownedDocs || []);
        } else {
          const sharedIds = await getSharedDocumentIds(user.id);
          if (!sharedIds || sharedIds.length === 0) {
            setDocuments([]);
            return;
          }

          const sharedDocs = await Promise.all(
            sharedIds.map(async (id) => {
              try {
                const doc = await getDocumentById(parseInt(id, 10));
                return doc;
              } catch (err) {
                console.error(`Error fetching document ${id}:`, err);
                return null;
              }
            })
          );

          // Filter out any null documents and ensure we have valid data
          const validDocs = sharedDocs.filter(doc => doc && doc.id);
          setDocuments(validDocs);
        }
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
  }, [viewMode, user]);

  if (!user) {
    return <div className="p-4">Please sign in to view your documents.</div>;
  }

  if (loading) {
    return (
      <div className="documents-page">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="documents-page">
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="documents-page">
      <div className="mb-4">
        <label className="mr-2">View Mode: </label>
        <select 
          name="view" 
          onChange={(e) => setViewMode(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="own">Own Documents</option>
          <option value="shared">Shared Documents</option>
        </select>
      </div>

      {documents.length === 0 ? (
        <div className="p-4 text-gray-500 text-center">
          {viewMode === "own" 
            ? "You don't have any documents yet." 
            : "No shared documents found."}
        </div>
      ) : (
        <div className="documents grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((document) => (
            <DocumentPreview key={document.id} document={document} />
          ))}
        </div>
      )}
    </div>
  );
}

export default DocumentsPage;
