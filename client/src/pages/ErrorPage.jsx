import { Link } from 'react-router';

const ErrorPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <h1 className="text-9xl font-extrabold text-gray-200">404</h1>
      <p className="text-2xl font-bold text-gray-800 mt-4">Page Not Found</p>
      <p className="text-gray-500 mt-2 mb-8">
        The book you are looking for seems to have gone missing from our
        shelves.
      </p>
      <Link
        to="/"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition shadow-lg"
      >
        Back to Library
      </Link>
    </div>
  );
};

export default ErrorPage;
