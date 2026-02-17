import { useState } from 'react';
import api from '../../api/axiosInstance';

const ReturnBook = () => {
  const [email, setEmail] = useState('');
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const hasActiveFines = userData?.activeBorrows?.some(
    (b) => b.fine > 0 && (!b.status || b.status === 'borrowed'),
  );

  const handleSearch = async (e) => {
    e.preventDefault();
    const searchEmail = email.trim().toLowerCase();

    setError('');
    setMsg('');
    setUserData(null);

    try {
      const response = await api.get(`/librarian/lookup?email=${searchEmail}`);
      setUserData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'User not found');
    }
  };

  const handleReturn = async (borrowId) => {
    if (!confirm('Confirm: Book returned to library?')) return;
    try {
      await api.patch(`/borrows/return/${borrowId}`);
      setMsg('Book marked as returned.');
      handleSearch({ preventDefault: () => {} });
    } catch (err) {
      alert('Return failed: ' + err.response?.data?.message);
    }
  };

  const handlePayFines = async () => {
    if (!userData || !userData.userId) return;

    const confirmMessage =
      hasActiveFines ?
        `Collect $${userData.totalFine}? \n\n⚠️ WARNING: This will RENEW all active books for 14 more days.`
      : `Collect $${userData.totalFine} to clear past debts?`;

    if (!confirm(confirmMessage)) return;

    try {
      await api.patch(`/pay-fines/${userData.userId}`);
      setMsg(`Payment of $${userData.totalFine} accepted!`);
      // Refresh data to show 0 fines
      handleSearch({ preventDefault: () => {} });
    } catch (err) {
      alert('Payment failed: ' + err.response?.data?.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* SEARCH BAR */}
      <form
        onSubmit={handleSearch}
        className="mb-8 flex gap-4 bg-white p-4 rounded shadow-sm"
      >
        <input
          type="email"
          placeholder="Member Email (e.g. member@test.com)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded w-full flex-1 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold transition"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="text-red-500 mb-4 bg-red-50 p-3 rounded border border-red-200">
          {error}
        </div>
      )}
      {msg && (
        <div className="text-green-600 mb-4 bg-green-50 p-3 rounded border border-green-200 font-bold">
          {msg}
        </div>
      )}

      {/* USER DASHBOARD */}
      {userData && (
        <div className="space-y-6">
          {/* USER INFO CARD */}
          <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {userData.name}
              </h2>
              <p className="text-gray-500">{userData.email}</p>
              <p className="mt-2 text-sm text-gray-600 font-semibold">
                Active Loans: {userData.activeBorrows.length}
              </p>
            </div>

            <div className="text-right">
              <p className="text-gray-600 text-sm">Total Unpaid Fines</p>
              <p className="text-3xl font-mono font-bold text-red-600">
                ${userData.totalFine}
              </p>

              {/* DYNAMIC PAY BUTTON */}
              {userData.totalFine > 0 && (
                <button
                  onClick={handlePayFines}
                  className={`mt-2 text-white text-sm px-4 py-2 rounded shadow transition font-bold flex items-center gap-2 ml-auto
                    ${
                      hasActiveFines ?
                        'bg-orange-600 hover:bg-orange-700'
                      : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                  {hasActiveFines ?
                    <>
                      <span>🔄</span> Pay & Renew Active
                    </>
                  : <>
                      <span>💰</span> Settle Past Debts
                    </>
                  }
                </button>
              )}
            </div>
          </div>

          {/* ACTIVE LOANS TABLE */}
          {userData.activeBorrows.length > 0 ?
            <div className="bg-white shadow rounded overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                  <tr>
                    <th className="p-4">Book Title</th>
                    <th className="p-4">Borrowed On</th>
                    <th className="p-4">Current Fine</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  {userData.activeBorrows.map((book) => (
                    <tr
                      key={book._id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="p-4 font-bold text-gray-800">
                        {book.bookTitle}
                      </td>
                      <td className="p-4 text-sm">
                        {new Date(book.borrowDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-mono text-red-500 font-bold">
                        {book.fine > 0 ? `$${book.fine}` : '-'}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleReturn(book._id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm shadow transition"
                        >
                          Confirm Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          : <div className="bg-gray-50 rounded p-10 text-center border border-gray-200">
              <p className="text-gray-500">
                No active books found for this user.
              </p>
            </div>
          }
        </div>
      )}
    </div>
  );
};

export default ReturnBook;
