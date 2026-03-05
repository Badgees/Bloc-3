const express = require('express')
const bodyParser = require('body-parser')
const booksrouter = require('./router/books')
const usersRouter = require('./router/users')
const loansRouter = require('./router/loans')
const cors = require('cors')
const path = require('path')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const db = require('./services/database')

const jwtSecret = process.env.JWT_SECRET || '';

function authenticateToken(req, res, next) {
    const token = req.cookies.token
    if (!token) return res.sendStatus(401)

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}
const corsOptions = {
    origin: 'https://exam.andragogy.fr',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
}

const router = express.Router()
router.use(bodyParser.json());
router.use(cors(corsOptions));
router.use(cookieParser());
router.use('/api/books', booksrouter);
router.use('/api/users', usersRouter);
router.use('/api/loans', loansRouter);

router.post('/api/logout', (_, res) => {
    res.clearCookie('token');
    res.json({ message: 'Déconnexion réussie' });
});

router.get('/api/session', authenticateToken, (req, res) => {
    if (req?.user) {
        res.json({ user: req.user });
    } else {
        res.status(401).json({ message: 'Non authentifié' });
    }
});

router.get('/api/statistics', (req, res) => {
    const totalBooksQuery = 'SELECT COUNT(*) AS total_books FROM livres';
    const totalUsersQuery = 'SELECT COUNT(*) AS total_users FROM utilisateurs';

    db.query(totalBooksQuery, (err, booksResult) => {
        if (err) throw err;
        db.query(totalUsersQuery, (err, usersResult) => {
            if (err) throw err;
            res.json({
                total_books: booksResult[0].total_books,
                total_users: usersResult[0].total_users
            });
        });
    });
});

router.use('/', express.static(path.join(__dirname, "./webpub")))
router.use(express.static(path.join(__dirname, "./webpub")))
router.use('/*', (_, res) => {
    res.sendFile(
        path.join(__dirname, "./webpub/index.html")
    );
})
router.get("*", (_, res) => {
    res.sendFile(
        path.join(__dirname, "./webpub/index.html")
    );
});

module.exports = router;