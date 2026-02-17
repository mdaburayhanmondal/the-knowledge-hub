import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

const OverdueManager = () => {
  const [overdue, setOverdue] = useState([]);

  const fetchOverdue = async () => {
    const response = await api.get('/borrows/overdue');
    setOverdue(response.data);
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  const sendReminder = async (id) => {
    try {
      await api.post(`/borrows/remind/${id}`);
      alert('Email reminder sent successfully!');
    } catch (err) {
      alert(err.message || 'Failed to send reminder');
    }
  };

  if (overdue.length === 0)
    return (
      <h2 className="text-xl font-bold mb-4 text-red-600">
        ✅ No Overdue Books
      </h2>
    );

  return (
    <div className="w-full bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-red-600">⚠️ Overdue Books</h2>
      <table className="w-full text-left">
        <thead className="bg-gray-50 uppercase text-xs">
          <tr>
            <th className="p-2">Book</th>
            <th className="p-2">Member</th>
            <th className="p-2">Days Out</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {overdue.map((item) => (
            <tr key={item._id} className="border-b">
              <td className="p-2 font-semibold">{item.bookTitle}</td>
              <td className="p-2">
                {item.userName} ({item.userEmail})
              </td>
              <td className="p-2 text-red-500 font-bold">
                {item.totalDaysOut} days
              </td>
              <td className="p-2">
                <button
                  onClick={() => sendReminder(item._id)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                >
                  Send Email
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OverdueManager;
