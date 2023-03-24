// import { JSDOM } from 'jsdom'
import { myFetch } from './utils.js'
import sga_credentials from './.sga_credentials.js'

let baseUrl = 'https://sga.itba.edu.ar/app2/'
async function login() {
  console.log('Parsing')
  try {
    const cookies = new Map()
    const loginPageRes = await myFetch(baseUrl, { cookies })

    // window.history.pushState(null, '', loginPageRes.url.replace(/;jsession.*$/, ''))
    baseUrl = loginPageRes.url.replace(/([^/]+)(;jsession.*)?$/, '')

    const loginPageHtml = await loginPageRes.text()

    const path = loginPageHtml.match(/action="(.*?)"/)[1]
    const id = loginPageHtml.match(/input.*?id="(id[0-9a-zA-Z]+_[0-9a-zA-Z]{2,}_[0-9a-zA-Z]{1,})"/)[1]

    const body = new URLSearchParams()
    body.set(id, '')
    body.set('user', sga_credentials.user)
    body.set('password', sga_credentials.password)
    body.set('js', '1')
    body.set('login', 'Ingresar')

    const postCredentialsRes = await myFetch( baseUrl + path, {
    config: {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      },
      body: body.toString(),
    },
    cookies
    })
    // window.history.pushState(null, '', postCredentialsRes.url.replace(/;jsession.*$/, ''))

    // const postCredentialsHtml = await postCredentialsRes.text()

    // return new DOMParser().parseFromString(postCredentialsHtml, 'text/html')
    // return postCredentialsHtml
    return postCredentialsRes
  } catch (err) {
    throw new Error(err)
  }
}

async function prepSite() {
  const homePageRes = await login()
  console.log(homePageRes.body)
  homePageRes.body.on('data', (a,b,c) => console.log(a,b,c))
}

prepSite()
