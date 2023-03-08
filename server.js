// Run with node server.js and ngrok http --host-header=rewrite 5000

import express from 'express'
import cors from 'cors'

const app = express()

app.disable('etag');
app.use(cors())
app.use(express.json())

app.get('/', (req, res, next) => {
  console.log('req headers: ', req.headers)
  console.log('res headers: ', res.headers)
  res.json({ headers: req.headers })
})
app.post('/', (req, res, next) => {
  console.log('req headers: ', req.headers)
  // Wrong cookie format. FIX!
  res.setHeader('set-cookie', 'carlos=roberto; SameSite=None; Secure, hola=asdf;').json({ headers: req.headers })
})

// app.options('*', cors())
// app.options('/curriculum', (req, res) => {
//   res.status(200).end()
// })
app.post('/curriculum', (req, res) => {
  console.log('Post request body: ', req.body)
  res.json({ status: 200 })
})

app.listen(5000, async () => {
  console.log('CORS-enabled web server listening on port 5000')
})
