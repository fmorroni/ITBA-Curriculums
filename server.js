// Run with node server.js and ngrok http --host-header=rewrite 5000

import express from 'express'
import cors from 'cors'

const app = express()

app.disable('etag');
app.use(cors())
app.use(express.json())

app.get('/', (req, res, next) => {
  res.json({ msg: 'Working' })
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
