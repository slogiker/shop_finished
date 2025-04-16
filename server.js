const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { getCodesFromText, encode, decode } = require('huffman-javascript');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
const sessionMiddleware = session({
    secret: 'ganja',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
});
app.use(sessionMiddleware);

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://daniel:nrsa@nrsa.7ktcqdl.mongodb.net/mojApp?retryWrites=true&w=majority&appName=NRSA')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Define User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Define Message Schema with Huffman encoding
const messageSchema = new mongoose.Schema({
    username: String,
    encodedMessage: String,
    codes: { type: Map, of: String },
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Define Order Schema
const orderSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    user: String,
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    billingStreet: String,
    billingCity: String,
    billingPostal: String,
    billingCountry: String,
    shippingStreet: String,
    shippingCity: String,
    shippingPostal: String,
    shippingCountry: String,
    products: { type: Map, of: Number },
    totalPrice: Number,
    paymentMethod: String,
    notes: String
});
const Order = mongoose.model('Order', orderSchema);

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

// Registration route
app.post('/register', async (req, res) => {
    const { username, email, password, passwordRepeat } = req.body;
    if (!username || !email || !password || !passwordRepeat) {
        return res.status(400).send('All fields are required');
    }
    if (password !== passwordRepeat) {
        return res.status(400).send('Passwords do not match');
    }
    try {
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).send('Username or email already exists');
        }
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.redirect('/login.html');
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).send('Server error');
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }
    try {
        const user = await User.findOne({ username });
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(400).send('Invalid credentials');
        }
        req.session.user = { username };
        res.redirect('/shop.html');
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Server error');
    }
});

// Basket routes
app.post('/add-to-basket', isAuthenticated, (req, res) => {
    const { name, quantity, priceBTC, priceETH } = req.body;
    if (!name || !quantity || !priceBTC || !priceETH) {
        return res.status(400).json({ success: false, message: 'Invalid data' });
    }
    if (!req.session.basket) {
        req.session.basket = [];
    }
    const existingItem = req.session.basket.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        req.session.basket.push({ name, quantity, priceBTC, priceETH });
    }
    res.json({ success: true });
});

app.get('/get-basket', isAuthenticated, (req, res) => {
    res.json(req.session.basket || []);
});

app.post('/confirm-order', isAuthenticated, async (req, res) => {
    const {
        firstName, lastName, email, phone,
        billingStreet, billingCity, billingPostal, billingCountry,
        shippingStreet, shippingCity, shippingPostal, shippingCountry,
        paymentMethod, notes
    } = req.body;

    if (!firstName || !lastName || !email || !phone ||
        !billingStreet || !billingCity || !billingPostal || !billingCountry ||
        !shippingStreet || !shippingCity || !shippingPostal || !shippingCountry ||
        !paymentMethod || !['BTC', 'ETH'].includes(paymentMethod)) {
        return res.status(400).json({ success: false, message: 'Invalid order data' });
    }
    if (!req.session.basket || req.session.basket.length === 0) {
        return res.status(400).json({ success: false, message: 'Basket is empty' });
    }

    let totalPrice = 0;
    const products = {};
    req.session.basket.forEach(item => {
        products[item.name] = item.quantity;
        totalPrice += item.quantity * (paymentMethod === 'BTC' ? item.priceBTC : item.priceETH);
    });

    const order = new Order({
        user: req.session.user.username,
        firstName,
        lastName,
        email,
        phone,
        billingStreet,
        billingCity,
        billingPostal,
        billingCountry,
        shippingStreet,
        shippingCity,
        shippingPostal,
        shippingCountry,
        products,
        totalPrice,
        paymentMethod,
        notes
    });

    try {
        await order.save();
        req.session.basket = [];
        res.json({ success: true, message: 'Order confirmed' });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Protect routes
app.get('/shop.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});
app.get('/forum.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'forum.html'));
});
app.get('/basket.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'basket.html'));
});

// Serve static files
app.use(express.static('public'));

// Check authentication status
app.get('/check-auth', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, username: req.session.user.username });
    } else {
        res.json({ authenticated: false });
    }
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        res.status(200).send('Logged out');
    });
});

// Get all messages
app.get('/messages', isAuthenticated, async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: 1 });
        const decodedMessages = messages.map(msg => {
            try {
                if (!msg.encodedMessage || !msg.codes || typeof msg.codes.entries !== 'function') {
                    throw new Error('Invalid message format');
                }
                const invertedCodes = new Map();
                for (const [char, code] of msg.codes.entries()) {
                    invertedCodes.set(code, char);
                }
                const codesObj = Object.fromEntries(invertedCodes);
                let decodedMessage;
                try {
                    decodedMessage = decode(msg.encodedMessage, invertedCodes);
                    if (decodedMessage) return { _id: msg._id, username: msg.username, message: decodedMessage, timestamp: msg.timestamp };
                } catch (mapError) {
                    console.error('Map decode failed:', mapError);
                }
                try {
                    decodedMessage = decode(msg.encodedMessage, codesObj);
                    if (decodedMessage) return { _id: msg._id, username: msg.username, message: decodedMessage, timestamp: msg.timestamp };
                } catch (objError) {
                    console.error('Object decode failed:', objError);
                }
                decodedMessage = manualDecode(msg.encodedMessage, codesObj);
                return {
                    _id: msg._id,
                    username: msg.username,
                    message: decodedMessage || '[Empty decode result]',
                    timestamp: msg.timestamp
                };
            } catch (decodeError) {
                console.error('Error decoding message:', decodeError);
                return {
                    _id: msg._id,
                    username: msg.username,
                    message: '[Error decoding message: ' + decodeError.message + ']',
                    timestamp: msg.timestamp
                };
            }
        });
        res.json(decodedMessages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).send('Server error');
    }
});

// Manual Huffman decoding function
function manualDecode(bitString, codes) {
    let decoded = '';
    let currentBits = '';
    for (const bit of bitString) {
        currentBits += bit;
        if (codes[currentBits]) {
            decoded += codes[currentBits];
            currentBits = '';
        }
    }
    return decoded || '[Manual decode failed]';
}

// WebSocket connection
io.on('connection', (socket) => {
    if (!socket.request.session || !socket.request.session.user) {
        socket.disconnect();
        return;
    }
    const username = socket.request.session.user.username;
    socket.on('chatMessage', async (text) => {
        try {
            const codes = getCodesFromText(text);
            const encoded = encode(text, codes).join('');
            const newMessage = new Message({
                username,
                encodedMessage: encoded,
                codes,
                timestamp: new Date()
            });
            await newMessage.save();
            io.emit('chatMessage', {
                _id: newMessage._id,
                username,
                message: text,
                timestamp: newMessage.timestamp
            });
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });
    socket.on('disconnect', () => {});
});

// Delete message (admin only)
app.delete('/messages/:id', isAuthenticated, async (req, res) => {
    if (req.session.user.username !== 'admin') {
        return res.status(403).send('Forbidden');
    }
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.status(200).send('Message deleted');
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).send('Server error');
    }
});

// Share session with Socket.IO
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

// Start the server
server.listen(4200, () => {
    console.log('Server running on port 4200');
});