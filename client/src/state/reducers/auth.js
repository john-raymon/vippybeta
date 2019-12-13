const initialState = {
  isAuth: false, // TODO: rename this to something isUserAuth
  isVenueAuth: false,
  venue: {},
  user: {}
};

export default (state = initialState, { type, payload = {} }) => {
  switch (type) {
    case `USER_REGISTER_FULFILLED`:
      return {
        ...state,
        isAuth: true,
        user: {
          ...payload.user,
          token: undefined
        }
      };
    case "USER_REGISTER_REJECTED":
      return { ...state, isAuth: initialState.isAuth, user: initialState.user };
    case "USER_LOGIN_FULFILLED":
      return { ...state, isAuth: true, user: payload.user };
    case "USER_LOGOUT":
    case "USER_LOGIN_REJECTED":
    case "VENUE_LOGIN_REJECTED":
    case "VENUE_REGISTER_REJECTED":
      return { ...state, ...initialState };
    case "VENUE_REGISTER_FULFILLED":
    case "VENUE_LOGIN_FULFILLED":
      return {
        ...state,
        ...initialState,
        isVenueAuth: true,
        venue: payload.venueHost || payload.venue
      };
    default:
      return state;
  }
};
