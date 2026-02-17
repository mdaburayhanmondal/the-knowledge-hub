import { Outlet } from 'react-router';
import './App.css';
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <>
      <AuthProvider>
        <header className="min-h-fit">
          <Navbar />
        </header>
        <main className="min-h-[90vh]">
          <Outlet />
        </main>
        <footer className="min-h-fit">Footer</footer>
      </AuthProvider>
    </>
  );
}

export default App;
