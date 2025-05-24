//---------------------------------------Requiring Express-------------------------------------------------
const express = require('express');
const app = express();
const passport = require('passport');
const session = require("express-session");
require('dotenv').config();
require('./config/passport');
const authRoutes = require('./routes/auth');
const multer = require('multer');
const mongoose = require('mongoose');
const cors = require("cors");
const User = require("./models/User"); // Ensure correct case

//---------------------------------------NodeMailer Setup-------------------------------------------------
const nodemailer = require("nodemailer");

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail", // You can use any email service provider
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your email app password
    },
});

// Function to send confirmation email
const sendConfirmationEmail = async (email, name, eventName) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER, // Your sender email
            to: email,
            subject: `You're Registered for ${eventName}! 🎉`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
                        <h2 style="color: #4CAF50; text-align: center;">🎉 Registration Confirmed!</h2>
                        <p style="font-size: 16px;">Dear <strong>${name}</strong>,</p>
                        <p style="font-size: 16px;">We are thrilled to confirm your registration for <strong>${eventName}</strong>! 🥳</p>
                        <p style="font-size: 16px;">Get ready for an exciting experience! We can't wait to see you there.</p>
                        <p style="font-size: 16px;">Stay tuned for further updates and event details.</p>
                        <br />
                        <p style="font-size: 16px;">Warm regards,</p>
                        <p style="font-size: 16px; font-weight: bold;">The BeingHR Team</p>
                        <p style="font-size: 14px; color: #777777; text-align: center;">If you have any questions, feel free to contact us.</p>
                    </div>
                </div>
            `,
        });
        console.log(`Confirmation email sent to ${email}`);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};


//---------------------------------------Connect to MongoDB-------------------------------------------------
async function main() {
    await mongoose.connect(process.env.MONGO_URL)
}
main().then(() => { console.log('Connection Successful.........') }).catch(err => console.log(err));

//---------------------------------------Requiring Models---------------------------------------------------
const contactForm = require('./models/contactForm.js');
const eventRegForm = require('./models/eventRegForm.js');
const createEvent = require("./models/createevent.js");

//---------------------------------------Middleware--------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Middleware (Should be before session)
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

// Session Middleware
app.use(
    session({
        secret: process.env.COOKIE_KEY || "your_secret_key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // Set to true in production (HTTPS required)
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/uploads', express.static('uploads')); // Serve uploaded images

//---------------------------------------Routers--------------------------------------------------------------
const eventRoutes = require('./routes/eventRoutes.js');
app.use('/api/events', eventRoutes);

//-------------------------------------Contact Form Route----------------------------------------------
app.post("/form", async (req, res) => {
    try {
        let { name, email, phone, message } = req.body;
        let form = new contactForm({ name, email, phone, message });
        await form.save();
        res.json({ success: true, message: "Form submitted successfully!" });
    } catch (err) {
        console.error("Error saving form:", err);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

app.get("/form", async (req, res) => {
    try {
        let userQuery = await contactForm.find();
        res.json(userQuery);
    } catch (error) {
        console.error("Error fetching registrations:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

//-------------------------------------Event Registration Form Route----------------------------------------------
app.post("/eventregistration", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const { name, email, phone, age, eventName, eventId } = req.body;

        // Check if the user has already registered for this event
        const existingRegistration = await eventRegForm.findOne({ email, eventName });
        if (existingRegistration) {
            return res.status(400).json({ success: false, message: "You have already registered for this event." });
        }

        // Save registration
        let eventReg = new eventRegForm({ name, eventName, email, phone, age });
        await eventReg.save();

        // Add event to user's registeredEvents array
        const user = await User.findById(req.user._id);
        if (!user.registeredEvents.includes(eventId)) {
            user.registeredEvents.push(eventId);
            await user.save();
        }

        // Send confirmation email
        await sendConfirmationEmail(email, name, eventName);

        res.json({ success: true, message: "Registered for the event successfully!" });

    } catch (err) {
        console.error("Error in registration:", err);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});



app.get("/eventregistration", async (req, res) => {
    try {
        let registrationDetails = await eventRegForm.find();
        res.json(registrationDetails);
    } catch (error) {
        console.error("Error fetching registrations:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

//--------------------------------------Event Details Route----------------------------------------------------------------
app.get("/eventdetails", async (req, res) => {
    try {
        const eventData = await createEvent.find();
        if (!eventData || eventData.length === 0) {
            return res.status(404).json({ success: false, message: "No events found." });
        }
        res.status(200).json({ success: true, data: eventData });
    } catch (error) {
        console.error("Error fetching event details:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
});

//--------------------------------------Event Details Show Route----------------------------------------------------------------
app.get("/eventdetails/:id", async (req, res) => {
    try {
        const event = await createEvent.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        res.json({
            ...event._doc,
            upcoming: event.upcoming || { cta: "Register Now", date: "TBA", location: "Online" },
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

//--------------------------------------User Details Show Route----------------------------------------------------------------
app.get("/users", async (req, res) => {
    try {
      const users = await User.find({});
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

//--------------------------------------Get Logged-in User----------------------------------------------------------------
app.get("/user", (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    res.status(200).json(req.user);
});


//--------------------------------------Register User for Event----------------------------------------------------------------
app.post("/register-event", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const { eventId } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.registeredEvents.includes(eventId)) {
            user.registeredEvents.push(eventId);
            await user.save();
            return res.json({ success: true, message: "Event registered successfully!" });
        }

        res.json({ success: false, message: "Already registered for this event." });
    } catch (error) {
        console.error("Error registering event:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

//--------------------------------------Check Admin----------------------------------------------------------------
app.get("/check-admin",async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      res.json({ isAdmin: user?.isAdmin || false });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });


//--------------------------------------auth status----------------------------------------------------------------
  app.get("/auth-status", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ isAuthenticated: true });
    } else {
      res.json({ isAuthenticated: false });
    }
  });
//--------------------------------------Listening Port----------------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`App is listening on PORT ${PORT}...`);
});