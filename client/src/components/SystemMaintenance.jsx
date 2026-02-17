import { useState } from 'react';
import api from '../api/axiosInstance';

const SystemMaintenance = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await api.patch('/librarian/sync-fines');
      alert(`Sync Complete! Updated ${response.data.message}`);
    } catch (err) {
      alert(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="w-full bg-white p-6 rounded shadow border-t-4 border-indigo-500 mt-6">
      <h2 className="text-xl font-bold mb-2">Database Maintenance</h2>
      <p className="text-gray-600 text-sm mb-4">
        Run this to update{' '}
        <big className="font-bold text-red-700 text-sm"> stored fines</big> in
        the database.
      </p>
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="bg-indigo-600 text-white px-6 py-2 rounded font-bold disabled:bg-gray-400"
      >
        {isSyncing ? 'Syncing...' : '🔄 Sync Database Fines'}
      </button>
    </div>
  );
};

export default SystemMaintenance;
