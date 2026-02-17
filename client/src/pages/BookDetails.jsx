import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AuthContext } from '../contexts/AuthContext';
import api from '../api/axiosInstance';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBorrowed, setIsBorrowed] = useState(false);

  // Fetch Book Data
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await api.get(`/books/${id}`);
        setBook(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  useEffect(() => {
    if (user?.role === 'member') {
      const checkBorrowStatus = async () => {
        try {
          const response = await api.get('/borrows');
          const hasBorrowed = response.data.some(
            (record) => record.bookId === id && record.status === 'borrowed',
          );
          setIsBorrowed(hasBorrowed);
        } catch (err) {
          console.error(err);
        }
      };
      checkBorrowStatus();
    }
  }, [id, user]);

  const handleBorrow = async () => {
    if (!confirm(`Confirm borrowing "${book.title}"?`)) return;
    try {
      await api.post(`/borrows/${book._id}`);
      alert('Book borrowed successfully!');
      navigate('/my-borrows');
    } catch (err) {
      alert(err.response?.data?.message || 'Borrow failed');
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center animate-pulse">
        Loading Book Details...
      </div>
    );
  if (error)
    return (
      <div className="p-10 text-center text-red-500 font-bold">{error}</div>
    );
  if (!book) return <div className="p-10 text-center">Book not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 mt-10">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-gray-500 hover:text-blue-600 flex items-center gap-2 transition"
      >
        ← Back to Library
      </button>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* LEFT: Image Section */}
        <div className="md:w-1/3 h-96 md:h-auto bg-gray-100 relative group">
          <img
            src={book.image || 'https://picsum.photos/400/600'}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Stock Badge Overlay */}
          <div
            className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-md
            ${book.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {book.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </div>
        </div>

        {/* RIGHT: Details Section */}
        <div className="md:w-2/3 p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2 leading-tight">
                  {book.title}
                </h1>
                <p className="text-xl text-gray-600 font-medium mb-4">
                  by <span className="text-blue-600">{book.author}</span>
                </p>
              </div>
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-sm font-semibold">
                {book.genre}
              </span>
            </div>

            <div className="h-1 w-20 bg-yellow-400 rounded mb-6"></div>

            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Description
            </h3>
            <p className="text-gray-600 leading-relaxed mb-8">
              {book.description || 'No description available for this book.'}
            </p>

            {/* Additional Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-bold">
                  Stock Available
                </p>
                <p className="text-2xl font-bold text-gray-800">{book.stock}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-bold">
                  Publication Year
                </p>
                {/* Assuming you might add year later, or use dummy data */}
                <p className="text-2xl font-bold text-gray-800">20XX</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-6 flex gap-4">
            {user?.role === 'member' && (
              <button
                onClick={handleBorrow}
                disabled={book.stock === 0 || isBorrowed} // Disable if borrowed
                className={`flex-1 py-3 px-6 rounded-lg font-bold text-lg shadow-md transition transform hover:-translate-y-1
          ${
            isBorrowed ?
              'bg-orange-500 text-white hover:bg-orange-600 cursor-not-allowed'
            : book.stock > 0 ?
              'bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
              >
                {isBorrowed ?
                  'You Have This Book'
                : book.stock > 0 ?
                  'Borrow This Book'
                : 'Currently Unavailable'}
              </button>
            )}

            {/* Librarian Edit Shortcut */}
            {(user?.role === 'librarian' || user?.role === 'owner') && (
              <button
                onClick={() => navigate(`/books/edit/${book._id}`)} // Assumes you have an edit route
                className="flex-1 bg-gray-800 text-white py-3 px-6 rounded-lg font-bold hover:bg-gray-900 transition cursor-pointer"
              >
                Edit Book
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
