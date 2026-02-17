import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router';
import { AuthContext } from '../contexts/AuthContext';

const LibrarianRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <div className="text-center p-10">Loading auth...</div>;
  }

  if (user && (user.role === 'librarian' || user.role === 'owner')) {
    return children;
  }

  // If they are logged in but not a librarian, kick them to Home
  return <Navigate to="/" state={{ from: location }} replace />;
};

export default LibrarianRoute;
