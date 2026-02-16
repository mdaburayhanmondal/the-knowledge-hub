require('dotenv').config({ quiet: true });
const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 });
const nodemailer = require('nodemailer');
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
          const cacheKey = `myBorrows_${req.user.userId}`;
          cache.del(cacheKey);
          const historyCacheKey = `myHistory_${userId}`;
          cache.del(historyCacheKey);
          cache.del('cachedBooks');
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

    // return a book
    app.patch(
      '/borrows/return/:id',
      verifyToken,
      verifyRole('member', 'librarian', 'owner'),
      async (req, res) => {
        // start session
        const session = client.startSession();
        try {
          session.startTransaction();
          const { id } = req.params;

          const borrowedRecord = await borrowsCollection.findOne(
            { _id: new ObjectId(id) },
            { session },
          );
          if (!borrowedRecord) throw new Error('Borrow record not found.');

          if (borrowedRecord.status === 'returned') {
            throw new Error('This book has already been returned.');
          }

          await borrowsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status: 'returned', returnDate: new Date() } },
            { session },
          );

          const book = await booksCollection.findOne(
            { _id: new ObjectId(borrowedRecord.bookId) },
            { session },
          );

          if (book && !book.isDigital) {
            await booksCollection.updateOne(
              { _id: book._id },
              { $inc: { stock: 1 } },
              { session },
            );
          }
          // save transaction
          await session.commitTransaction();
          const cacheKey = `myBorrows_${req.user.userId}`;
          cache.del(cacheKey);
          const historyCacheKey = `myHistory_${userId}`;
          cache.del(historyCacheKey);
          cache.del('cachedBooks');
          res.status(200).json({ message: 'Book returned successfully.' });
        } catch (error) {
          // undo transaction
          await session.abortTransaction();
          res.status(400).json({ message: error.message });
        } finally {
          // end transaction
          await session.endSession();
        }
      },
    );

    // get borrowed books
    app.get('/my-borrows', verifyToken, async (req, res) => {
      try {
        const userId = req.user.userId;
        const cacheKey = `myBorrows_${userId}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
          return res.status(200).json(cachedData);
        }
        const borrowedRecords = await borrowsCollection
          .aggregate([
            {
              $match: {
                userId: userId,
                status: 'borrowed',
              },
            },
            {
              $lookup: {
                from: 'books',
                localField: 'bookId',
                foreignField: '_id',
                as: 'bookDetails',
              },
            },
            {
              $unwind: {
                path: '$bookDetails',
              },
            },
            {
              $project: {
                _id: 1,
                borrowDate: 1,
                title: '$bookDetails.title',
                author: '$bookDetails.author',
                genre: '$bookDetails.genre',
              },
            },
          ])
          .toArray();
        if (borrowedRecords.length === 0) {
          return res.status(404).json({ message: 'No borrowed books!' });
        }
        cache.set(cacheKey, borrowedRecords, 600);
        res.send(borrowedRecords);
      } catch (error) {
        res
          .status(500)
          .json({ message: 'Failed to load!', error: error.message });
      }
    });

    // borrow-return history
    app.get('/my-history', verifyToken, async (req, res) => {
      try {
        const userId = req.user.userId;
        const cacheKey = `myHistory_${userId}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
          return res.status(200).json(cachedData);
        }

        const records = await borrowsCollection
          .aggregate([
            {
              $match: { userId: userId },
            },
            {
              $project: {
                _id: 0,
                userId: 0,
              },
            },
          ])
          .toArray();

        if (records.length === 0) {
          return res.status(404).json({ message: 'No history found!' });
        }
        cache.set(cacheKey, records, 600);
        res.send(records);
      } catch (error) {
        res
          .status(500)
          .json({ message: 'Failed to load!', error: error.message });
      }
    });

    // get overdue books
    app.get(
      '/borrows/overdue',
      verifyToken,
      verifyRole('librarian', 'owner'),
      async (req, res) => {
        try {
          const daysAllowed = 14;
          const thresholdDate = new Date();
          thresholdDate.setDate(thresholdDate.getDate() - daysAllowed);

          const overdueBooks = await borrowsCollection
            .aggregate([
              {
                $match: {
                  status: 'borrowed',
                  borrowDate: { $lt: thresholdDate },
                },
              },
              {
                $lookup: {
                  from: 'users',
                  let: { userIdStr: '$userId' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ['$_id', { $toObjectId: '$$userIdStr' }],
                        },
                      },
                    },
                  ],
                  as: 'userDetails',
                },
              },
              { $unwind: '$userDetails' },
              {
                $project: {
                  bookTitle: 1,
                  borrowDate: 1,
                  userName: '$userDetails.name',
                  userEmail: '$userDetails.email',
                  totalDaysOut: {
                    $floor: {
                      $divide: [
                        { $subtract: [new Date(), '$borrowDate'] },
                        1000 * 60 * 60 * 24,
                      ],
                    },
                  },
                },
              },
              {
                $addFields: {
                  fineDays: {
                    $max: [0, { $subtract: ['$totalDaysOut', 14] }],
                  },
                },
              },
              {
                $addFields: {
                  totalFine: { $multiply: ['$fineDays', 10] },
                },
              },
            ])
            .toArray();

          res.status(200).json(overdueBooks);
        } catch (error) {
          res.status(500).json({
            message: 'Error fetching overdue books!',
            error: error.message,
          });
        }
      },
    );

    // get admin stats
    app.get(
      '/admin/stats',
      verifyToken,
      verifyRole('librarian', 'owner'),
      async (req, res) => {
        try {
          const thresholdDate = new Date();
          thresholdDate.setDate(thresholdDate.getDate() - 14);

          const [genreStats, fineStats, totalCounts] = await Promise.all([
            booksCollection
              .aggregate([
                { $group: { _id: '$genre', totalCount: { $sum: 1 } } },
                { $sort: { totalCount: -1 } },
                { $project: { _id: 0, genre: '$_id', totalCount: 1 } },
              ])
              .toArray(),

            borrowsCollection
              .aggregate([
                {
                  $match: {
                    status: 'borrowed',
                    borrowDate: { $lt: thresholdDate },
                  },
                },
                {
                  $project: {
                    totalDaysOut: {
                      $floor: {
                        $divide: [
                          { $subtract: [new Date(), '$borrowDate'] },
                          1000 * 60 * 60 * 24,
                        ],
                      },
                    },
                  },
                },
                {
                  $addFields: {
                    fineAmount: {
                      $multiply: [
                        { $max: [0, { $subtract: ['$totalDaysOut', 14] }] },
                        10,
                      ],
                    },
                  },
                },
                {
                  $group: {
                    _id: null,
                    totalLibraryFines: { $sum: '$fineAmount' },
                    averageFine: { $avg: '$fineAmount' },
                  },
                },
              ])
              .toArray(),

            Promise.all([
              booksCollection.countDocuments(),
              usersCollection.countDocuments({ role: 'member' }),
            ]),
          ]);

          res.status(200).json({
            summary: {
              totalBooks: totalCounts[0],
              totalMembers: totalCounts[1],
              totalFinesPending: fineStats[0]?.totalLibraryFines || 0,
              averageFine: fineStats[0]?.averageFine || 0,
            },
            genres: genreStats,
          });
        } catch (error) {
          res.status(500).json({
            message: 'Error fetching stats!',
            error: error.message,
          });
        }
      },
    );

    // transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // remind member
    app.post(
      '/borrows/remind/:id',
      verifyToken,
      verifyRole('librarian', 'owner'),
      async (req, res) => {
        try {
          const { id } = req.params;

          const record = await borrowsCollection
            .aggregate([
              { $match: { _id: new ObjectId(id) } },
              {
                $lookup: {
                  from: 'users',
                  let: { userIdStr: '$userId' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ['$_id', { $toObjectId: '$$userIdStr' }],
                        },
                      },
                    },
                  ],
                  as: 'userDetails',
                },
              },
              { $unwind: '$userDetails' },
              {
                $project: {
                  bookTitle: 1,
                  userEmail: '$userDetails.email',
                  userName: '$userDetails.name',
                  status: 1,
                },
              },
            ])
            .toArray();

          if (record.length === 0) {
            return res.status(404).json({ message: 'Record not found!' });
          }

          const { userEmail, userName, bookTitle, status } = record[0];

          if (status !== 'borrowed') {
            return res
              .status(400)
              .json({ message: 'Book is already returned!' });
          }

          // prepare Email
          const mailOptions = {
            from: `"The Knowledge Hub" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: '📚 Library Return Reminder',
            html: `
          <div style="font-family: sans-serif; line-height: 1.6;">
            <h2>Hello ${userName},</h2>
            <p>This is a friendly reminder to return the book: <strong>"${bookTitle}"</strong>.</p>
            <p>Please return it to the library soon to avoid increasing overdue fines.</p>
            <br />
            <p>Best regards,<br />The Knowledge Hub Team</p>
          </div>
        `,
          };

          // send Email
          await transporter.sendMail(mailOptions);

          res.status(200).json({ message: `Reminder sent to ${userEmail}!` });
        } catch (error) {
          res.status(500).json({
            message: 'Failed to send reminder!',
            error: error.message,
          });
        }
      },
    );

    

    // get a book details
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
        const { search, limit, page, genre, author, isDigital } = req.query;

        let query = {};
        if (search) {
          query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ];
        }
        if (genre) query.genre = genre;
        if (author) query.author = { $regex: author, $options: 'i' };
        if (isDigital !== undefined) query.isDigital = isDigital === 'true';

        const p = parseInt(page) || 1;
        const l = parseInt(limit) || 10;
        const skip = (p - 1) * l;

        const isDefaultView = !search && !genre && !author && p === 1;
        if (isDefaultView) {
          const cachedData = cache.get('cachedBooksDefault');
          if (cachedData) return res.status(200).json(cachedData);
        }

        const [books, totalBooks] = await Promise.all([
          booksCollection.find(query).skip(skip).limit(l).toArray(),
          booksCollection.countDocuments(query),
        ]);

        const result = {
          books,
          pagination: {
            totalBooks,
            totalPages: Math.ceil(totalBooks / l),
            currentPage: p,
          },
        };

        if (isDefaultView) cache.set('cachedBooksDefault', result, 600);

        res.status(200).json(result);
      } catch (error) {
        res
          .status(500)
          .json({ message: 'Error loading books', error: error.message });
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
