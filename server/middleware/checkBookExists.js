const { ObjectId } = require('mongodb');

const checkBookExists = (collection) => {
  return async (req, res, next) => {
    const { id } = req.params;
    const book = await collection.findOne({ _id: new ObjectId(id) });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    req.book = book;
    next();
  };
};

module.exports = { checkBookExists };
