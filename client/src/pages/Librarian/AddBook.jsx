import { useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../../api/axiosInstance';

const AddBook = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    genre: '',
    stock: '',
    image: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/books', {
        ...formData,
        stock: parseInt(formData.stock),
      });

      alert('Book added successfully!');
      navigate('/books');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add book.');
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Book</h2>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border p-2 rounded focus:outline-blue-500"
            required
            placeholder="Enter book title"
          />
        </div>
        {/* Description */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">
            Description
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border p-2 rounded focus:outline-blue-500"
            required
            placeholder="Enter book description"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Author</label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleChange}
            className="w-full border p-2 rounded focus:outline-blue-500"
            required
            placeholder="Enter author name"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Genre</label>
          <input
            type="text"
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            className="w-full border p-2 rounded focus:outline-blue-500"
            placeholder="e.g. Fiction, Sci-Fi"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Stock</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            className="w-full border p-2 rounded focus:outline-blue-500"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">
            Image URL
          </label>
          <input
            type="text"
            name="image"
            value={formData.image}
            onChange={handleChange}
            className="w-full border p-2 rounded focus:outline-blue-500"
            placeholder="https://..."
          />
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition duration-200"
        >
          Add Book
        </button>
      </form>
    </div>
  );
};

export default AddBook;
