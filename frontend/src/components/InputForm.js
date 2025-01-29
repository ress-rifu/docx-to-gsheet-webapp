import React from 'react';

const InputForm = ({ sheetName, setSheetName }) => {
  return (
    <div>
      <label>Google Sheet Name:</label>
      <input 
        type="text" 
        value={sheetName} 
        onChange={(e) => setSheetName(e.target.value)} 
        placeholder="Enter Google Sheet Name" 
      />
    </div>
  );
};

export default InputForm;
