export async function fetchErrors(text) {
  const response = await fetch("http://localhost:5000/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await response.json();
  return data;
}

export function getCorrectionSegments(text, errors) {
  // Create segments by splitting at error locations
  let segments = [];
  let textIndex = 0;
  let errorIndex = 0;

  while (textIndex < text.length && errorIndex < errors.length) {
    const error = errors[errorIndex].error;
    const errorStart = text.indexOf(error, textIndex);

    if (errorStart === -1) {
      break; // Skip the rest if the error isn't found
    }

    // Push normal text before the error
    segments.push({
      text: text.slice(textIndex, errorStart),
      type: "normal",
    });

    // Push the error text
    segments.push({
      text: text.slice(errorStart, errorStart + error.length),
      type: "error",
    });

    textIndex = errorStart + error.length;
    errorIndex++;
  }

  // Push remaining normal text
  if (textIndex < text.length) {
    segments.push({
      text: text.slice(textIndex),
      type: "normal",
    });
  }

  return segments;
}
