import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../api/axiosInstance';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // State for design/interaction
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // State for data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/login', formData);
      login(response.data.user, response.data.token);
      navigate(location?.state?.from ? location.state.from : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-row gap-2 min-h-screen justify-center items-center mx-auto">
        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce"></div>
        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:-.3s]"></div>
        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:-.5s]"></div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto min-h-screen flex flex-col items-center justify-center gap-y-6 p-4">
      <h1 className="text-3xl text-yellow-900 font-extrabold italic underline-0 hover:underline hover:underline-offset-8 decoration-4 decoration-wavy transition-all duration-300 ease-in cursor-default">
        Login
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 w-full max-w-2xl text-center">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl mx-auto flex flex-col items-start justify-center gap-y-6"
      >
        {/* Email Field */}
        <div className="w-full flex flex-col gap-y-2">
          <label htmlFor="email" className="text-lg italic text-yellow-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            placeholder={isEmailFocused ? '' : 'Enter email...'}
            className="w-full bg-amber-50 outline outline-yellow-400 rounded-lg px-2 py-1"
            required
            onFocus={() => setIsEmailFocused(true)}
            onBlur={() => setIsEmailFocused(false)}
            onChange={handleChange}
          />
        </div>

        {/* Password Field */}
        <div className="w-full flex flex-col gap-y-2">
          <label htmlFor="password" className="text-lg italic text-yellow-700">
            Password
          </label>
          <div className="relative w-full">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              id="password"
              value={formData.password}
              placeholder={isPasswordFocused ? '' : 'Enter password...'}
              className="w-full bg-amber-50 outline outline-yellow-400 rounded-lg px-2 py-1 pr-10"
              required
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              {showPassword ? '🙈' : '🙊'}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="mx-auto px-6 py-1 rounded-lg bg-yellow-300 hover:outline hover:outline-yellow-500 cursor-pointer font-medium transition-all"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
