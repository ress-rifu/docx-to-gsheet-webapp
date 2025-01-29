import React from 'react';

const FileUpload = ({ onFileChange }) => {
  return (
    <div>
      <label>Word Document:</label>
      <input type="file" accept=".docx" onChange={(e) => onFileChange(e, 'docx')} />
      
      <label>Credentials JSON:</label>
      <input type="file" accept=".json" onChange={(e) => onFileChange(e, 'json')} />
    </div>
  );
};

export default FileUpload;
