const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Event = require('../models/createevent');
require('dotenv').config();

const router = express.Router();

// 🔹 Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 🔹 Multer Storage Setup (Uploads Directly to Cloudinary)
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'events',  // Folder name in Cloudinary
        format: async (req, file) => 'png', // Convert all images to PNG
        public_id: (req, file) => Date.now() + '-' + file.originalname
    }
});

const upload = multer({ storage });

// 🔹 POST Route for Adding Event
router.post('/add-event', upload.single('image'), async (req, res) => {
    try {
        const { 
            title, 
            description, 
            date, 
            location, 
            time, 
            eventctg, 
            language, 
            duration, 
            agelimit, 
            price 
        } = req.body;

        const imageUrl = req.file ? req.file.path : null;

        // Creating the event object
        const newEvent = new Event({
            title,
            description,
            date,
            location,
            time,
            eventctg,
            language,
            duration,
            agelimit,
            price,
            image: imageUrl // Cloudinary image URL
        });

        // Save to the database
        await newEvent.save();
        res.status(201).json({ message: 'Event added successfully!', imageUrl });
    } catch (error) {
        console.error('Error while adding event:', error.message);
        res.status(500).json({ error: 'Failed to add event' });
    }
});

module.exports = router;
