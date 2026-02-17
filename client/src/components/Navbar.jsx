import { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { AuthContext } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  // Helper for active link styling
  const getLinkClass = ({ isActive }) =>
    isActive ?
      'text-blue-600 font-bold border-b-2 border-blue-600 pb-1'
    : 'text-gray-600 hover:text-blue-500 font-medium transition-colors';

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* LOGO */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                The Knowledge Hub
              </span>
            </Link>
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/books" className={getLinkClass}>
              Library
            </NavLink>

            {/* MEMBER LINKS */}
            {user?.role === 'member' && (
              <NavLink to="/my-borrows" className={getLinkClass}>
                My Borrows
              </NavLink>
            )}

            {/* LIBRARIAN LINKS */}
            {(user?.role === 'librarian' || user?.role === 'owner') && (
              <>
                <NavLink to="/librarian-desk" className={getLinkClass}>
                  Librarian Desk
                </NavLink>
                <NavLink to="/books/add" className={getLinkClass}>
                  Add Book
                </NavLink>
              </>
            )}
          </div>

          {/* AUTH BUTTONS (Right Side) */}
          <div className="hidden md:flex items-center gap-4">
            {
              !user ?
                // GUEST VIEW
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-blue-600 font-bold"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition shadow-md"
                  >
                    Join Now
                  </Link>
                </>
                // LOGGED IN VIEW
              : <div className="flex items-center gap-4">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 max-w-25 truncate">
                      {user.name}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1 rounded text-sm font-bold transition cursor-pointer"
                  >
                    Logout
                  </button>
                </div>

            }
          </div>

          {/* MOBILE MENU BUTTON */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ?
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                : <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DROPDOWN */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink
              to="/books"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`
              }
            >
              Library
            </NavLink>

            {user?.role === 'member' && (
              <NavLink
                to="/my-borrows"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`
                }
              >
                My Books
              </NavLink>
            )}

            {(user?.role === 'librarian' || user?.role === 'owner') && (
              <>
                <NavLink
                  to="/librarian-desk"
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  Librarian Desk
                </NavLink>
                <NavLink
                  to="/books/add"
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  Add Book
                </NavLink>
              </>
            )}

            {/* Mobile Auth Actions */}
            <div className="border-t border-gray-200 mt-4 pt-4">
              {!user ?
                <div className="flex flex-col gap-2 px-3">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center text-gray-600 font-bold border border-gray-300 py-2 rounded-lg"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center bg-blue-600 text-white font-bold py-2 rounded-lg"
                  >
                    Register
                  </Link>
                </div>
              : <div className="px-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-700">
                      {user.name}
                    </span>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-left text-gray-600 hover:bg-gray-50 py-2"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left text-red-600 font-bold py-2 cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
