export function getRawCookies(response) {
  const jsessionidCookie = response.url.match(/;jsessionid=([^;]*)/)
  const cookies = response.headers.get('set-cookie').split(/, ?(?=[^;]*?=[^;]*?)/)
  if (jsessionidCookie) cookies.push(`JSESSIONID=${jsessionidCookie[1]}`)
  return cookies
}

export function parseCookies(cookies) {
  const parsedCookies = new Map()
  cookies.forEach(cookie => {
    const cookieFileds = cookie.split(/; ?/)
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

export function getCookies(response) {
  return parseCookies(getRawCookies(response))
}

export async function myFetch(url, config) {
  if (!(config.headers instanceof Headers)) {
    console.log('Not Headers class')
    const headers = new Headers()
    if (config.headers) {
      for (const key in config.headers) headers.set(key, config.headers[key])
    }
    config.headers = headers
  }
  console.log(config.headers)

  const maxRedirects = 2 
  let res, redirect = true, redirectCount = 0, cookies = parseCookies(config.headers.get('cookie').split(/; ?/))
  while (redirect && redirectCount <= maxRedirects) {
    res = await fetch(url, { ...config, redirect: 'manual' })
    getCookies(res).forEach(cookie => cookies.set(cookie.name, cookie))
    config.headers.delete('cookie')
    cookies.forEach(cookie => config.headers.append('cookie', `${cookie.name}=${cookie.value}`))

    ++redirectCount
    redirect = true //(res.status === 302)
  }
  if (redirect && redirectCount > maxRedirects) throw new Error("Max redirect count on myFetch() reached.")

  return res
}
