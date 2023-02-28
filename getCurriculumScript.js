// Get current curriculum structure and courses.
// Run from Académica -> Carreras -> `carrera X` -> `plan X`
const curriculumName = document.querySelector('body > div > div > div > h4 > span').textContent
const tables = Array.from(document.querySelectorAll('div.backgroundBordered > div > table'))

let prevCycle = ''
const coursesCatalog = {}
const curriculum = { name: curriculumName, orientations: [] }
const basicCycle = { years: [] }

function parseCourseData(courseRow) {
  const [, code, name] = courseRow.cells[0].textContent.match(/(\d{2}\.\d{2}) - (.*)/) || []
  if (code) {
    const credits = parseInt(courseRow.cells[1].textContent)
    const requiredCredits = parseInt(courseRow.cells[2].textContent)
    const correlatives = Array.from(courseRow.cells[3].querySelectorAll('span')).map(ele => ele.textContent.trim())
    return { code, name, credits, requiredCredits, correlatives }
  } else {
    return null
  }
}

function parseYears(table) {
  const years = []
  let prevYear = null, noCourses = true
  for (const row of table.tBodies[0].rows) {
    const headerMatch = row.querySelector('h4 > span')?.textContent.match(/.*(\d).*(\d)/)
    const [, year, semester] = headerMatch ? headerMatch.map(ele => parseInt(ele) - 1) : []
    if (year != null) {
      if (year !== prevYear) years.push({ semesters: [[], []] })
      prevYear = year

      const semesterTable = row.querySelector('tbody')
      for (const courseRow of semesterTable.rows) {
        const courseData = parseCourseData(courseRow)
        if (courseData) {
          years[years.length - 1].semesters[semester].push(courseData.code)
          coursesCatalog[courseData.code] = courseData
          noCourses = false
        }
      }
    }
  }

  // For ignoring tables that don't contain any necessary information.
  return noCourses ? null : years
}

function parseElectives(table) {
  const electives = []
  for (const courseRow of table.querySelectorAll('tbody')[1].rows) {
    const courseData = parseCourseData(courseRow)
    if (courseData) {
      electives.push(courseData.code)
      coursesCatalog[courseData.code] = courseData
    }
  }

  return electives
}

tables.forEach(table => {
  const tableHeader = table.tHead.textContent.replaceAll(/\n|\t/g, '').trim()
  if (/b[aá]sico/i.test(tableHeader)) {
    parseYears(table).forEach((year, idx) => basicCycle.years[idx] = year)
  } else if (!/electivas/i.test(tableHeader)) {
    const years = parseYears(table)
    if (years) {
      const extraDegree = tableHeader.match(/\((.*?)\)/)[1].trim()
      const newOrientation = {
        name: tableHeader.match(/(.*?)[(-]/)[1].trim(),
        extraDegree: /otorgado/i.test(extraDegree) ? extraDegree.match(/:(.*)/i)[1].trim() : null,
        years: [...basicCycle.years, ...years]
      }
      curriculum.orientations.push(newOrientation)
    }
  } else if (/electivas/i.test(tableHeader)) {
    const currentOrientation = curriculum.orientations[curriculum.orientations.length - 1]
    if (!currentOrientation.electives) currentOrientation.electives = []
    const [, name, requirement] = table.tHead.textContent.replaceAll(/\n|\t/g, '').trim().match(/(.*)-.*Requisito:(.*)/).map(ele => ele.trim())
    currentOrientation.electives.push({ name, requirement, courses: parseElectives(table) })
  } else {
    throw new Error('Page format not as expected')
  }
})

// Get extra info for all of the current curriculum courses.
function getCoursesPageUrl() {
  for (const ul of document.querySelectorAll('ul.dropdown-menu')) {
    for (const li of ul.children) {
      if (/cursos/i.test(li.textContent)) return li.querySelector('a').href
    }
  }
}

function getYearSortAnchor(form) {
  for (const anchor of form.querySelectorAll('th > a')) {
    if (/año/i.test(anchor.textContent)) return anchor
  }
}

const sortToggle = (url) => {
  return function() {
    const wcall = wicketAjaxGet(url)
    return !wcall
  }
}

function getHeaders(form) {
  const headers = {}
  Array.from(form.querySelectorAll('th span')).forEach((th, idx) => {
    const ogFieldName = th.textContent
    let fieldName = null
    if (/c[oó]d/i.test(ogFieldName)) fieldName = 'code'
    else if (/materia/i.test(ogFieldName)) fieldName = 'name'
    else if (/nivel/i.test(ogFieldName)) fieldName = 'level'
    else if (/departamento/i.test(ogFieldName)) fieldName = 'department'
    else if (/per.odo/i.test(ogFieldName)) fieldName = 'semester'
    else if (/año/i.test(ogFieldName)) fieldName = 'year'
    else if (/comienzo/i.test(ogFieldName)) fieldName = 'startDate'
    else if (/fin/i.test(ogFieldName)) fieldName = 'endDate'
    else if (/activo/i.test(ogFieldName)) fieldName = 'active'
    else if (/alumnos/i.test(ogFieldName)) fieldName = 'enrolledStudents'
    else if (/nominada/i.test(ogFieldName)) fieldName = 'nominated'
    else if (/nominada/i.test(ogFieldName)) fieldName = 'nominated'

    if (fieldName) headers[fieldName] = idx
  })
  return headers
}

function getFormRequestFields(form) {
  const formFieldsCode = form.querySelector('thead input').name.match(/toolbars:(\d+)/)[1]
  const formFields = {
    keys: {
      code: `results:topToolbars:toolbars:${formFieldsCode}:filters:1:filter:filter`,
      name: `results:topToolbars:toolbars:${formFieldsCode}:filters:2:filter:filter`,
      level: `results:topToolbars:toolbars:${formFieldsCode}:filters:3:filter:filter`,
      department: `results:topToolbars:toolbars:${formFieldsCode}:filters:4:filter:filter`,
      semester: `results:topToolbars:toolbars:${formFieldsCode}:filters:5:filter:filter`,
      year: `results:topToolbars:toolbars:${formFieldsCode}:filters:6:filter:filter`,
      active: `results:topToolbars:toolbars:${formFieldsCode}:filters:9:filter:filter`,
    },
    values: {
      level: {
        all: '',
        entranceCourse: '0',
        underGrad: '1',
        postGrad: '2',
        execEd: '3',
      },
      semester: {
        all: '',
        first: '0',
        second: '1',
        summer: '2',
        special: '3',
      },
      active: {
        on: 'on',
        off: '',
      },
    }
  }
  return formFields
}

async function courseInfo({ formRequestFields, formAction, code, name, level, department, semester, year, active }) {
  const body = new URLSearchParams()
  body.set(formRequestFields.keys.code, code || '')
  body.set(formRequestFields.keys.name, name || '')
  body.set(formRequestFields.keys.level, level || formRequestFields.values.level.all)
  body.set(formRequestFields.keys.department, department || '')
  body.set(formRequestFields.keys.semester, semester || formRequestFields.values.semester.all)
  body.set(formRequestFields.keys.year, year || '')
  body.set(formRequestFields.keys.active, active || formRequestFields.values.active.on)

  const res = await fetch(formAction, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: body.toString(),
  })
  const doc = new DOMParser().parseFromString(await res.text(), 'text/html')
  return { code, rows: doc.querySelector('table > tbody').rows }
}

function getHeaderInfo(courseDataRow, headerIdx) {
  return courseDataRow.cells[headerIdx].children[0].textContent
}

function translateSemester(semester) {
  let fieldName = 'unknown'
  if (/primer/i.test(semester)) fieldName = 'first'
  else if (/segundo/i.test(semester)) fieldName = 'second'
  else if (/verano/i.test(semester)) fieldName = 'summer'
  else if (/especial/i.test(semester)) fieldName = 'special'

  return fieldName
}

async function getExtraCourseInfo() {
  const res = await fetch(getCoursesPageUrl())
  const doc = new DOMParser().parseFromString(await res.text(), 'text/html')
  const form = doc.querySelector('form')
  form.action = form.getAttribute('action').replace('../', '')
  form.querySelectorAll('[href]').forEach(ele => {
    ele.href = ele.getAttribute('href').replace('../', '')
  })
  form.querySelectorAll('[src]').forEach(ele => {
    ele.src = ele.getAttribute('src').replace('../', '')
  })

  // If not added to the current DOM the sorting doesn't work for some reason.
  document.body.replaceChildren()
  document.body.appendChild(form)

  // Fix year sort ancor onclick
  let yearSortAnchor = getYearSortAnchor(form)
  const fixedYearSortUrl = yearSortAnchor.outerHTML.match(/onclick=.*?'\.\.\/(.*?)'/)[1]
  yearSortAnchor.onclick = sortToggle(fixedYearSortUrl)

  const yearSortEv = new Event('year-sort-desc-ready')

  function yearSortDesc(mutationList, observer) {
    // The whole html changes when a sort tag is clicked so any node we previously had is useless
    // and its new replacement needs to be found.
    yearSortAnchor = getYearSortAnchor(form)
    if (/down/i.test(yearSortAnchor.className)) {
      observer.disconnect()
      form.dispatchEvent(yearSortEv)
      return
    }
    else {
      yearSortAnchor.click()
    }
  }

  const observer = new MutationObserver(yearSortDesc)
  observer.observe(document.body, { attributes: true, childList: true, subtree: true })

  // To trigger mutation observer.
  yearSortAnchor.click()

  form.addEventListener('year-sort-desc-ready', async () => {
    const formRequestFields = getFormRequestFields(form)
    const codes = Object.keys(coursesCatalog), proms = [], batchSize = 20
    while (codes.length) {
      for (let i = 0; i < batchSize && codes.length; ++i) {
        proms.push(courseInfo({
          formRequestFields,
          formAction: form.action,
          code: codes.pop(),
          level: formRequestFields.values.level.underGrad
        }))
      }
      const headers = getHeaders(form)
      console.log('Awaiting batch')
      const batchCourseData = await Promise.all(proms)
      batchCourseData.forEach(({ code, rows }) => {
        const course = { history: null }
        if (rows.length > 0) {
          course.department = getHeaderInfo(rows[0], headers.department)
          course.level = getHeaderInfo(rows[0], headers.level)
          course.history = []
          const yearHistoryLimit = 4
          for (let r = 0, yearCount = 0, prevYear = null; r < rows.length && yearCount < yearHistoryLimit; ++r) {
            const row = rows[r]
            const year = getHeaderInfo(row, headers.year)
            if (year !== prevYear) {
              course.history.push({ year, semesters: { first: null, second: null } })
              prevYear = year
            }
            const semester = translateSemester(getHeaderInfo(row, headers.semester))
            course.history[course.history.length - 1].semesters[semester] = parseInt(getHeaderInfo(row, headers.enrolledStudents))
            const nextYear = rows[r + 1] ? getHeaderInfo(rows[r + 1], headers.year) : null
            if (year !== nextYear) ++yearCount
          }
        }
        Object.assign(coursesCatalog[code], course)
      })
      console.log('Batch done')
    }
    console.log('DONE')
  })
}

getExtraCourseInfo()
