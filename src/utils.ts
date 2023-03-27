export function getRawCookies(response: Response): string[] {
  const jsessionidCookie = response.url.match(/;jsessionid=([^;]*)/)
  const rawCookies = response.headers.get('set-cookie').split(/, ?(?=[^;]*?=[^;]*?)/)
  if (jsessionidCookie) rawCookies.push(`JSESSIONID=${jsessionidCookie[1]}`)
  return rawCookies
}

export function parseCookies(rawCookies: string[], targetMap?: CookieMap): CookieMap {
  const parsedCookies: CookieMap = targetMap || new Map()
  rawCookies.forEach(cookie => {
    const cookieFileds = cookie.replace(/;$/, '').split(/; ?/)
    const [name, value] = cookieFileds.shift().split('=')
    const newCookie: Cookie = { name, value }
    cookieFileds.forEach(field => {
      const [key, value] = field.split('=')
      newCookie[key] = value || true
    })
    parsedCookies.set(name, newCookie)
  })
  return parsedCookies
}

export function getCookies(response: Response, targetMap?: CookieMap): CookieMap {
  return parseCookies(getRawCookies(response), targetMap)
}

function setCookieHeader(headers: Headers, cookies: CookieMap): void {
  headers.delete('cookie')
  let cookieString = ''
  cookies.forEach(cookie => cookieString += `${cookie.name}=${cookie.value}; `)
  cookieString.replace(/; $/, '')
  headers.set('cookie', cookieString)
}

interface MyFetchOptions {
  config?: RequestInit & { maxRedirects?: number },
  cookies?: CookieMap,
}

export async function myFetch(url: string, { config = {}, cookies = new Map() }: MyFetchOptions): Promise<Response> {
  const parsedConfig: Omit<RequestInit, 'headers'> & { headers: Headers, maxRedirects: number } = { 
    headers: new Headers(config.headers),
    maxRedirects: config.maxRedirects || 10,
  }

  if (parsedConfig.headers.has('cookie')) {
    parseCookies(parsedConfig.headers.get('cookie').split(/, ?/), cookies)
  }
  setCookieHeader(parsedConfig.headers, cookies)
  if (!parsedConfig.headers.has('user-agent')) {
    parsedConfig.headers.set('user-agent', 'mozilla/5.0 (x11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36')
  }

  let res: Response
  let redirect = true
  let redirectCount = 0
  while (redirect && redirectCount <= parsedConfig.maxRedirects) {
    res = await fetch(url, { ...parsedConfig, redirect: 'manual' })
    url = res.headers.get('location')
    getCookies(res, cookies)
    setCookieHeader(parsedConfig.headers, cookies)

    ++redirectCount
    redirect = res.status === 302
  }
  if (redirect && redirectCount > parsedConfig.maxRedirects) throw new Error("Max redirect count on myFetch() reached.")

  return res
}

// Returns the response url without a potential jsessionid and the last parameter as that one
// represents the resource and is not part of the base url.
export function getBaseUrl(response: Response): string {
  return response.url.replace(/([^/]+)(;jsession.*)?$/, '')
}
