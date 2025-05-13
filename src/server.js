const express = require('express');
const http = require('http');
const path = require('path');
const session = require('express-session');
const { Server } = require('socket.io'); 
const connectToDatabase = require('./models/database').connectToDatabase; // Assuming you have a database connection file
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const forumRoutes = require('./routes/forum');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);


// Apply middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: 'ganja', // Replace with a secure secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);


// Database connection
connectToDatabase('mongodb+srv://daniel:<db_password>@nrsa.7ktcqdl.mongodb.net/?retryWrites=true&w=majority&appName=NRSA'); // Replace with your MongoDB connection string

// Use routes
app.use('/',authRoutes);
app.use(shopRoutes);
app.use(forumRoutes);

// Share session with Socket.IO
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

// Basket routes

// Serve static files
app.use(express.static('public'));

// WebSocket connection
io.on('connection', (socket) => {
    if (!socket.request.session || !socket.request.session.user) {
        socket.disconnect();
        return;
      }
});

// Start the server
server.listen(4200, () => {
    console.log('Server running on port 4200');
});

