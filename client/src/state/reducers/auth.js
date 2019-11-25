const initialState = {
  isAuth: false,
  isVenueAuth: false,
  venue: null,
  user: null
};

const venueReducer = (state, { type, payload }) => {
  switch (type) {
    case "VENUE_REGISTER_REJECTED":
      return { ...state, ...initialState };
    case "VENUE_REGISTER_FULFILLED":
      return {
        ...state,
        ...initialState,
        isVenueAuth: true,
        venue: payload.venueHost
      };
    default:
      return state;
  }
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
      return { ...state, isAuth: initialState.isAuth, user: initialState.user };
    default:
      return {
        ...state,
        ...venueReducer(state, { type, payload })
      };
  }
};
