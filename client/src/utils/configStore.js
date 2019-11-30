import { createStore, applyMiddleware, compose } from "redux";
import createRootReducer from "../state/reducers";
import { createBrowserHistory } from "history";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web and AsyncStorage for react-native
import { createStateSyncMiddleware } from "redux-state-sync";
import localforage from "localforage";

// middlewares
import thunkMiddleware from "redux-thunk";
import promiseMiddleware from "redux-promise-middleware";
import logger from "redux-logger";
import { routerMiddleware } from "connected-react-router";

const setTokenInStorageMiddleware = ({
  setActions = [],
  unsetActions = []
}) => store => next => async action => {
  const debugMode = () => {
    if (process.env.NODE_ENV === "development") {
      console.log(`The current action is: ${action.type}`);
      console.log(`setActions: ${setActions}, unsetActions: ${unsetActions}`);
    }
  };
  if (setActions.includes(`${action.type}`)) {
    debugMode();
    await localforage.setItem(
      "jwt",
      action.payload.user.token || action.payload.token || ""
    );
  } else if (unsetActions.includes(action.type)) {
    debugMode();
    localforage.setItem("jwt", "");
  }
  next(action);
};

export const history = createBrowserHistory();

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"] // only auth will be persisted
};

const persistedReducer = persistReducer(
  persistConfig,
  createRootReducer(history)
);

const configureStore = persistedState => {
  const composeEnhancers =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  const middlewares = [
    thunkMiddleware,
    logger,
    promiseMiddleware,
    routerMiddleware(history),
    setTokenInStorageMiddleware({
      setActions: [
        "USER_LOGIN_FULFILLED",
        "USER_REGISTER_FULFILLED",
        "VENUE_REGISTER_FULFILLED"
      ],
      unsetActions: ["USER_LOGOUT"]
    }),
    createStateSyncMiddleware({ blacklist: ["@@router/LOCATION_CHANGE"] })
  ];
  let store = createStore(
    persistedReducer,
    composeEnhancers(applyMiddleware(...middlewares))
  );
  let persistor = persistStore(store);
  return { store, persistor };
};

export default configureStore;
