import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import {
  getUsernameById,
  submitBlacklistRequest,
  getInvitesByUserId,
  getDocumentById,
} from "../supabaseClient";

function HomePage() {
  const { user, loading } = useUser();
  const [username, setUsername] = useState(null);
  const [invitedDocs, setInvitedDocs] = useState(null);

  useEffect(() => {
    getUsernameById(user.id).then((uname) => setUsername(uname));
    async function getInvitedDocs() {
      const doc_ids = await getInvitesByUserId(user.id);
      const docs = await Promise.all(
        doc_ids.map(async (id) => {
          const doc = await getDocumentById(id);
          const owner = await getUsernameById(doc.owner_id);
          return { ...doc, owner };
        })
      );
      setInvitedDocs(docs);
    }

    getInvitedDocs();
  }, []);

  function handleBlacklistRequest(e) {
    e.preventDefault();
    console.log("submitting to blacklist");
    submitBlacklistRequest(e.target.word.value);
    e.target.word.value = "";
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    invitedDocs && (
      <div className="home-page">
        <main>
          <div>Welcome, {username}</div>
          <div className="panel blacklist-form">
            <h2 className="title">Suggest a Blacklist Word</h2>
            <form onSubmit={handleBlacklistRequest}>
              <input type="text" name="word" />
              <button type="submit">Submit</button>
            </form>
          </div>
          <div className="panel">
            <h2 className="title">Disputes</h2>
          </div>
          <div className="panel">
            <h2 className="title">Invites</h2>
            <div>
              {invitedDocs.map((doc) => (
                <div key={doc.id} className="invite-entry">
                  <b>{doc.title}</b>
                  <span>-</span>
                  <span className="username">{doc.owner}</span>
                  <button>Accept</button>
                  <button className="reject-btn">Reject</button>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <h2 className="title">Respond to Disputes</h2>
          </div>
        </main>
      </div>
    )
  );
}

export default HomePage;
