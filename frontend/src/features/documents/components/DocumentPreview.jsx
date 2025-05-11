import React from "react";
import "../documents.css";
import { useNavigate } from "react-router";

function DocumentPreview({ document }) {
  const navigate = useNavigate();

  function handleClick() {
    navigate(`/documents/${document.id}`)
  }

  return (
    <div className="panel document" onClick={handleClick}>
      <h2 className="title">{document.title}</h2>
      <p className="content">{document.content}</p>
    </div>
  );
}

export default DocumentPreview;
