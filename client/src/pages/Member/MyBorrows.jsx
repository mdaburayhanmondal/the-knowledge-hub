import { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';

const MyBorrows = () => {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBorrows = async () => {
      try {
        const response = await api.get('/borrows');
        setBorrows(response.data);
      } catch (error) {
        console.error('Failed to fetch borrow history', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBorrows();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getDueDate = (borrowDate) => {
    const date = new Date(borrowDate);
    date.setDate(date.getDate() + 14);
    return date.toLocaleDateString();
  };

  const handleRenew = async (borrowId) => {
    if (!confirm('Do you want to renew this book for 14 more days?')) return;

    try {
      const response = await api.patch(`/borrows/renew/${borrowId}`);
      alert(response.data.message);

      setBorrows((prev) =>
        prev.map((item) =>
          item._id === borrowId ?
            {
              ...item,
              borrowDate: new Date().toISOString(),
              isRenewed: true,
            }
          : item,
        ),
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Renewal failed');
    }
  };

  const canRenew = (borrowDate) => {
    const today = new Date();
    const borrowed = new Date(borrowDate);
    const diffTime = Math.abs(today - borrowed);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Allow renew only if 11 days have passed (3 days left) OR it is overdue
    return diffDays >= 11;
  };

  if (loading)
    return <div className="p-10 text-center">Loading History...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        My Borrow History
      </h1>

      {borrows.length === 0 ?
        <p className="text-gray-500">You haven't borrowed any books yet.</p>
      : <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="w-full text-left border-collapse bg-white">
            <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
              <tr>
                <th className="p-4 border-b">Book</th>
                <th className="p-4 border-b">Borrowed</th>
                <th className="p-4 border-b text-red-600">Due Date</th>
                <th className="p-4 border-b">Status</th>
                <th className="p-4 border-b">Fine</th>
                <th className="p-4 border-b">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {borrows.map((item) => (
                <tr
                  key={item._id}
                  className={`border-b ${item.status === 'returned' ? 'bg-gray-50 opacity-60' : 'bg-white'}`}
                >
                  <td className="p-4">
                    <div className="font-bold text-gray-800">
                      {item.bookTitle}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.bookAuthor}
                    </div>
                  </td>
                  <td className="p-4">{formatDate(item.borrowDate)}</td>
                  <td className="p-4 font-medium text-red-500">
                    {getDueDate(item.borrowDate)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold uppercase
                      ${item.status === 'returned' ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}
                    >
                      {item.status}
                    </span>
                    {/* Show if it was renewed */}
                    {item.isRenewed && item.status === 'borrowed' && (
                      <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-1 rounded">
                        Renewed
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-mono">
                    {item.fine > 0 ?
                      <span className="text-red-600 font-bold">
                        ${item.fine}
                      </span>
                    : '-'}
                  </td>

                  {/* ACTION COLUMN */}
                  <td className="p-4">
                    {item.status === 'borrowed' ?
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleRenew(item._id)}
                          // 1. Disable if it's too early to renew
                          disabled={!canRenew(item.borrowDate)}
                          className={`px-4 py-2 rounded text-sm shadow-md transition
          ${
            canRenew(item.borrowDate) ?
              'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
                        >
                          Renew
                        </button>

                        {/* 2. Show a hint why it's disabled */}
                        {!canRenew(item.borrowDate) && (
                          <span className="text-[10px] text-gray-400">
                            Too early to renew
                          </span>
                        )}
                      </div>
                    : <span className="text-xs text-gray-500 italic block">
                        Returned on <br />
                        {formatDate(item.returnDate)}
                      </span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
};

export default MyBorrows;
