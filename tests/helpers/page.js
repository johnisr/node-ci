const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class Page {
  constructor(page, browser) {
    this.page = page;
    this.browser = browser;
    this.userId = '';
  }
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    })

    const puppeteerPage = await browser.newPage();
    const page = new Page(puppeteerPage, browser);
    
    return new Proxy(page, {
      get: function(target, property) {
        return page[property]
        || browser[property]
        || puppeteerPage[property];
      }
    })
  }
  async login () {
    this.user = await userFactory.createUser();
    const { session, sig } = sessionFactory(this.user);
    
    await this.page.setCookie({ name: 'session', value: session });
    await this.page.setCookie({ name: 'session.sig', value: sig });
    await this.page.goto('http://localhost:3000/blogs');
    await this.page.waitFor('a[href="/auth/logout"]');
  }
  async close() {
    if (this.user) await userFactory.deleteUser(this.user._id);
    await this.browser.close();
  }
  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }
  get(path) {
    return this.page.evaluate((_path) => {
      return fetch(_path, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json())
    }, path)
  }
  post(path, data) {
    return this.page.evaluate((_path, _data) => {
      return fetch(_path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(_data)
      }).then(res => res.json())
    }, path, data);
  }
  execRequests(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => {
        return this[method](path, data);
      })
    );
  }
}

module.exports = Page;