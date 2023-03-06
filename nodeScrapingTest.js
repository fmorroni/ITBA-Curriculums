import { JSDOM } from 'jsdom'
import sga_credentials from './.sga_credentials.js'

const baseUrl = 'https://sga.itba.edu.ar/app2/'
async function login() {
  try {
    const loginPageRes = await fetch(baseUrl)
    
    const loginPageHtml = await loginPageRes.text()
    const path = loginPageHtml.match(/action="(?:\.\.\/)*(.*?)"/)[1]
    const id = loginPageHtml.match(/input.*?id="(id[0-9a-zA-Z]+_[0-9a-zA-Z]{2,}_[0-9a-zA-Z]{1,})"/)[1]

    const body = new URLSearchParams()
    body.set(id, '')
    body.set('user', sga_credentials.user)
    body.set('password', sga_credentials.password)
    body.set('js', '1')
    body.set('login', 'Ingresar')

    const postCredentialsRes = await fetch(baseUrl + path, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: body.toString(),
    })
    const postCredentialsHtml = await postCredentialsRes.text()
    console.log(postCredentialsHtml)

    return new JSDOM(postCredentialsHtml).window.document
  } catch (err) {
    console.log(err)
  }
}

login()
.then(doc => console.log(doc.body))
.catch(err => console.log(err))
