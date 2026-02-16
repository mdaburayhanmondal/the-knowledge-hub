import { useContext, useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../../api/axiosInstance';
import { AuthContext } from '../../contexts/AuthContext';

const Login = () => {
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  let navigate = useNavigate();

  const { login } = useContext(AuthContext);

  const formHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/login', { email, password });
      const { token, user: userData } = response.data;
      login(userData, token);
      if (userData.role === 'librarian' || userData.role === 'owner') {
        navigate('/admin/stats');
      } else {
        navigate('/books');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div class="flex flex-row gap-2 min-h-screen justify-center items-center mx-auto">
        <div class="w-4 h-4 rounded-full bg-blue-700 animate-bounce"></div>
        <div class="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:-.3s]"></div>
        <div class="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:-.5s]"></div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto min-h-screen flex flex-col items-center justify-center gap-y-6 p-4">
      <h1 className="text-3xl text-yellow-900 font-extrabold italic underline-0 hover:underline hover:underline-offset-8 decoration-4 decoration-wavy transition-all duration-300 ease-in cursor-default">
        Log-in
      </h1>
      <form
        onSubmit={formHandler}
        className="w-full max-w-2xl mx-auto flex flex-col items-start justify-center gap-y-6"
      >
        <div className="w-full flex flex-col gap-y-2">
          <label htmlFor="email" className="text-lg italic text-yellow-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder={isEmailFocused ? '' : 'Enter email...'}
            className="w-full bg-amber-50 outline outline-yellow-400 rounded-lg px-2 py-1"
            required
            onFocus={() => setIsEmailFocused(true)}
            onBlur={() => setIsEmailFocused(false)}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </div>
        <div className="w-full flex flex-col gap-y-2">
          <label htmlFor="password" className="text-lg italic text-yellow-700">
            Password
          </label>

          <div className="relative w-full">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder={isPasswordFocused ? '' : 'Enter password...'}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              className="w-full bg-amber-50 outline outline-yellow-400 rounded-lg px-2 py-1 pr-10"
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
        <button className="mx-auto px-3 py-1 rounded-lg bg-yellow-300 hover:outline hover:outline-yellow-500 cursor-pointer">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
