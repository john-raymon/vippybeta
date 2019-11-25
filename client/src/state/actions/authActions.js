import localforage from "localforage";
import { Agent } from "./../../utils/agent";

const agent = new Agent();

export const register = (user, userAgent) => dispatch => {
  const body = {
    ...user,
    verification_code: user.verificationCode,
    fullname: user.fullName,
    phonenumber: user.phoneNumber,
    zipcode: user.zipCode
  };
  return dispatch({
    type: "USER_REGISTER",
    payload: userAgent.create(body).catch(error => {
      // TODO: actually integrate Raven or something similar
      console.log("RAVEN: error in authActions register thunk", error);
      throw error;
    })
  });
};

export const login = (userCredentials, userAgent) => dispatch => {
  const body = {
    emailOrPhoneNumber: {
      email: userCredentials.email,
      phoneNumber: userCredentials.phoneNumber
    },
    password: userCredentials.password
  };
  return dispatch({
    type: "USER_LOGIN",
    payload: userAgent.login(body)
  }).then(user => {
    dispatch(initUser(userAgent));
    return user;
  });
};

export const logout = () => dispatch => {
  return dispatch({
    type: "USER_LOGOUT"
  });
};

export const initUser = userAgent => dispatch => {
  return dispatch({
    type: "INIT_USER",
    payload: new Promise((resolve, reject) => {
      // fetch all user neccessary resources
      return Promise.all[dispatch(fetchReservationsForUser(userAgent))];
    })
  });
};

export const fetchReservationsForUser = userAgent => dispatch => {
  console.log("making dispatch now!");
  return dispatch({
    type: "FETCH_USERS_RESERVATIONS",
    payload: userAgent.getAllReservations()
  });
};
