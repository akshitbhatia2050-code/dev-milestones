const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection String
const mongoURI = 'mongodb+srv://Mohmaya:mohmaya890@cluster0.mesiasx.mongodb.net/?retryWrites=true&w=majority';

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

// Define a schema for child assessments
const childAssessmentSchema = new mongoose.Schema({
    childName: String,
    dob: Date,
    assessmentDate: Date,
    evaluatorName: String,
    childAge: Number,
    childScore: Number,
    percentage: Number,
    classification: String,
});

// Create a model based on the schema
const ChildAssessment = mongoose.model('ChildAssessment', childAssessmentSchema);

// POST route to save assessment data to MongoDB
app.post('/save-assessment', async (req, res) => {
    try {
        const assessmentData = req.body;
        const newAssessment = new ChildAssessment(assessmentData);
        await newAssessment.save();
        res.status(200).json({ message: 'Assessment saved successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error saving assessment to database' });
    }
});

// Start the server
const port = 5000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});