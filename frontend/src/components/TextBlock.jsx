import React, { useState, useEffect } from "react";
import "../index.css";

function TextBlock({
  title = null,
  text = "",
  isEditable,
  onSubmit,
  onChange,
  submitLabel = "Submit Text",
  buttons,
}) {
  const [inputValue, setInputValue] = useState(text);

  function handleChange(e) {
    const newVal = e.target.value;
    setInputValue(newVal);
    onChange?.(newVal);
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit?.(inputValue);
  }

  useEffect(() => {
    setInputValue(text);
  }, [text]);

  return (
    <div className="panel">
      {title && <h2 className="title">{title}</h2>}
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

        <div className="buttons">
          {buttons}
          {onSubmit && (
            <button className="submit-btn" type="submit">
              {submitLabel}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default TextBlock;
