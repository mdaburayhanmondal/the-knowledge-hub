import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter, Route, Routes } from 'react-router';
import PrivateRoute from '../src/routes/PrivateRoute.jsx';
import LibrarianRoute from './routes/LibrarianRoute.jsx';
import Home from '../src/pages/Home.jsx';
import BookDetails from '../src/pages/BookDetails.jsx';
import Login from '../src/pages/Auth/Login.jsx';
import Register from '../src/pages/Auth/Register.jsx';
import Profile from '../src/pages/Member/Profile.jsx';
import MyBorrows from '../src/pages/Member/MyBorrows.jsx';
import LibrarianDesk from '../src/pages/Librarian/LibrarianDesk.jsx';
import AddBook from '../src/pages/Librarian/AddBook.jsx';
import EditBook from '../src/pages/Librarian/EditBook.jsx';
import ErrorPage from './pages/ErrorPage.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route element={<App />}>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<Home />} />
        <Route path="/books/:id" element={<BookDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PROTECTED ROUTES (Members & Librarians) */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-borrows"
          element={
            <PrivateRoute>
              <MyBorrows />
            </PrivateRoute>
          }
        />

        {/* LIBRARIAN ONLY ROUTES */}
        <Route
          path="/librarian-desk"
          element={
            <LibrarianRoute>
              <LibrarianDesk />
            </LibrarianRoute>
          }
        />
        <Route
          path="/books/add"
          element={
            <LibrarianRoute>
              <AddBook />
            </LibrarianRoute>
          }
        />
        <Route
          path="/books/edit/:id"
          element={
            <LibrarianRoute>
              <EditBook />
            </LibrarianRoute>
          }
        />

        {/* CATCH ALL 404 */}
        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  </BrowserRouter>,
);
