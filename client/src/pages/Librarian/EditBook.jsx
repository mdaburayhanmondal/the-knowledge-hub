import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import api from '../../api/axiosInstance';

const EditBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    stock: '',
    image: '',
  });

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await api.get(`/books/${id}`);
        setFormData({
          title: response.data.title,
          author: response.data.author,
          genre: response.data.genre,
          stock: response.data.stock,
          image: response.data.image || '',
        });
      } catch (err) {
        setError(err.message || 'Failed to load book details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

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
      await api.put(`/books/${id}`, {
        ...formData,
        stock: parseInt(formData.stock),
      });

      alert('Book updated successfully!');
      navigate('/books');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update book.');
    }
  };

  if (loading)
    return <div className="text-center mt-10">Loading Book Details...</div>;
  if (error)
    return <div className="text-center mt-10 text-red-600">{error}</div>;

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Book</h2>

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
          />
        </div>

        {/* Author */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">Author</label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleChange}
            className="w-full border p-2 rounded focus:outline-blue-500"
            required
          />
        </div>

        {/* Genre */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">Genre</label>
          <input
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            className="w-full border p-2 rounded focus:outline-blue-500"
          />
        </div>

        {/* Stock */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">Stock</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            className="w-full border p-2 rounded focus:outline-blue-500"
            min="0"
            required
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">
            Image URL
          </label>
          <input
            type="text"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/book-cover.jpg"
            className="w-full border p-2 rounded focus:outline-blue-500"
          />
          {/* Image Preview */}
          {formData.image && (
            <img
              src={formData.image}
              alt="Preview"
              className="h-20 mt-2 object-cover rounded"
            />
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
        >
          Update Book
        </button>

        <button
          type="button"
          onClick={() => navigate('/books')}
          className="text-gray-500 hover:text-gray-700 text-sm mt-2"
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default EditBook;
