const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Registration route
router.post('/register', async (req, res) => {
    const { username, email, password, full_name, phone } = req.body;

    try {
        // Kiểm tra user đã tồn tại
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
        }

        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ error: 'Email đã được sử dụng' });
        }

        // Tạo user mới
        const newUser = await User.create({
            username,
            email,
            password,
            full_name,
            phone
        });

        res.status(201).json({
            message: 'Đăng ký thành công',
            user: newUser.toJSON()
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Lỗi server khi đăng ký' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
      console.log('User found1:', username);
        // Tìm user
      const user = await User.findByUsername(username);
      console.log('User found:', user);
        if (!user) {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // // Kiểm tra password
        // const isPasswordValid = await user.comparePassword(password);
        // if (!isPasswordValid) {
        //     return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        // }

        // Tạo JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Đăng nhập thành công',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
    }
});

// Get user profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Người dùng không tồn tại' });
        }

        res.json(user.toJSON());
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Middleware để xác thực token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token không được cung cấp' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token không hợp lệ' });
        }
        req.user = user;
        next();
    });
}

module.exports = router;
