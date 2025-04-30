const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// MongoDB Atlas Connection String
const mongoURI = 'mongodb+srv://anu7698:9GpEdr2MYhbKAkeu@cluster0.cnroi.mongodb.net/myVirtualDatabase?retryWrites=true&w=majority';

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.log('Error connecting to MongoDB Atlas:', err));

// Define a schema for users
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String // 'parent' or 'evaluator'
});

// Create a model based on the schema
const User = mongoose.model('User', userSchema);

// Define a schema for assessments
const assessmentSchema = new mongoose.Schema({
  childName: String,
  dob: String,
  assessmentDate: String,
  evaluatorName: String,
  childAge: Number,
  score: Number,
  percentage: String,
  parentUsername: String
});

// Create a model based on the schema
const ChildAssessment = mongoose.model('ChildAssessment', assessmentSchema);

// Registration route for parents
app.post('/register-parent', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword, role: 'parent' });
  await newUser.save();
  res.status(200).json({ message: 'Parent registration successful' });
});

// Registration route for evaluators
app.post('/register-evaluator', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword, role: 'evaluator' });
  await newUser.save();
  res.status(200).json({ message: 'Evaluator registration successful' });
});

// Login route for parents
app.post('/login-parent', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, role: 'parent' });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.user = username;
    req.session.role = 'parent';
    res.status(200).json({ message: 'Parent login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Login route for evaluators
app.post('/login-evaluator', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, role: 'evaluator' });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.user = username;
    req.session.role = 'evaluator';
    res.status(200).json({ message: 'Evaluator login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// Middleware to check if user is an evaluator
function isEvaluator(req, res, next) {
  if (req.session.role === 'evaluator') {
    return next();
  } else {
    res.status(403).json({ message: 'Forbidden' });
  }
}

// Route to check authentication status
app.get('/check-auth', (req, res) => {
  if (req.session.user) {
    res.status(200).json({ message: 'Authenticated' });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// POST route to save assessment data to MongoDB
app.post('/save-assessment', isAuthenticated, isEvaluator, async (req, res) => {
  try {
    const assessmentData = req.body;
    const newAssessment = new ChildAssessment(assessmentData);
    await newAssessment.save();
    console.log('Assessment saved:', newAssessment); // Log the saved assessment
    res.status(200).json({ message: 'Assessment saved successfully!' });
  } catch (error) {
    console.log('Error saving assessment:', error); // Log the error
    res.status(500).json({ error: 'Error saving assessment to database' });
  }
});

// GET route to show assessments for parents
app.get('/show-assessments', isAuthenticated, async (req, res) => {
  if (req.session.role === 'parent') {
    const assessments = await ChildAssessment.find({ parentUsername: req.session.user });
    res.status(200).json(assessments);
  } else {
    res.status(403).json({ message: 'Forbidden' });
  }
});

// Serve parent-dashboard.html only if authenticated and parent
app.get('/parent-dashboard.html', isAuthenticated, (req, res) => {
  if (req.session.role === 'parent') {
    res.sendFile(path.join(__dirname, 'public', 'parent-dashboard.html'));
  } else {
    res.status(403).json({ message: 'Forbidden' });
  }
});

// Serve index.html only if authenticated and evaluator
app.get('/index.html', isAuthenticated, isEvaluator, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Redirect to login selection page
app.get('/', (req, res) => {
  res.redirect('/login-selection.html');
});

// Start the server
const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});