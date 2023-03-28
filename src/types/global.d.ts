import { type Options } from 'sequelize'

export { };

declare global {
  interface Cookie {
    name: string,
    value: string,
    [key: string]: string | boolean,
  }

  type CookieMap = Map<string, Cookie>

  interface SgaCredentials {
    user: string,
    password: string,
  }

  interface DatabaseConfig {
    name: string,
    user: string,
    pass: string,
    options: Options,
  }
}
