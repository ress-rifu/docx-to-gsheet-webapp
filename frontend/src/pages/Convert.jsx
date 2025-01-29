import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import InputForm from '../components/InputForm';
import StatusDisplay from '../components/StatusDisplay';
import axios from 'axios';

const Convert = () => {
  const [files, setFiles] = useState({ docx: null, json: null });
  const [sheetName, setSheetName] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  const handleFileChange = (e, type) => {
    setFiles({ ...files, [type]: e.target.files[0] });
  };

  const handleSubmit = async () => {
    if (!files.docx || !files.json || !sheetName) {
      setStatus('error');
      setMessage('Please provide all required inputs.');
      return;
    }

    const formData = new FormData();
    formData.append('docx', files.docx);
    formData.append('json', files.json);
    formData.append('sheetName', sheetName);

    try {
      setStatus('loading');
      const response = await axios.post('http://localhost:5000/api/convert', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus('success');
      setMessage(`Success! Access your sheet here: ${response.data.sheetUrl}`);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'An error occurred.');
    }
  };

  return (
    <div>
      <FileUpload onFileChange={handleFileChange} />
      <InputForm sheetName={sheetName} setSheetName={setSheetName} />
      <button onClick={handleSubmit}>Convert & Upload</button>
      <StatusDisplay status={status} message={message} />
    </div>
  );
};

export default Convert;
