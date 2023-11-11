const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const User = require('./user');

const { body, validationResult } = require('express-validator');
const port = 5000;
console.log("Testing");

const app = express();
app.use(express.json());

const atlasUri = "mongodb+srv://channaveer:Password123@cluster0.9rrtmnh.mongodb.net/?retryWrites=true&w=majority";
// 
mongoose.connect(atlasUri)
  .then(() => {
    app.listen(port,()=>{console.log('MongoDB connected...');
  });
})
  .catch(err => console.log(err));

  
  // 1st
  

  // User creation endpoint with validation
app.post('/user/create', [
    // Validate the full name
    body('fullName').not().isEmpty().withMessage('Full name is required.'),
    
    // Validate the email
    body('email').isEmail().withMessage('Invalid email address.'),
    
    // Validate the password
    body('password').isStrongPassword().withMessage('Password does not meet strength requirements.'),
  ], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    // Extract validated data
    const { fullName, email, password } = req.body;
  
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).send('Email already in use.');
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create a new user and save to the database
      const user = new User({ fullName, email, password: hashedPassword });
      await user.save();
      
      // Respond with success message
      res.status(201).send('User created successfully.');
    } catch (error) {
      res.status(500).send('An error occurred while creating the user.');
    }
  });
  
// Update user endpoint
app.put('/user/edit', [
    // Validate the full name
    body('fullName').not().isEmpty().trim().escape().withMessage('Full name is required.'),
    // Validate the email but don't update it
    body('email').isEmail().withMessage('Valid email is required.'),
    // Validate password only if it's provided
    body('password').optional().isStrongPassword().withMessage('Password does not meet strength requirements.')
  ], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    // Extract details from request body
    const { fullName, email, password } = req.body;
  
    try {
      // Find user by email and update the full name and password
      const userToUpdate = await User.findOne({ email: email });
  
      if (!userToUpdate) {
        return res.status(404).send('User not found.');
      }
  
      // If password change is requested, hash the new password
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        userToUpdate.password = hashedPassword;
      }
  
      // Update fullName always since it's required on every call here
      userToUpdate.fullName = fullName;
      
      // Save the updated user details
      await userToUpdate.save();
  
      // Respond with success message
      res.json({ message: 'User updated successfully.' });
  
    } catch (error) {
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });

  app.delete('/user/delete/:email', async (req, res) => {
    const email = req.params.email;
    if (!email) {
      return res.status(400).json({ message: 'An email is required.' });
    }
  
    // Validate the email is in correct format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'A valid email is required to delete a user.' });
    }
  
    try {
      // Attempt to delete the user
      const result = await User.findOneAndDelete({ email: email });
  
      if (result) {
        return res.status(200).json({ message: 'User deleted successfully.' });
      } else {
        return res.status(404).json({ message: 'User not found.' });
      }
    } catch (error) {
      // If an error occurs, send a 500 status code
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });
  
  app.get('/user/getAll', async (req, res) => {
    try {
      // Find all users in the database
      const users = await User.find({}, '-__v'); // Exclude the version key from the output
  
      // Respond with the user data
      // Note: It's generally a bad practice to send password hashes to the client.
      // Consider excluding the password field in a real-world application.
      res.json(users);
    } catch (error) {
      // If an error occurs, send a 500 status code
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });
  