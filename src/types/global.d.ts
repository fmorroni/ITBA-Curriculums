export { };

declare global {
  interface Cookie {
    name: string,
    value: string,
    [key: string]: string | boolean,
  }

  type CookieMap = Map<string, Cookie>
}
