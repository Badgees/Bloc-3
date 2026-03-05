require('dotenv').config()
const express = require('express')
const path = require('path')
const server = require('./server')


const app = express()

const baseUrl = process.env.BASE_URL || ''

app.use(`${baseUrl}/`, server)

app.get(`${baseUrl}/*`, (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});
app.listen(3000, () => {
    console.info('server démarré')
})