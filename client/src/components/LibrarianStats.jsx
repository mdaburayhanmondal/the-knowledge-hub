import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

const LibrarianStats = () => {
  const [stats, setStats] = useState(null);

  const [showSummary, setShowSummary] = useState(true);
  const [showGenres, setShowGenres] = useState(false); 

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Stats fetch failed', err);
      }
    };
    fetchStats();
  }, []);

  if (!stats)
    return (
      <div className="p-8 text-center text-gray-500 animate-pulse">
        Loading Dashboard Stats...
      </div>
    );

  const { summary, genres } = stats;

  return (
    <div className="w-full space-y-6">
      {/* 1. SUMMARY SECTION (Collapsible) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            📊 Library Overview
          </h2>
          <span
            className={`transform transition-transform duration-300 ${showSummary ? 'rotate-180' : ''}`}
          >
            ▼
          </span>
        </button>

        {showSummary && (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-fadeIn">
            <StatCard
              title="Total Books"
              value={summary.totalBooks}
              icon="📚"
              color="blue"
            />
            <StatCard
              title="Active Members"
              value={summary.totalMembers}
              icon="👥"
              color="green"
            />
            <StatCard
              title="Active Loans"
              value={summary.totalActiveBorrows}
              icon="🔄"
              color="purple"
            />
            <StatCard
              title="Pending Fines"
              value={`${summary.totalFinesPending} TK`}
              icon="💰"
              color="red"
            />
            <StatCard
              title="Avg Fine"
              value={`${Number(summary.averageFine).toFixed(0)} TK`}
              icon="⚖️"
              color="orange"
            />
          </div>
        )}
      </div>

      {/* 2. GENRE DISTRIBUTION SECTION (Collapsible) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowGenres(!showGenres)}
          className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            🏷️ Book Distribution by Genre
          </h2>
          <span
            className={`transform transition-transform duration-300 ${showGenres ? 'rotate-180' : ''}`}
          >
            ▼
          </span>
        </button>

        {showGenres && (
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-fadeIn">
              {genres?.map((item, index) => (
                <div
                  key={index}
                  className="bg-indigo-50 p-3 rounded-lg text-center hover:bg-indigo-100 transition"
                >
                  <p
                    className="text-indigo-900 font-semibold text-sm truncate"
                    title={item.genre}
                  >
                    {item.genre || 'Uncategorized'}
                  </p>
                  <p className="text-2xl font-bold text-indigo-700 mt-1">
                    {item.totalCount}
                  </p>
                </div>
              ))}
            </div>
            {(!genres || genres.length === 0) && (
              <p className="text-gray-400 text-center py-4">
                No genre data available.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    red: 'text-rose-600 bg-rose-50 border-rose-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`p-4 rounded-xl border ${theme} flex flex-col justify-between h-24 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex justify-between items-start">
        <p className="text-xs font-bold uppercase tracking-wider opacity-80">
          {title}
        </p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
};

export default LibrarianStats;
