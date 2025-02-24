// src/components/ai/DataUpload.js
import React, { useState } from "react";
import ExcelUploaderForAI from "./ExcelUploaderForAI.js";
import "../../styles/ai/DataUpload.css";

const DataUpload = ({ onDataUpload }) => {
  const [parsedResult, setParsedResult] = useState(null);
  const [description, setDescription] = useState("");

  const handleDataParsed = (result) => {
    setParsedResult(result);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parsedResult && description.trim() !== "") {
      onDataUpload(parsedResult, description);
    } else {
      alert("Please upload a file and provide a summary description.");
    }
  };

  return (
    <div className="data-upload">
      <h3>Upload Customer Data for AI Analysis</h3>
      <ExcelUploaderForAI onDataParsed={handleDataParsed} />
      {parsedResult && (
        <div className="data-upload-description">
          <textarea
            placeholder="Provide a summary description of the uploaded data..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
          <button onClick={handleSubmit}>Submit Data</button>
        </div>
      )}
    </div>
  );
};

export default DataUpload;
