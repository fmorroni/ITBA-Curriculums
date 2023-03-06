export function getCookies(response) {
  const jsessionidCookie = response.url.match(/;(jsessionid=[^;]*)/)
  const cookies = response.headers.get('set-cookie').split(/, ?(?=[^;]*?=[^;]*?)/)
  if (jsessionidCookie) cookies.push(jsessionidCookie[1])
  return cookies
}

export function parseCookies(cookies) {
  const parsedCookies = []
  cookies.forEach(cookie => {
    const cookieFileds = cookie.split(/; ?/)
    const [name, value] = cookieFileds.shift().split('=')
    const newCookie = { name, value }
    cookieFileds.forEach(field => {
      const [key, value] = field.split('=')
      newCookie[key] = value || true
    })
    parsedCookies.push(newCookie)
  })
  return parsedCookies
}
