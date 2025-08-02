import React from 'react';

const HistoryCard = ({ entry }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row gap-4">
      <img src={entry.imageUrl} alt="Analyzed" className="w-full sm:w-40 h-auto rounded-md border" />
      <div>
        <p><strong>Command:</strong> {entry.command}</p>
        <p><strong>Result:</strong> {entry.result}</p>
        <p className="text-sm text-gray-500 mt-2">
          {new Date(entry.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default HistoryCard;