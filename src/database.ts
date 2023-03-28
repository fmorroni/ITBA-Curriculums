import { Sequelize, DataTypes, Model } from 'sequelize'
import db_config from '@/.database_config.js'

const sequelize = new Sequelize(db_config.name, db_config.user, db_config.pass, {
  ...db_config.options,
  define: {
    underscored: true,
  }
})

class Course extends Model {
  // can declare methods in here!!
}
Course.init({
  id: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  requiredCredits: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  level: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, { sequelize })

class Prerequisite extends Model {
  // can declare methods in here!!
}
Prerequisite.init({
  prerequisiteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Course,
      key: 'id',
    },
    primaryKey: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Course,
      key: 'id',
    },
    primaryKey: true,
  }
}, {
  sequelize,
  timestamps: false,
})

class CourseHistory extends Model {
  // can declare methods in here!!
}
CourseHistory.init({
  id: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Course,
      key: 'id',
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  first_semester_enrollment: {
    type: DataTypes.INTEGER
  },
  second_semester_enrollment: {
    type: DataTypes.INTEGER
  },
}, {
  sequelize,
  timestamps: false,
})

async function initialize() {
  try {
    await sequelize.authenticate()
    // Should be done with migrations
    await sequelize.sync({ alter: true })
    console.log('Database synchronized')
  } catch (err) {
    console.error(err)
  }
}

initialize()
