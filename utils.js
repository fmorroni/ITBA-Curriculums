export function getRawCookies(response) {
  const jsessionidCookie = response.url.match(/;jsessionid=([^;]*)/)
  const cookies = response.headers.get('set-cookie').split(/, ?(?=[^;]*?=[^;]*?)/)
  if (jsessionidCookie) cookies.push(`JSESSIONID=${jsessionidCookie[1]}`)
  return cookies
}

export function parseCookies(cookies, { targetMap } = {}) {
  const parsedCookies = targetMap || new Map()
  cookies.forEach(cookie => {
    const cookieFileds = cookie.replace(/;$/, '').split(/; ?/)
    const [name, value] = cookieFileds.shift().split('=')
    const newCookie = { name, value }
    cookieFileds.forEach(field => {
      const [key, value] = field.split('=')
      newCookie[key] = value || true
    })
    parsedCookies.set(name, newCookie)
  })
  return parsedCookies
}

export function getCookies(response, { targetMap }) {
  return parseCookies(getRawCookies(response), { targetMap })
}

function setCookieHeader(headers, cookies) {
  headers.delete('cookie')
  let cookieString = ''
  cookies.forEach(cookie => cookieString += `${cookie.name}=${cookie.value}; `)
  cookieString.replace(/; $/, '')
  headers.set('cookie', cookieString)
}

export async function myFetch(url, { config = {}, cookies } = {}) {
  if (!(config.headers instanceof Headers)) {
    const headers = new Headers()
    if (config.headers) {
      for (const key in config.headers) headers.set(key, config.headers[key])
    }
    config.headers = headers
  }
  if (!cookies) cookies = new Map()
  if (config.headers.has('cookie')) {
    parseCookies(config.headers.get('cookie').split(/, ?/), { targetMap: cookies })
  }
  setCookieHeader(config.headers, cookies)

  const maxRedirects = 10
  let res, redirect = true, redirectCount = 0
  while (redirect && redirectCount <= maxRedirects) {
    res = await fetch(url, { ...config, redirect: 'manual' })
    url = res.headers.get('location')
    getCookies(res, { targetMap: cookies })
    setCookieHeader(config.headers, cookies)

    ++redirectCount
    redirect = res.status === 302
  }
  if (redirect && redirectCount > maxRedirects) throw new Error("Max redirect count on myFetch() reached.")

  return res
}
