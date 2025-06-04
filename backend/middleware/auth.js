const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token is not valid.' });
        }

        req.user = decoded;
        next();
    });
};

const checkUserExists = async (req, res, next) => {
    const { username } = req.body;

    const user = await User.findOne({ username });
    if (user) {
        return res.status(400).json({ message: 'User already exists.' });
    }

    next();
};

module.exports = {
    authMiddleware,
    checkUserExists
};