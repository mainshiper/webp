const functions = require('firebase-functions');
const express = require('express');
const app = require('./app'); // app.js 파일을 불러옵니다

exports.app = functions.https.onRequest(app);
