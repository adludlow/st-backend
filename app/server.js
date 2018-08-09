const express = require('express');

const app = express();

app.get('/health', (req, res) => {
    req.send('OK');
});

app.listen(3000, () => console.log('Server started.'));

module.exports.app = app;
