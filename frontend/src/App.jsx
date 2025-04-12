import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [rawText, setRawText] = useState("");
  const [corrections, setCorrections] = useState([]);
  const [correctedText, setCorrectedText] = useState("");
  const [showingErrors, setShowingErrors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [submitCooldownTime, setSubmitCooldownTime] = useState(0);
  const cooldownTimerRef = useRef(null);

  async function updateRawText(e) {
    e.preventDefault();
    
    // If already submitting or in cooldown, prevent multiple submissions
    if (isSubmitting || submitCooldownTime > 0) {
      return;
    }
    
    const inputText = e.target.elements.textInput.value;
    setRawText(inputText);
    setIsSubmitting(true);
    setShowingErrors(true);

    try {
      const response = await fetch('http://localhost:5000/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (response.ok) {
        const data = await response.json();
        setCorrections(data);
        setCorrectedText(""); // Reset corrected text when new errors are fetched
      } else {
        console.error('Failed to fetch corrections');
        setCorrections([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setCorrections([]);
    } finally {
      setIsSubmitting(false);
      
      // Start cooldown timer (5 seconds)
      setSubmitCooldownTime(5);
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
      
      cooldownTimerRef.current = setInterval(() => {
        setSubmitCooldownTime(prevTime => {
          if (prevTime <= 1) {
            clearInterval(cooldownTimerRef.current);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
  }

  async function acceptCorrections() {
    if (isAccepting || corrections.length === 0) {
      return;
    }
    
    setIsAccepting(true);
    
    try {
      const response = await fetch('http://localhost:5000/correct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: rawText,
          errors: corrections
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0 && data[0]["Corrected Text"]) {
          setCorrectedText(data[0]["Corrected Text"]);
          setShowingErrors(false);
        } else {
          console.error('Unexpected response format');
        }
      } else {
        console.error('Failed to fetch corrected text');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsAccepting(false);
    }
  }

  // Format corrections for display
  const formattedCorrections = corrections.length > 0
    ? corrections.map(item => 
        `Error: "${item.error}" should be "${item.correction}" (position: ${item.position})`
      ).join('\n')
    : "No corrections needed.";

  return (
    <div className="editor-container">
      <h1>Edit Flow</h1>
      
      <div className="editor-section">
        <div className="editor-column">
          <h2>Input Text</h2>
          <form onSubmit={updateRawText}>
            <textarea 
              className="editor-input" 
              name="textInput" 
              placeholder="Enter your text here..."
            />
            <button 
              className="submit-button"
              type="submit" 
              disabled={isSubmitting || submitCooldownTime > 0}
            >
              {isSubmitting ? 'Checking...' : 
               submitCooldownTime > 0 ? `Wait (${submitCooldownTime}s)` : 'Submit'}
            </button>
          </form>
        </div>
        
        <div className="editor-column">
          <h2>{showingErrors ? "Corrections" : "Corrected Text"}</h2>
          <textarea 
            className={`editor-output ${
              isSubmitting 
                ? '' 
                : showingErrors && corrections.length > 0 
                  ? 'editor-output-errors' 
                  : 'editor-output-corrected'
            }`}
            value={isSubmitting 
              ? "Checking..." 
              : showingErrors ? formattedCorrections : correctedText
            } 
            readOnly 
          />
          <button 
            className="accept-button"
            type="button" 
            onClick={acceptCorrections}
            disabled={isAccepting || corrections.length === 0}
          >
            {isAccepting ? 'Accepting...' : 'Accept Corrections'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
