import React from "react";
import "./documents.css";

function DocumentPreview({ document }) {
  return (
    <div className="panel document">
      <h2 className="title">{document.title}</h2>
      <p className="content">{document.content}</p>
    </div>
  );
}

export default DocumentPreview;
{
  document;
}
