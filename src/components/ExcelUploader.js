import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";

const ExcelUploader = ({ onDataParsed }) => {
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback(
    (acceptedFiles) => {
      setError("");
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setFileName(file.name);
        setLoading(true);
        setProgress(0);

        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setProgress(percent);
          }
        };
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (onDataParsed) {
              onDataParsed(jsonData);
            }
          } catch (err) {
            console.error("Error parsing Excel data:", err);
            setError("Error parsing Excel file. Please check the file format.");
          }
          setLoading(false);
        };
        reader.onerror = (err) => {
          console.error("Error reading file:", err);
          setError("Error reading file. Please try again.");
          setLoading(false);
        };
        reader.readAsArrayBuffer(file);
      }
    },
    [onDataParsed]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ".xlsx, .xls",
  });

  return (
    <div className="excel-uploader-container">
      <h3>Excel Uploader</h3>
      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #888",
          padding: "20px",
          textAlign: "center",
          borderRadius: "8px",
          backgroundColor: isDragActive ? "#f0f0f0" : "#fff",
          minHeight: "150px",
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the Excel file here...</p>
        ) : (
          <p>Drag and drop an Excel file here, or click to select one</p>
        )}
        {fileName && (
          <p>
            <strong>Selected File:</strong> {fileName}
          </p>
        )}
        {loading && (
          <p>
            Uploading: {progress}% {progress === 100 && "Processing..."}
          </p>
        )}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
};

export default ExcelUploader;
