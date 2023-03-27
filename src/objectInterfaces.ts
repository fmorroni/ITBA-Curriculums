// Courses
interface Course {
  code: string,
  name: string,
  credits: number,
  requiredCredits: number,
  correlatives: string[],
  history: HistoryYear[],
  department: string,
  level: string,
}

interface HistoryYear {
  year: number,
  semesterEnrrolment: {
    first: number | null,
    second: number | null
  }
}

// Curriculums
interface Curriculum {
  name: string,
  orientations: []
}

interface Orientation {
  name: string,
  extraDegree: string,
  years: OrientationYear[],
  electives: OrientationElectives[],
}

interface OrientationYear {
  semester: {
    first: String[],
    second: String[],
  }
}

interface OrientationElectives {
  name: string,
  requirement: string,
  courses: String[],
}
