require('dotenv').config({ quiet: true });
const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// ========================>

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { checkBookExists } = require('./middleware/checkBookExists');
const uri = process.env.MONGODB_URL;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // ====================>
    const db = client.db('the-knowledge-hub-db');
    const usersCollection = db.collection('users');
    const booksCollection = db.collection('books');
    const borrowsCollection = db.collection('borrows');

    // add book
    app.post('/books', async (req, res) => {
      const { title, author, genre, stock, isDigital } = req.body;
      try {
        const newBook = await booksCollection.insertOne({
          title,
          author,
          genre,
          stock,
          isDigital,
        });
        res.status(201).json({ message: 'Book added successfully!' });
      } catch (error) {
        res
          .status(500)
          .json({ message: 'Failed to add book!', error: error.message });
      }
    });

    // find a book
    app.get(
      '/books/:id',
      checkBookExists(booksCollection),
      async (req, res) => {
        try {
          res.status(200).json(req.book);
        } catch (error) {
          res
            .status(500)
            .json({ message: 'Failed to load book!', error: error.message });
        }
      },
    );

    // update a book
    app.put(
      '/books/:id',
      checkBookExists(booksCollection),
      async (req, res) => {
        try {
          const { id } = req.params;
          const { _id, ...updatedData } = req.body;
          const result = await booksCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedData },
          );

          if (result.modifiedCount === 0) {
            return res
              .status(200)
              .json({ message: 'No changes made to the book.' });
          }

          res.status(200).json({ message: 'Book updated successfully!' });
        } catch (error) {
          res.status(500).json({
            message: 'Failed to update book!',
            error: error.message,
          });
        }
      },
    );

    // delete a book
    app.delete(
      '/books/:id',
      checkBookExists(booksCollection),
      async (req, res) => {
        try {
          const { id } = req.params;
          const deletedBook = await booksCollection.deleteOne({
            _id: new ObjectId(id),
          });
          res
            .status(200)
            .json({ message: 'The Book is deleted successfully!' });
        } catch (error) {
          res.status(500).json({
            message: 'Failed to delete book!',
            error: error.message,
          });
        }
      },
    );

    // get all books
    app.get('/books', async (req, res) => {
      try {
        const books = await booksCollection.find().toArray();
        if (books.length === 0) {
          return res.status(404).json({ message: 'No books!' });
        }
        res.status(200).json(books);
      } catch (error) {
        res
          .status(500)
          .json({ message: 'Failed to load books!', error: error.message });
      }
    });
    // ====================!

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!',
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// ========================!

app.get('/', (req, res) => {
  res.send('OKAY');
});

app.listen(port, () => {
  console.log(`Server is running ---> http://localhost:${port}`);
});
