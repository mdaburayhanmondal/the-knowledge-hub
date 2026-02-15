require('dotenv').config({ quiet: true });
const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// ========================>

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { checkBookExists } = require('./middleware/checkBookExists');
const verifyToken = require('./middleware/verifyToken');
const verifyRole = require('./middleware/verifyRole');
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

    // registration>
    app.post('/register', async (req, res) => {
      try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
          return res.status(400).json({ message: 'All fields are required' });
        }

        const user = await usersCollection.findOne({ email });
        if (user) {
          return res
            .status(409)
            .json({ message: 'User alreday exists! Please log-in.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
          name,
          email,
          password: hashedPassword,
          role: 'member',
          createdAt: new Date(),
        };
        await usersCollection.insertOne(newUser);
        res
          .status(200)
          .json({ message: `New ${newUser.role} is registered successfully!` });
      } catch (error) {
        res
          .status(500)
          .json({ message: 'Failed to register!', error: error.message });
      }
    });
    // registration!

    // login>
    app.post('/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        const user = await usersCollection.findOne({ email });
        if (!user) {
          return res
            .status(404)
            .json({ message: "User doesn't exist! Please register." });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res
            .status(401)
            .json({ message: 'Wrong credentials! Try again' });
        }
        // jwt token
        const token = jwt.sign(
          { userId: user._id, role: user.role },
          process.env.JWT_SECRET,
          {
            expiresIn: '2m',
          },
        );

        res.status(200).json({
          message: 'Log-in successful.',
          user: { name: user.name, role: user.role },
          token,
        });
      } catch (error) {
        res
          .status(500)
          .json({ message: 'Failed to register!', error: error.message });
      }
    });
    // login!

    // add book
    app.post(
      '/books',
      verifyToken,
      verifyRole('librarian', 'owner'),
      async (req, res) => {
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
      },
    );

    // update a book
    app.put(
      '/books/:id',
      verifyToken,
      verifyRole('librarian', 'owner'),
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
      verifyToken,
      verifyRole('librarian', 'owner'),
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

    // borrow a book
    app.post(
      '/borrows/:id',
      verifyToken,
      verifyRole('member', 'librarian', 'owner'),
      checkBookExists(booksCollection),
      async (req, res) => {
        // start session
        const session = client.startSession();
        try {
          // start transaction
          session.startTransaction();

          const { id } = req.params;
          const bookId = new ObjectId(id);
          const userId = req.user.userId;

          const alreadyBorrowed = await borrowsCollection.findOne({
            userId,
            bookId,
            status: 'borrowed',
          });

          if (alreadyBorrowed) {
            return res.status(400).json({
              message: 'You already have an active borrow for this book!',
            });
          }

          if (!req.book.isDigital) {
            if (req.book.stock <= 0)
              throw new Error('This book is out of stock!');

            await booksCollection.updateOne(
              { _id: bookId },
              { $inc: { stock: -1 } },
              { session },
            );
          }

          const borrowedRecord = {
            userId,
            bookId,
            bookTitle: req.book.title,
            borrowDate: new Date(),
            status: 'borrowed',
          };
          await borrowsCollection.insertOne(borrowedRecord, { session });

          // save transaction
          await session.commitTransaction();
          res.status(200).json({ message: 'Book borrowed successfully.' });
        } catch (error) {
          // if anything failed, undo everything!
          await session.abortTransaction();
          res.status(400).json({ message: error.message });
        } finally {
          // end the session
          await session.endSession();
        }
      },
    );

    // view a book details
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
