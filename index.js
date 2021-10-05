require('dotenv').config();

const express = require('express');
const router = require('./app/router');
const SmsConsumer = require('./app/Consumer/SmsConsumer');

const app = express();
const port = process.env.PORT || 5000;

/**
 * Here we used the SmsConsumer like a middleware
 */
app.use(SmsConsumer.execute);

/**
 * road in router if we need some actions
 */
app.use('/api', router);

app.listen(port, () => console.log(`app on http://localhost:${port}`));