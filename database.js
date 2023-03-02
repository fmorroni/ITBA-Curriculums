import { Sequelize } from 'sequelize'
import db_config from './.database_config.js'

const sequelize = new Sequelize(db_config.name, db_config.user, db_config.pass, db_config.options)

sequelize.authenticate()
  .then(() => {
    console.log('Authenticated')
  })
  .catch(error => console.error('Authentication error: ', error))
