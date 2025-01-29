import React from 'react';

const StatusDisplay = ({ status, message }) => {
  return (
    <div>
      {status === 'loading' && <p>Processing...</p>}
      {status === 'success' && <p style={{ color: 'green' }}>{message}</p>}
      {status === 'error' && <p style={{ color: 'red' }}>{message}</p>}
    </div>
  );
};

export default StatusDisplay;
