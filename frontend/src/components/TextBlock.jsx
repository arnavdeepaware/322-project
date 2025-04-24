import React, { useState, useEffect } from "react";
import "../index.css";

function TextBlock({
  title = null,
  text = "",
  isEditable,
  isCorrected,
  onSubmit,
  onCorrect,
  submitLabel = "Submit Text",
  correctLabel = "Make Corrections",
  rejectLabel = "Reject Corrections",
}) {

  const blacklist = ["fuck"]
  const [inputValue, setInputValue] = useState(text);

  function handleChange(e) {
    setInputValue(replaceBlacklistedWords(e.target.value));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit?.(inputValue);
  }

  function handleCorrection(e){
    e.preventDefault();
    onCorrect?.(inputValue);
  }

  useEffect(() => {
    setInputValue(text);
  }, [text]);

  const replaceBlacklistedWords = (text) => {
    let modifiedText = text;
    blacklist.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      modifiedText = modifiedText.replace(regex, "*".repeat(word.length));
    });
    return modifiedText;
  }

  return (
    <div className="text-block">
      {title && <h2>{title}</h2>}
      <form onSubmit={handleSubmit}>
        {isEditable ? (
          <textarea
            className="text-block-input"
            readOnly={!isEditable}
            value={inputValue}
            onChange={handleChange}
          />
        ) : (
          <div className="text-block-input">{text}</div>
        )}

        {isEditable && (
          <button className="submit-btn" type="submit">
            {submitLabel}
          </button>
        )}
        {!isEditable && !isCorrected && (
          <button className="submit-btn" type="button" onClick={handleCorrection}>
            {correctLabel}
          </button>
        )}
      </form>
    </div>
  );
}

export default TextBlock;
