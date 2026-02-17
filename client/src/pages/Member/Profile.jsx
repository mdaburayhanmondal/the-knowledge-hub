import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../api/axiosInstance';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMemberStats = async () => {
      const id = user?.userId || user?._id;
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get(`/member-stats/${id}`);
        setStats(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchMemberStats();
  }, [user]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-red-50 rounded-xl border border-red-100 text-center">
        <p className="text-red-600 font-medium">
          Unable to load profile insights. Please try again later.
        </p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Profile Header */}
      <div className="relative bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        {/* Cover Image/Gradient */}
        <div className="h-40 bg-linear-to-r from-indigo-600 via-blue-500 to-cyan-400"></div>

        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row md:items-end -mt-12 gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="h-32 w-32 rounded-2xl bg-white p-1 shadow-xl">
                <div className="h-full w-full rounded-xl bg-slate-100 flex items-center justify-center text-4xl font-bold text-indigo-600 border border-slate-50">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {user?.name}
                </h1>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest rounded-lg border border-indigo-100">
                  {user?.role}
                </span>
              </div>
              <p className="text-slate-500 font-medium mt-1">{user?.email}</p>
            </div>

            {/* Decorative Status */}
            <div className="hidden md:block pb-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Account Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section Label */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-lg font-bold text-slate-800 whitespace-nowrap">
          Library Activity
        </h2>
        <div className="h-px w-full bg-slate-200"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Borrowed"
          value={stats?.totalBooksBorrowed || 0}
          icon="📚"
          color="blue"
        />
        <StatCard
          label="Active Loans"
          value={stats?.activeBorrows || 0}
          icon="📖"
          color="indigo"
        />
        <StatCard
          label="Renewals"
          value={stats?.totalRenewals || 0}
          icon="🔄"
          color="purple"
        />
        <StatCard
          label="Unpaid Fine"
          value={`$${stats?.unpaidFines || 0}`}
          icon="💰"
          color="amber"
          highlight={stats?.unpaidFines > 0}
        />
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, highlight }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div
        className={`w-12 h-12 rounded-xl ${colorMap[color]} flex items-center justify-center text-2xl mb-4`}
      >
        {icon}
      </div>
      <div>
        <p
          className={`text-3xl font-black tracking-tight ${highlight ? 'text-red-600' : 'text-slate-800'}`}
        >
          {value}
        </p>
        <p className="text-slate-400 text-xs font-bold uppercase mt-1 tracking-wider">
          {label}
        </p>
      </div>
    </div>
  );
};

export default Profile;
