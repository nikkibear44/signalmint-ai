import { useState } from "react";

function App() {

  const [query, setQuery] = useState("");
  const [result, setResult] = useState("Your AI report will appear here...");
  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <h1>🚀 SignalMint AI</h1>
      <p>AI-Powered Crypto Intelligence</p>

      <hr />

      <input
  type="text"
  placeholder="Enter token (e.g. SOL)"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  style={{
    width: "300px",
    padding: "10px",
    marginRight: "10px",
  }}
/>

  <button
  onClick={async () => {

    setResult("Analyzing...");

    try {

      const response = await fetch(
        "https://signalmint-ai.onrender.com/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
          }),
        }
      );

      const data = await response.json();

      setResult(data.report);

    } catch (error) {

      setResult("Something went wrong.");

    }

  }}
  style={{
    padding: "10px 20px",
    cursor: "pointer",
  }}
>
  Analyze
</button>

      <hr />

      <h2>Analysis Result</h2>

      <div
        style={{
          border: "1px solid #ccc",
          padding: "20px",
          borderRadius: "8px",
          minHeight: "250px",
        }}
      >
  <pre
  style={{
    whiteSpace: "pre-wrap",
    textAlign: "left",
  }}
>
  {result}
</pre>
      </div>
    </div>
  );
}

export default App;