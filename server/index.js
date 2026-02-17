require('dotenv').config({ quiet: true });
const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 });
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:5173', 'https://theknowledgehub.netlfiy.app'],
    credentials: true,
  }),
);

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
            expiresIn: '1d',
          },
        );

        res.status(200).json({
          message: 'Log-in successful.',
          user: { name: user.name, role: user.role, userId: user._id },
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
        const { title, author, genre, stock, image, description } = req.body;
        try {
          const newBook = await booksCollection.insertOne({
            title,
            author,
            genre,
            stock,
            image,
            description,
          });
          cache.del('cachedBooksDefault');
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

          cache.del('cachedBooksDefault');
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
          cache.del('cachedBooksDefault');
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

          if (req.book.stock <= 0) {
            throw new Error('This book is out of stock!');
          }
          await booksCollection.updateOne(
            { _id: bookId },
            { $inc: { stock: -1 } },
            { session },
          );

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

    // return a book (librarian)
    app.patch(
      '/borrows/return/:id',
      verifyToken,
      verifyRole('librarian', 'owner'),
      async (req, res) => {
        try {
          const { id } = req.params;

          const record = await borrowsCollection.findOne({
            _id: new ObjectId(id),
          });

          if (!record || record.status !== 'borrowed') {
            return res
              .status(400)
              .json({ message: 'This book was already returned.' });
          }

          // 1. Calculate CURRENT Period Fine
          const borrowDate = new Date(record.borrowDate);
          const returnDate = new Date();
          const diffDays = Math.ceil(
            Math.abs(returnDate - borrowDate) / (1000 * 60 * 60 * 24),
          );

          let currentPeriodFine = 0;
          if (diffDays > 14) {
            currentPeriodFine = (diffDays - 14) * 10;
          }

          // 2. Add to ARCHIVED Fine
          // If they owe 200 from before, and 0 from now -> Total 200.
          // If they owe 200 from before, and 20 from now -> Total 220.
          const historicDebt = record.archivedFine || 0;
          const finalTotalFine = historicDebt + currentPeriodFine;

          // 3. Update Record
          await borrowsCollection.updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                status: 'returned',
                returnDate: returnDate,
                totalFineAtReturn: finalTotalFine,
                unpaidFine: finalTotalFine, // This is what they must pay
                // Note: We keep archivedFine as is, or you can leave it.
                // The 'unpaidFine' is the source of truth for payment now.
              },
            },
          );

          // 4. Update Stock
          await booksCollection.updateOne(
            { _id: new ObjectId(record.bookId) },
            { $inc: { stock: 1 } },
          );

          // 5. Clear Caches
          cache.del('cachedBooksDefault');
          if (record.userId) {
            cache.del(`myBorrows_${record.userId}`);
          }

          res.status(200).json({
            message: 'Book returned successfully!',
            totalFineToPay: finalTotalFine,
          });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      },
    );

    // user's borrow-return-renue
    app.get('/borrows', verifyToken, async (req, res) => {
      try {
        const userId = req.user.userId;

        const result = await borrowsCollection
          .aggregate([
            {
              $match: { userId: userId },
            },
            {
              $lookup: {
                from: 'books',
                localField: 'bookId',
                foreignField: '_id',
                as: 'bookDetails',
              },
            },
            { $unwind: '$bookDetails' },
            {
              $project: {
                _id: 1,
                borrowDate: 1,
                returnDate: 1,
                status: 1,
                fine: '$unpaidFine',
                bookId: 1,
                bookTitle: '$bookDetails.title',
                bookAuthor: '$bookDetails.author',
                bookImage: '$bookDetails.image',
                bookCategory: '$bookDetails.category',
              },
            },
            { $sort: { borrowDate: -1 } },
          ])
          .toArray();

        res.send(result);
      } catch (error) {
        res
          .status(500)
          .json({ message: 'Error fetching borrows', error: error.message });
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
                  },
                },
                {
                  $project: {
                    archivedFine: { $ifNull: ['$archivedFine', 0] },
                    // FIX: Use $ceil to match your JS Math.ceil() logic
                    diffDays: {
                      $ceil: {
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
                    // Calculate Live Fine: (DiffDays - 14) * 10
                    liveFine: {
                      $multiply: [
                        { $max: [0, { $subtract: ['$diffDays', 14] }] },
                        10,
                      ],
                    },
                  },
                },
                {
                  $project: {
                    // Total = Archived + Live
                    totalDebt: { $add: ['$archivedFine', '$liveFine'] },
                  },
                },
                {
                  $match: {
                    totalDebt: { $gt: 0 },
                  },
                },
                {
                  $group: {
                    _id: null,
                    totalLibraryFines: { $sum: '$totalDebt' },
                    averageFine: { $avg: '$totalDebt' },
                  },
                },
              ])
              .toArray(),

            Promise.all([
              booksCollection.countDocuments(),
              usersCollection.countDocuments({ role: 'member' }),
              borrowsCollection.countDocuments({ status: 'borrowed' }),
            ]),
          ]);

          res.status(200).json({
            summary: {
              totalBooks: totalCounts[0],
              totalMembers: totalCounts[1],
              totalActiveBorrows: totalCounts[2],
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

    // book renew
    app.patch('/borrows/renew/:id', verifyToken, async (req, res) => {
      try {
        const { id } = req.params;

        const record = await borrowsCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!record || record.status !== 'borrowed') {
          return res.status(400).json({ message: 'Invalid renewal request.' });
        }

        const book = await booksCollection.findOne({
          _id: new ObjectId(record.bookId),
        });

        if (!book || book.stock <= 2) {
          return res.status(400).json({
            message: 'High demand! This book cannot be renewed.',
          });
        }

        const borrowDate = new Date(record.borrowDate);
        const today = new Date();
        const diffDays = Math.ceil(
          Math.abs(today - borrowDate) / (1000 * 60 * 60 * 24),
        );

        if (diffDays < 11) {
          return res.status(400).json({
            message:
              'Too early! You can only renew 3 days before the due date.',
          });
        }

        let newPeriodFine = 0;
        if (diffDays > 14) {
          newPeriodFine = (diffDays - 14) * 10;
        }

        const currentArchived = record.archivedFine || 0;
        const newTotalFine = currentArchived + newPeriodFine;

        const updateDoc = {
          $set: {
            borrowDate: new Date(),
            reminder12Sent: false,
            reminder13Sent: false,
            isRenewed: true,

            unpaidFine: newTotalFine,
            archivedFine: newTotalFine,
          },
        };

        await borrowsCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);

        res.status(200).json({
          message: 'Renewed successfully!',
          fine: newTotalFine,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // member stats
    app.get('/member-stats/:userId', verifyToken, async (req, res) => {
      try {
        const { userId } = req.params;

        if (
          req.user.role === 'member' &&
          req.user.userId !== userId.toString()
        ) {
          return res.status(403).json({ message: 'Access denied.' });
        }

        const stats = await borrowsCollection
          .aggregate([
            { $match: { userId: userId } },
            {
              $group: {
                _id: '$userId',
                totalBooksBorrowed: { $sum: 1 },
                activeBorrows: {
                  $sum: { $cond: [{ $eq: ['$status', 'borrowed'] }, 1, 0] },
                },
                unpaidFines: { $sum: { $ifNull: ['$unpaidFine', 0] } },
                totalRenewals: { $sum: { $cond: ['$isRenewed', 1, 0] } },
              },
            },
          ])
          .toArray();

        res.status(200).json(
          stats[0] || {
            totalBooksBorrowed: 0,
            activeBorrows: 0,
            unpaidFines: 0,
          },
        );
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // pay and clear fines route
    app.patch(
      '/pay-fines/:userId',
      verifyToken,
      verifyRole('librarian'),
      async (req, res) => {
        try {
          const { userId } = req.params;
          const today = new Date();

          const recordsWithFines = await borrowsCollection
            .find({
              userId: userId,
              unpaidFine: { $gt: 0 },
            })
            .toArray();

          if (recordsWithFines.length === 0) {
            return res
              .status(404)
              .json({ message: 'No unpaid fines found for this user.' });
          }

          const bulkOps = recordsWithFines.map((record) => {
            if (record.status === 'borrowed') {
              return {
                updateOne: {
                  filter: { _id: record._id },
                  update: {
                    $set: {
                      unpaidFine: 0,
                      archivedFine: 0, // <--- Clear the archive too!
                      borrowDate: today,
                      reminder12Sent: false,
                      reminder13Sent: false,
                    },
                  },
                },
              };
            } else {
              return {
                updateOne: {
                  filter: { _id: record._id },
                  update: {
                    $set: {
                      unpaidFine: 0,
                      archivedFine: 0,
                    },
                  },
                },
              };
            }
          });

          const result = await borrowsCollection.bulkWrite(bulkOps);

          res.status(200).json({
            message: `Fines cleared for ${result.modifiedCount} records (Active & Returned).`,
          });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      },
    );

    // sync all fines
    app.patch(
      '/librarian/sync-fines',
      verifyToken,
      verifyRole('librarian'),
      async (req, res) => {
        try {
          const today = new Date();
          const records = await borrowsCollection
            .find({ status: 'borrowed' })
            .toArray();

          if (records.length === 0)
            return res.status(200).json({ message: 'No records.' });

          const bulkOps = records.map((record) => {
            const borrowDate = new Date(record.borrowDate);
            const diffDays = Math.ceil(
              Math.abs(today - borrowDate) / (1000 * 60 * 60 * 24),
            );

            let newLiveFine = 0;
            if (diffDays > 14) {
              newLiveFine = (diffDays - 14) * 10;
            }

            const historicDebt = record.archivedFine || 0;
            const totalDebt = historicDebt + newLiveFine;

            return {
              updateOne: {
                filter: { _id: record._id },
                update: {
                  $set: {
                    unpaidFine: totalDebt,
                    lastSyncedAt: today,
                  },
                },
              },
            };
          });

          const result = await borrowsCollection.bulkWrite(bulkOps);

          res
            .status(200)
            .json({ message: 'Synced fines with archive support.' });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      },
    );

    // user lookup bridge for librarian dashboard
    app.get(
      '/librarian/lookup',
      verifyToken,
      verifyRole('librarian', 'owner'),
      async (req, res) => {
        try {
          const { email } = req.query;
          if (!email)
            return res.status(400).json({ message: 'Email is required' });

          const user = await usersCollection.findOne({ email: email });
          if (!user) {
            return res.status(404).json({ message: 'User not found!' });
          }

          const activeBorrows = await borrowsCollection
            .aggregate([
              { $match: { userId: user._id.toString(), status: 'borrowed' } },
              {
                $lookup: {
                  from: 'books',
                  localField: 'bookId',
                  foreignField: '_id',
                  as: 'bookDetails',
                },
              },
              { $unwind: '$bookDetails' },
              {
                $project: {
                  _id: 1,
                  bookTitle: '$bookDetails.title',
                  bookImage: '$bookDetails.image',
                  borrowDate: 1,
                  fine: '$unpaidFine',
                },
              },
            ])
            .toArray();

          const today = new Date();
          let totalFine = 0;

          const borrowsWithFine = activeBorrows.map((record) => {
            // 1. Get the "Locked" debt from previous renewals
            const historicDebt = record.archivedFine || 0;

            // 2. Calculate "Live" fine for the CURRENT period
            const today = new Date();
            const borrowDate = new Date(record.borrowDate);
            const diffDays = Math.ceil(
              Math.abs(today - borrowDate) / (1000 * 60 * 60 * 24),
            );

            let currentPeriodFine = 0;
            if (diffDays > 14) {
              currentPeriodFine = (diffDays - 14) * 10;
            }

            // 3. CORRECT LOGIC: Summation
            // Total = Old Debt + New Debt
            const actualFine = historicDebt + currentPeriodFine;

            totalFine += actualFine;

            return {
              ...record,
              fine: actualFine, // Send correct total to frontend
            };
          });

          res.status(200).json({
            userId: user._id,
            name: user.name,
            email: user.email,
            totalFine,
            activeBorrows: borrowsWithFine,
          });
        } catch (error) {
          res.status(500).json({ error: error.message });
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
        const { search, limit, page, genre, author } = req.query;

        let query = {};
        if (search) {
          query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ];
        }
        if (genre) query.genre = genre;
        if (author) query.author = { $regex: author, $options: 'i' };

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

    // reminder automation
    cron.schedule(
      '0 0 * * *', // Every day at midnight
      async () => {
        console.log('📚 Running scheduled library reminders...');

        try {
          const now = new Date();

          const getTargetWindow = (daysBack) => {
            const start = new Date();
            start.setDate(start.getDate() - daysBack);
            start.setHours(0, 0, 0, 0);

            const end = new Date();
            end.setDate(end.getDate() - daysBack);
            end.setHours(23, 59, 59, 999);

            return { start, end };
          };

          const day12 = getTargetWindow(12);
          const day13 = getTargetWindow(13);

          const reminders = await borrowsCollection
            .aggregate([
              {
                $match: {
                  status: 'borrowed',
                  $or: [
                    {
                      borrowDate: {
                        $gte: day12.start,
                        $lte: day12.end,
                      },
                      reminder12Sent: { $ne: true },
                    },
                    {
                      borrowDate: {
                        $gte: day13.start,
                        $lte: day13.end,
                      },
                      reminder13Sent: { $ne: true },
                    },
                  ],
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
                  as: 'user',
                },
              },
              { $unwind: '$user' },
            ])
            .toArray();

          for (const record of reminders) {
            const daysPassed = Math.floor(
              (now - new Date(record.borrowDate)) / (1000 * 60 * 60 * 24),
            );

            let subject = '';
            let warning = '';
            let updateField = {};

            // 🔔 12 Day Reminder
            if (daysPassed === 12 && !record.reminder12Sent) {
              subject = '📝 2 Days Left: Return your book';
              warning = 'You have 2 days left before overdue fines begin.';

              updateField = { reminder12Sent: true };
            }

            // ⚠️ 13 Day Final Reminder
            if (daysPassed === 13 && !record.reminder13Sent) {
              subject = '⚠️ Final Notice: Book Due Tomorrow';
              warning =
                'Tomorrow is your last day! 10 Taka daily fine starts after 24 hours.';

              updateField = { reminder13Sent: true };
            }

            // If no valid stage → skip
            if (!subject) continue;

            console.log(`📧 Sending reminder to ${record.user.email}`);

            await transporter.sendMail({
              from: `"The Knowledge Hub" <${process.env.EMAIL_USER}>`,
              to: record.user.email,
              subject,
              html: `
            <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
              <h2 style="color: #2c3e50;">The Knowledge Hub</h2>
              <p>Hello <strong>${record.user.name}</strong>,</p>
              <p>This is an automated reminder for your borrowed book: 
              <strong>"${record.bookTitle}"</strong>.</p>

              <p style="background: #fff3cd; padding: 10px; border-left: 5px solid #ffecb5;">
                ${warning}
              </p>

              <p>Please visit the library desk to return or renew your book.</p>

              <hr />
              <small>This is an automated message from The Knowledge Hub Library System.</small>
            </div>
          `,
            });

            // ✅ Mark reminder as sent
            await borrowsCollection.updateOne(
              { _id: record._id },
              { $set: updateField },
            );
          }

          console.log('✅ Reminder job completed.');
        } catch (error) {
          console.error('❌ Cron Error:', error);
        }
      },
      {
        timezone: 'Asia/Dhaka', // 🔥 VERY IMPORTANT
      },
    );

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
