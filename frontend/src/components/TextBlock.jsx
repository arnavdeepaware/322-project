import React, { useState, useEffect } from "react";
import "../index.css";

function TextBlock({
  title = null,
  text = "",
  isEditable,
  onSubmit,
  submitLabel = "Submit Text",
}) {
  const [inputValue, setInputValue] = useState(text);

  function handleChange(e) {
    setInputValue(e.target.value);
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit?.(inputValue);
  }

  useEffect(() => {
    setInputValue(text);
  }, [text]);

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
      </form>
    </div>
  );
}

export default TextBlock;
