import React from 'react';

const UVHologramViewer = ({ hologramPath }) => {
  return (
    <img
      src={hologramPath}
      alt="Security Seal"
      className="w-48 h-48"
    />
  );
};

export default UVHologramViewer;