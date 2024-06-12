const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendNotification = functions.https.onRequest(async (req, res) => {
    const { token, title, body } = req.body;

    const message = {
        notification: {
            title: title,
            body: body,
        },
        token: token,
    };

    try {
        await admin.messaging().send(message);
        res.status(200).send('Notification sent successfully');
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).send('Error sending notification');
    }
});
