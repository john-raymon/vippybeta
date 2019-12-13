import superagentPromise from "superagent-promise";
import _superagent from "superagent";
import localforage from "localforage";

const superagent = superagentPromise(_superagent, global.Promise);

export class Agent {
  constructor(token = null, API_ROOT = "/") {
    this.token = token;
    this.API_ROOT = API_ROOT;
    this._tokenPlugin = this._tokenPlugin.bind(this);
  }

  async _initToken() {
    this.token = await localforage.getItem("jwt");
    // debugger;
    return this.token;
  }

  _tokenPlugin(req) {
    req.set("authorization", `Token ${this.token || ""}`);
    return req;
  }

  setToken(token) {
    this.token = token;
  }

  _responseBody(res) {
    return res.body;
  }

  async _del(url) {
    await this._initToken();
    return superagent
      .del(`${this.API_ROOT}${url}`)
      .use(this._tokenPlugin)
      .then(this._responseBody);
  }

  async _get(url, fullPath = false) {
    const returnedToken = await this._initToken();
    console.log("the token is!! -->", this.token);
    // debugger;
    return superagent
      .get(fullPath ? url : `${this.API_ROOT}${url}`)
      .use(this._tokenPlugin)
      .then(this._responseBody);
  }

  async _patch(url, body) {
    await this._initToken();
    return superagent
      .patch(`${this.API_ROOT}${url}`, body)
      .use(this._tokenPlugin)
      .then(this._responseBody);
  }

  async _post(url, body) {
    const returnedToken = await this._initToken();
    return superagent
      .post(`${this.API_ROOT}${url}`, body)
      .use(this._tokenPlugin)
      .then(this._responseBody);
  }

  async postImages(url, files, imagesProp) {
    await this._initToken();
    return superagent
      .post(`${this.API_ROOT}${url}`)
      .use(this._tokenPlugin)
      .attach(imagesProp, files)
      .then(this._responseBody);
  }

  authLogin(email, password, loginEndpoint) {
    return this._post(loginEndpoint, { email, password });
  } // move to UserEndpointAgent
}

export class UserEndpointAgent extends Agent {
  constructor(token = null, API_ROOT = "/") {
    super(token, API_ROOT);
  }

  sendOnBoardCode(phoneNumber, email) {
    return this._get(
      `api/phone/send-onboard-code?phonenumber=${phoneNumber}&email=${encodeURIComponent(
        email
      )}`
    ).catch(error => {
      throw error.response.body;
    });
  }

  login(body) {
    return this._post(`api/user/login`, body).catch(error => {
      throw error.response;
    });
  }

  create(body) {
    return this._post(`api/user`, body).catch(error => {
      throw error.response.body;
    });
  }

  getAllReservations() {
    return this._get("api/reservation").catch(error => {
      throw error.response;
    });
  }
}

// Venue Endpoint Agent
export class VenueEndpointAgent extends Agent {
  constructor(token = null, API_ROOT = "/api/host") {
    super(token, API_ROOT);
  }

  create(body) {
    return this._post("/", body).catch(error => {
      throw error.response.body;
    });
  }

  login(body) {
    return this._post(`/login`, body).catch(error => {
      throw error.response.body;
    });
  }

  getStripeoAuthUrl() {
    return this._post("/stripe/auth").catch(error => {
      throw error.response.body;
    });
  }

  completeStripeFlow(path) {
    return this._get(path, true).catch(error => {
      throw error.response.body;
    });
  }
}
