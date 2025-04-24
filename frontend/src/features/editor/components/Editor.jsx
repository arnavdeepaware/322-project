import React, { useState } from "react";
import TextBlock from "../../../components/TextBlock";
import "../Editor.css";


function Editor() {
  const [input, setInput] = useState("");
  const [isCorrected, setIsCorrected] = useState(true);
  const [errors, setErrors] = useState([]);
  const [errorText, setErrorText] = useState("No errors yet");
  const [correctedText, setCorrectedText] = useState("");

  
  const fetchData = async (input) => {
    console.log("Fetching data from server...");
    const response = await fetch("http://localhost:5000/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: input }),
    });
    const data = await response.json();
    console.log(data)
    return data;
  }

  const fetchCorrection = async (input, errorsArray) => {
    console.log("Fetching data from server...");
    const response = await fetch("http://localhost:5000/correct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: input, errors: errorsArray }),
    });
    const data = await response.json();
    console.log(data)
    return data;
  }
  const handleCorrection = async () => {
    const data = await fetchCorrection(input, errors);
    setCorrectedText(data[0].Corrected_Text || "");
    setIsCorrected(true);
  };

  const handleSubmit = async (inputValue) => {
    setInput(inputValue);
    const data = await fetchData(inputValue);
    setErrors(data);
    const list = data.length
      ? data.map(err => `Error: "${err.error}"\nCorrection: "${err.correction}"\nPosition: ${err.position}`).join("\n\n")
      : "No errors found";
    setErrorText(list);
    setIsCorrected(false);
  };
  return (
    <div className="editor">
      <TextBlock
        title={"Input Text"}
        text={input}
        isEditable={true}
        onSubmit={handleSubmit}
      />
      {!isCorrected ? (
        <TextBlock
          title="Corrections"
          text={errorText}
          isEditable={false}
          isCorrected={false}
          onCorrect={handleCorrection}
        />
      ) : (
        <TextBlock
          title="Corrected Text"
          text={correctedText}
          isEditable={false}
          isCorrected={true}
        />
      )}
    </div>
  );
}

export default Editor;
