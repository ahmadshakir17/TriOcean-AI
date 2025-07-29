const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./src/config/database');
const { configurePassport, ensureAuthenticated } = require('./src/config/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure passport authentication
configurePassport(app);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// Import routes
const authRoutes = require('./src/routes/auth');

// Use routes
app.use('/auth', authRoutes);

// Routes (will be added later)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TriOcean AI Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Dashboard route (protected)
app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>TriOcean AI - Dashboard</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                background: #f5f5f5; 
                margin: 0; 
                padding: 20px; 
            }
            .header { 
                background: white; 
                padding: 20px; 
                border-radius: 10px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                margin-bottom: 20px; 
            }
            .welcome { 
                font-size: 24px; 
                color: #333; 
                margin-bottom: 10px; 
            }
            .user-info { 
                color: #666; 
                margin-bottom: 20px; 
            }
            .logout-btn { 
                background: #dc3545; 
                color: white; 
                padding: 10px 20px; 
                border: none; 
                border-radius: 5px; 
                cursor: pointer; 
                text-decoration: none; 
                display: inline-block; 
            }
            .logout-btn:hover { 
                background: #c82333; 
            }
            .content { 
                background: white; 
                padding: 30px; 
                border-radius: 10px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            }
            .ai-section { 
                text-align: center; 
                padding: 40px; 
            }
            .ai-icon { 
                font-size: 48px; 
                margin-bottom: 20px; 
            }
            .chat-input { 
                width: 100%; 
                max-width: 600px; 
                padding: 15px; 
                border: 2px solid #ddd; 
                border-radius: 10px; 
                font-size: 16px; 
                margin-top: 20px; 
            }
            .send-btn { 
                background: #0078d4; 
                color: white; 
                padding: 15px 30px; 
                border: none; 
                border-radius: 5px; 
                font-size: 16px; 
                cursor: pointer; 
                margin-top: 10px; 
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="welcome">Welcome to TriOcean AI!</div>
            <div class="user-info">Logged in as: ${req.user.name} (${req.user.email})</div>
            <a href="/auth/logout" class="logout-btn">Logout</a>
        </div>
        <div class="content">
            <div class="ai-section">
                <div class="ai-icon">🤖</div>
                <h2>AI Assistant</h2>
                <p>How can I help you today?</p>
                <textarea class="chat-input" placeholder="Type your message here..."></textarea>
                <br>
                <button class="send-btn">Send Message</button>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Home route - serve login page directly
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/dashboard');
  } else {
    res.sendFile(path.join(__dirname, 'login.html'));
  }
});

// Test route for Azure configuration
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-azure.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 TriOcean AI Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection
  await testConnection();
});

module.exports = app; 