import { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import api from '../api/axiosInstance';
import { AuthContext } from '../contexts/AuthContext';

const Home = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const [borrowedBookIds, setBorrowedBookIds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await api.get('/books');
        setBooks(response.data.books || response.data);
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  useEffect(() => {
    if (user?.role === 'member') {
      const fetchBorrowedIds = async () => {
        try {
          const response = await api.get('/borrows');
          const activeBorrows = response.data
            .filter((record) => record.status === 'borrowed')
            .map((record) => record.bookId);

          setBorrowedBookIds(activeBorrows);
        } catch (err) {
          console.error(err);
        }
      };
      fetchBorrowedIds();
    }
  }, [user]);

  const handleBorrow = async (bookId) => {
    if (!confirm('Are you sure you want to borrow this book?')) return;

    try {
      await api.post(`/borrows/${bookId}`);
      alert('Book borrowed successfully!');

      setBooks((prevBooks) =>
        prevBooks.map((book) =>
          book._id === bookId ? { ...book, stock: book.stock - 1 } : book,
        ),
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to borrow book.');
    }
  };

  const handleDelete = async (bookId) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      await api.delete(`/books/${bookId}`);

      setBooks((prevBooks) => prevBooks.filter((book) => book._id !== bookId));

      alert('Book deleted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete book.');
    }
  };

  const handleEdit = (book) => {
    navigate(`/books/edit/${book._id}`);
  };

  if (loading)
    return <div className="text-center mt-10">Loading Library...</div>;

  if (books.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1>No books :(</h1>
      </div>
    );

  return (
    <div className="w-full mx-auto p-4">
      <h1 className="w-fit mx-auto text-3xl font-bold mb-6 text-gray-800">
        Library Collection
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {books.map((book) => {
          const isAlreadyBorrowed = borrowedBookIds.includes(book._id);
          return (
            <div
              key={book._id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col h-full group"
            >
              {/* 1. CLICKABLE IMAGE AREA (Goes to Details) */}
              <Link
                to={`/books/${book._id}`}
                className="relative h-64 overflow-hidden block"
              >
                <img
                  src={book.image || 'https://picsum.photos/300/400'}
                  alt={book.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>

                {/* Genre Badge */}
                <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-2 py-1 rounded shadow-sm">
                  {book.genre || 'General'}
                </span>
              </Link>

              {/* 2. CARD CONTENT */}
              <div className="p-5 flex flex-col grow">
                <Link
                  to={`/books/${book._id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  <h2
                    className="text-xl font-bold text-gray-800 line-clamp-1"
                    title={book.title}
                  >
                    {book.title}
                  </h2>
                </Link>
                <p className="text-sm text-gray-500 mb-3">by {book.author}</p>

                {/* Stock Indicator */}
                <div className="mt-auto flex items-center justify-between text-sm mb-4">
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${book.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {book.stock > 0 ? `${book.stock} in stock` : 'Out of Stock'}
                  </span>
                </div>

                {/* 3. ACTION BUTTONS */}
                <div className="grid gap-2">
                  {/* MEMBER: Borrow */}
                  {user?.role === 'member' && (
                    <button
                      onClick={() => handleBorrow(book._id)}
                      disabled={book.stock === 0 || isAlreadyBorrowed} // Disable if borrowed
                      className={`w-full py-2 rounded-lg font-bold text-sm transition-all transform active:scale-95
          ${
            isAlreadyBorrowed ?
              'bg-orange-400 text-white cursor-not-allowed' // Style for "Already Borrowed"
            : book.stock > 0 ?
              'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
                    >
                      {isAlreadyBorrowed ?
                        'Already Borrowed'
                      : book.stock > 0 ?
                        'Quick Borrow'
                      : 'Unavailable'}
                    </button>
                  )}

                  {/* LIBRARIAN: Edit / Delete */}
                  {(user?.role === 'librarian' || user?.role === 'owner') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(book)}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-semibold text-sm transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(book._id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold text-sm transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  {/* ALL USERS: View Details Button */}
                  <Link
                    to={`/books/${book._id}`}
                    className="w-full text-center border border-gray-300 hover:bg-gray-50 text-gray-600 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
