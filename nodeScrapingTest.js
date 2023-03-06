import { JSDOM } from 'jsdom'
import sga_credentials from './.sga_credentials.js'

const baseUrl = 'https://sga.itba.edu.ar/app2/'
async function login() {
  try {
    const loginPageRes = await fetch(baseUrl, {omit: true})

    const loginPageHtml = await loginPageRes.text()
    const doc = new DOMParser().parseFromString(loginPageHtml, 'text/html')
    const base = document.createElement('base')
    base.href = baseUrl + 'asdf/asdf/asdf/'
    doc.head.insertBefore(base, doc.head.children[0])

    const root = document.querySelector('html')
    root.replaceChildren()
    root.appendChild(doc.head)
    root.appendChild(doc.body)

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

    return new DOMParser().parseFromString(postCredentialsHtml, 'text/html')
  } catch (err) {
    console.log(err)
  }
}

async function prepSite() {
  const doc = await login()
  const base = document.createElement('base')
  base.href = baseUrl
  doc.head.insertBefore(base, doc.head.children[0])
  
  const root = document.querySelector('html')
  root.replaceChildren()
  root.appendChild(doc.head)
  root.appendChild(doc.body)
  console.log('asdf')
}

prepSite()
