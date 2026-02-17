import { Link } from 'react-router';
import { FaGithub, FaLinkedin, FaGlobe, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              📚 The Knowledge Hub
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              A robust Library Management System designed to streamline book
              tracking, borrowing cycles, and automated fine calculations. Built
              with precision and logic at its core.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-blue-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/books"
                  className="hover:text-blue-400 transition-colors"
                >
                  All Books
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="hover:text-blue-400 transition-colors"
                >
                  Login / Register
                </Link>
              </li>
              {/* Optional: Add a link to the admin dashboard if you want */}
            </ul>
          </div>

          {/* Developer / Hiring CTA */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Meet the Developer
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Hi, I'm{' '}
              <span className="text-white font-bold">
                Md. Abu Rayhan Mondal
              </span>
              . I built this full-stack application to demonstrate advanced
              backend logic. Open to collaboration!
            </p>
            <div className="flex space-x-4">
              <a
                href="https://rayhanfsdev.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 text-2xl transition-transform transform hover:scale-110"
                title="Portfolio"
              >
                <FaGlobe />
              </a>
              <a
                href="https://www.linkedin.com/in/md-abu-rayhan-mondal/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-500 text-2xl transition-transform transform hover:scale-110"
                title="LinkedIn"
              >
                <FaLinkedin />
              </a>
              <a
                href="https://github.com/mdaburayhanmondal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-2xl transition-transform transform hover:scale-110"
                title="GitHub"
              >
                <FaGithub />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} The Knowledge Hub. All rights
            reserved.
          </p>
          <p className="mt-2">
            Designed & Developed by{' '}
            <a
              href="https://rayhanfsdev.netlify.app"
              className="text-blue-400 hover:underline"
            >
              Rayhan
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
