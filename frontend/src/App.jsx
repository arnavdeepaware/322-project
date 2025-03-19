import { useState } from 'react'
import './App.css'

function App() {
  const [rawText, setRawText] = useState("");

  function updateRawText(e) {
    e.preventDefault();
    setRawText(e.target.elements.textInput.value);
  }

  return (
    <div className="editor">
      <form onSubmit={updateRawText}>
        <textarea className="editor-input" name="textInput" />
        <div className="buttons-container">
          <button type="submit">Submit</button>
        </div>
      </form>
      <textarea className='editor-output' value={rawText} readOnly />
    </div>
  )
}

export default App
