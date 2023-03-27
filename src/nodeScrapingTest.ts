import { JSDOM } from 'jsdom'
import { myFetch, getBaseUrl } from './utils.js'
import sga_credentials from './.sga_credentials.js'

const cookies: CookieMap = new Map()

async function login(): Promise<Response> {
  let baseUrl = 'https://sga.itba.edu.ar/app2/'
  try {
    const loginPageRes = await myFetch(baseUrl, { cookies })

    baseUrl = getBaseUrl(loginPageRes)

    const loginPageHtml = await loginPageRes.text()

    const path = loginPageHtml.match(/action="(.*?)"/)[1]
    const id = loginPageHtml.match(/input.*?id="(id[0-9a-zA-Z]+_[0-9a-zA-Z]{2,}_[0-9a-zA-Z]{1,})"/)[1]

    const body = new URLSearchParams()
    body.set(id, '')
    body.set('user', sga_credentials.user)
    body.set('password', sga_credentials.password)
    body.set('js', '1')
    body.set('login', 'Ingresar')

    const homePageRes = await myFetch(baseUrl + path, {
      config: {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      },
      cookies
    })

    return homePageRes
  } catch (err) {
    throw new Error(err)
  }
}

function getCareersUrl(baseUrl, homePageHtml) {
  const careersUrl = baseUrl + homePageHtml.match(/<a href="(.*?)">\n?\s*<span>Carreras/)[1]

  return careersUrl
}

function getCoursesUrl(baseUrl, homePageHtml) {
  const coursesUrl = baseUrl + homePageHtml.match(/<a href="(.*?)">\n?\s*<span>Cursos/)[1]

  return coursesUrl
}

async function parseCareers(careersUrl) {
  const careersPageRes = await myFetch(careersUrl, { cookies })
  const { document } = new JSDOM(await careersPageRes.text(), { url: getBaseUrl(careersPageRes) }).window;

  const careers = []
  Array.from(document.querySelector('tbody').rows).forEach(row => careers.push({
    code: row.cells[0].querySelector('span').textContent,
    name: row.cells[1].querySelector('span').textContent,
    url: row.cells[5].querySelector('a').href,
    curriculums: [],
  }))

  for (const career of careers) {
    console.log('Parsing ' + career.name)
    const careerPageRes = await myFetch(career.url, { cookies })

    const { document } = new JSDOM(await careerPageRes.text(), { url: getBaseUrl(careerPageRes) }).window;
    Array.from(document.querySelector('tbody').rows).forEach(row => career.curriculums.push({
      name: row.cells[0].querySelector('span').textContent,
      activeSince: row.cells[2].querySelector('span').textContent,
      activeUntil: row.cells[3].querySelector('span').textContent,
      url: row.cells[4].querySelector('a').href
    }))
  }

  return careers
}

async function parseCourses(coursesUrl) {
  const courses = new Map()
  const getCellText = (cell) => cell.querySelector('span').textContent
  const parser = new DOMParser()

  function parseCourses(page) {
    Array.from(page.querySelector('tbody').rows).forEach(row => {
      const code = getCellText(row.cells[0])
      const name = getCellText(row.cells[1])
      const dept = getCellText(row.cells[3])
      const term = getCellText(row.cells[4])
      const year = getCellText(row.cells[5])
      const enrolled = getCellText(row.cells[9])

      if (!courses.has(code)) {
        courses.set(code, {
          name,
          dept,
          history: [{ year, term, enrolled }]
        })
      } else {
        courses.get(code).history.push({ year, term, enrolled })
      }
    })
  }

  function getNextPage(page) {
    const next = page.querySelector('a.next')?.href
    return next
      ? fetch(next).then(res => res.text()).then(res => parser.parseFromString(res, 'text/html'))
      : null
  }

  // No sirve xq necesito ya tener cargada la página anterior para conseguir el nuevo next url.
  // function batchParse(batchSize) {
  //   const proms = []
  //   for (let i = 0; i < batchSize; ++i) {
  //     proms.push(getNextPage())
  //   }

  //   return Promise.all(proms)
  // }

  async function parseAllPages() {
    let page = document, i = 1
    while (page) {
      console.log('Parsing: ' + i++)
      parseCourses(page)
      page = await getNextPage(page)
    }
    console.log('Done')
  }
}

async function scrape() {
  console.log('Scraping')
  const homePageRes = await login()
  const homePageHtml = await homePageRes.text()
  const homePageBaseUrl = getBaseUrl(homePageRes)

  console.log(await parseCareers(getCareersUrl(homePageBaseUrl, homePageHtml)))
  console.log('Done')
}

scrape()
