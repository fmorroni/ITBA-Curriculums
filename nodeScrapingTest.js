import { JSDOM } from 'jsdom'
import sga_credentials from './.sga_credentials.js'
import { myFetch, getCookies, parseCookies } from './utils.js'

let baseUrl = 'https://sga.itba.edu.ar/app2/'
async function login() {
  try {
    const headers = new Headers()
    headers.append('cookie', 'hola=chau')
    headers.append('cookie', 'jorge=pedro')
    headers.append('cookie', 'ricardo=martin')
    const loginPageRes = await myFetch('http://localhost:5000', {method: 'POST', headers})
    // console.log(loginPageRes)
    // window.history.pushState(null, '', loginPageRes.url.replace(/;jsession.*$/, ''))
    // baseUrl = loginPageRes.url.replace(/;jsession.*$/, '')
    //
    // const loginPageHtml = await loginPageRes.text()
    //
    // const path = loginPageHtml.match(/action="(?:\.\.\/)*(.*?)(?:;jsessionid.*?)?"/)[1]
    // const id = loginPageHtml.match(/input.*?id="(id[0-9a-zA-Z]+_[0-9a-zA-Z]{2,}_[0-9a-zA-Z]{1,})"/)[1]
    //
    // const headers = new Headers()
    // const cookies = getCookies(loginPageRes)
    // cookies.forEach(cookie => headers.append('cookie', `${cookie.name}=${cookie.value}`))
    // headers.set('content-type', 'application/x-www-form-urlencoded')
    //
    // const body = new URLSearchParams()
    // body.set(id, '')
    // body.set('user', sga_credentials.user)
    // body.set('password', sga_credentials.password)
    // body.set('js', '1')
    // body.set('login', 'Ingresar')
    //
    // const postCredentialsRes = await fetch( baseUrl + path, {
    //   method: 'POST',
    //   headers,
    //   body: body.toString(),
    // })
    // // window.history.pushState(null, '', postCredentialsRes.url.replace(/;jsession.*$/, ''))
    //
    // const postCredentialsHtml = await postCredentialsRes.text()
    //
    // // return new DOMParser().parseFromString(postCredentialsHtml, 'text/html')
    // return postCredentialsHtml
  } catch (err) {
    throw new Error(err)
  }
}

async function prepSite() {
  const doc = await login()

  console.log(doc)
}

prepSite()
