// src/components/ExcelUploader.js
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";

const ExcelUploader = ({ onDataParsed }) => {
  const [fileName, setFileName] = useState("");

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          // Convert the sheet to JSON (array of arrays)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          console.log("Parsed Excel data:", jsonData);
          if (onDataParsed) {
            onDataParsed(jsonData);
          }
        };
        reader.onerror = (error) => {
          console.error("Error reading file:", error);
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
      </div>
    </div>
  );
};

export default ExcelUploader;
