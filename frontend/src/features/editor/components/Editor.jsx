import React, { useState } from "react";
import TextBlock from "../../../components/TextBlock";
import "../Editor.css";

function Editor() {
  const [input, setInput] = useState("");
  console.log(input);

  return (
    <div className="editor">
      <TextBlock
        title={"Input Text"}
        text={input}
        isEditable={true}
        onSubmit={setInput}
      />
      <TextBlock title={"Corrected Text"} text={input} isEditable={false} />
    </div>
  );
}

export default Editor;
