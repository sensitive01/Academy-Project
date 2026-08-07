const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

const createInAppNotification = async ({ recipient, sender, type, title, message, link, entityId }) => {
    try {
        const notification = await Notification.create({
            recipient,
            sender,
            type,
            title,
            message,
            link,
            entityId
        });
        return notification;
    } catch (error) {
        console.error('Failed to create in-app notification:', error);
    }
};

const sendEmailNotification = async ({ to, subject, html, text }) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
            text,
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Failed to send email:', error);
    }
};

module.exports = {
    createInAppNotification,
    sendEmailNotification
};
