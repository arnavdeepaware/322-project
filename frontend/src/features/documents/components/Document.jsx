import React, { useEffect, useState } from "react";
import {
  getIdByUsername,
  getUsernameById,
  inviteUserToDocument,
  getDocumentInvited,
  getDocumentCollaborators,
  updateDocument,
} from "../../../supabaseClient";
import { useUser } from "../../../context/UserContext";
import "../documents.css";

function Document({ document }) {
  const [owner, setOwner] = useState(null);
  const [collaborators, setCollaborators] = useState(null);
  const [invited, setInvited] = useState(null);

  useEffect(() => {
    getUsernameById(document.owner_id).then((uname) => setOwner(uname));

    async function getCollaborators() {
      const user_ids = await getDocumentCollaborators(document.id);
      const usernames = await Promise.all(
        user_ids.map(async (id) => {
          const username = await getUsernameById(id);
          return username;
        })
      );
      setCollaborators(usernames);
    }

    async function getInvited() {
      const user_ids = await getDocumentInvited(document.id);
      const usernames = await Promise.all(
        user_ids.map(async (id) => {
          const username = await getUsernameById(id);
          return username;
        })
      );
      setInvited(usernames);
    }

    getCollaborators();
    getInvited();
  }, []);

  function handleTitleChange(e) {
    e.preventDefault();
    const newTitle = e.target.title.value;

    updateDocument({ ...document, title: newTitle }).then(() => {
      window.location.reload();
    });
  }

  async function handleInvite(e) {
    e.preventDefault();
    const username = e.target.username.value;

    const id = await getIdByUsername(username);
    if (!id) {
      console.error("User not found");
      return;
    }

    await inviteUserToDocument(id, document.id);
    window.location.reload();
  }

  return (
    invited && collaborators && (
      <div className="panel document">
        <h2 className="title">{document.title}</h2>
        <h5>
          Owner: <span className="username">{owner}</span>
        </h5>
        <h5>
          Collaborators:{" "}
          {collaborators.map((username) => (
            <span key={username} className="username">
              {username}
            </span>
          ))}
        </h5>
        <h5>
          Invited:{" "}
          {invited.map((username) => (
            <span key={username} className="username">
              {username}
            </span>
          ))}
        </h5>
        <p className="content">{document.content}</p>
        <form className="title-form" onSubmit={handleTitleChange}>
          <label htmlFor="">Change Title: </label>
          <input type="text" name="title" />
          <button type="submit">Update</button>
        </form>
        <form className="invite-form" onSubmit={handleInvite}>
          <label htmlFor="">Invite User: </label>
          <input type="text" name="username" />
          <button type="submit">Invite</button>
        </form>
        <button className="delete-btn">Delete</button>
      </div>
    )
  );
}

export default Document;
