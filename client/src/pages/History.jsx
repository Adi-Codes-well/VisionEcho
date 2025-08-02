import React, { useState } from 'react';
import HistoryCard from '../components/HistoryCard';

const History = () => {
  const [search, setSearch] = useState('');

  const filtered = mockHistory.filter((entry) =>
    entry.command.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Analysis History</h1>

      <input
        type="text"
        placeholder="Search by command..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 mb-4 border rounded-md"
      />

      <div className="flex flex-col gap-4">
        {filtered.length > 0 ? (
          filtered.map((entry) => <HistoryCard key={entry.id} entry={entry} />)
        ) : (
          <p>No results found.</p>
        )}
      </div>
    </div>
  );
};

export default History;
