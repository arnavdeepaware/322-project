import React from "react";
import { inviteUserToDocument, updateDocument } from "../../../supabaseClient";
import { useUser } from "../../../context/UserContext";

function Document({ document }) {
  const { user } = useUser();

  function handleTitleChange(e) {
    e.preventDefault();
    const newTitle = e.target.title.value;

    updateDocument({ ...document, title: newTitle }).then(() => {
      window.location.reload();
    });
  }

  function handleInvite(e) {
    // e.preventDefault();
    // inviteUserToDocument(user.id, document.id).then(() => {
    //   window.location.reload();
    // });
  }

  return (
    <div className="panel document">
      <h2 className="title">{document.title}</h2>
      <h5>Owner: {user.id}</h5>
      <h5>Collaborators: </h5>
      <h5>Invited: </h5>
      <p className="content">{document.content}</p>
      <form className="title-form" onSubmit={handleTitleChange}>
        <label htmlFor="">Change Title: </label>
        <input type="text" name="title" />
        <button type="submit">Update</button>
      </form>
      <form className="invite-form">
        <label htmlFor="">Invite User: </label>
        <input type="text" />
        <button type="submit">Invite</button>
      </form>
    </div>
  );
}

export default Document;
