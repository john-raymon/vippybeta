import localforage from "localforage";
import { Agent } from "./../../utils/agent";

const agent = new Agent();

export const register = (type = "user") => {
  // returns the proper dispatch function according to the user type

  if (type === "venue") {
    return (venue, venueAgent) => dispatch => {
      const body = {
        fullname: venue.fullName,
        zipcode: venue.zipCode,
        phonenumber: venue.phoneNumber,
        email: venue.email,
        venueName: venue.venueName,
        legalVenueName: venue.legalVenueName,
        password: venue.password,
        accessCode: venue.accessCode
      };
      return dispatch({
        type: "VENUE_REGISTER",
        payload: venueAgent.create(body).catch(error => {
          // TODO: actually integrate Raven or something similar
          console.log(
            "RAVEN: error in authActions register venue thunk",
            error
          );
          throw error;
        })
      });
    };
  }
  if (type === "user") {
    return (user, userAgent) => dispatch => {
      const body = {
        // TODO: don't rely on spreading the properties over for the body, explicity assign them over, that way one can look at the
        // dispatch action and see all the properties the request body will have. Rather than looking for the parameters given on the invocation.
        ...user, // reason for spreading is because user is sent with property names such as
        // user.verifcationCode that that endpoint expects as verification_code
        verification_code: user.verificationCode,
        fullname: user.fullName,
        phonenumber: user.phoneNumber,
        zipcode: user.zipCode
      };
      return dispatch({
        type: "USER_REGISTER",
        payload: userAgent.create(body).catch(error => {
          // TODO: actually integrate Raven or something similar
          console.log("RAVEN: error in authActions register user thunk", error);
          throw error;
        })
      });
    };
  }
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
