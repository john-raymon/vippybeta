import React, { Component } from "react";
import { connect } from "react-redux";
import { Route, Redirect, Switch, Link, withRouter } from "react-router-dom";
import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import userAgent from "./../libs/userAgent";
import venueAgent from "./../libs/venueAgent";
import queryString from "query-string";

// Route Components
import Homepage from "./Homepage";
import UserRegister from "./UserRegister";
import VenueRegister from "./VenueRegister";
import Snackbar from "@material-ui/core/Snackbar";
import Login from "./Login";
import Dashboard from "./Dashboard";
import DetailedListing from "./DetailedListing";
import Checkout from "./Checkout";
import DetailedReservation from "./DetailedReservation";
import SettingUpVenueScreen from "./SettingUpVenueScreen";

// View Components
import Header from "./Header";

// Redux Actions
import {
  logout,
  initUser,
  register as registerDispatch,
  login as loginDispatch
} from "../state/actions/authActions";

// Styles
import "../styles/application.css";

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#ffffff"
    },
    secondary: {
      main: "#333333"
    },
    divider: "#5d5d5d"
  }
});

const NotFound = props => {
  return <div className="yellow">Not Found </div>;
};

const ProtectedRoute = ({ component: Component, render, isAuth, ...rest }) => {
  return (
    <Route
      {...rest}
      render={props =>
        isAuth ? (
          Component ? (
            <Component {...props} />
          ) : (
            render(props)
          )
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
};

// TODO : add button universal banner to app layout telling venue
// to complete stripe registration
class App extends Component {
  constructor(props) {
    super(props);
    this.setSnackbar = this.setSnackbar.bind(this);
    this.hideSnackbar = this.hideSnackbar.bind(this);
    this.logoutDispatchWrapper = this.logoutDispatchWrapper.bind(this);
    this.userAgent = userAgent;
    this.venueAgent = venueAgent;
    this.state = {
      snackbar: {
        open: false,
        message: ""
      }
    };
  }

  setSnackbar(message = "") {
    console.log("set snackbar with", message);
    this.setState({
      snackbar: {
        open: true,
        message
      }
    });
  }
  hideSnackbar() {
    this.setState({
      ...this.state,
      snackbar: {
        open: false,
        message: ""
      }
    });
  }
  logoutDispatchWrapper() {
    this.props.history.push("/login");
    this.props.logout();
  }
  render() {
    const {
      isAuth: isRegularAuth,
      isVenueAuth,
      venueRegisterDispatch,
      user,
      regularLogin,
      venue,
      venueLogin
    } = this.props;
    const isAuth = isRegularAuth || isVenueAuth; // only use isAuth for generic things that
    // can be a shared resource for all auths. (for example: ProtectedRoute^^ wrapper components
    // usually can be shared with venue/regular-user/promoter,
    // therefor it's isAuth prop can be the universal isAuth,
    // on the other hand the inner wrapped component inside a
    // ProtectedRoute should conditionally render resources
    // based on the specific is___Auth variables)
    //——real usecase is our Dashboard ProtectedRoute, all auth users have dashboards, thus they should all share the same Dashboard component——
    // rendering based on the more specific is___Auth variables

    const logout = this.logoutDispatchWrapper;
    return (
      <MuiThemeProvider theme={theme}>
        <section className="bg-vippy">
          <Header user={user || venue} isAuth={isAuth} logout={logout} />
          <main className="tw-flex mainContainer ph3">
            <Switch>
              <Route path="/" exact component={Homepage} />
              <Route
                path="/login/:type?"
                render={props => {
                  return (
                    <Login
                      {...props}
                      isAuth={isAuth}
                      typeOfLogin={props.match.params.type}
                      userAgent={this.userAgent}
                      venueAgent={this.venueAgent}
                      venueLogin={venueLogin}
                      regularLogin={regularLogin}
                    />
                  );
                }}
              />
              <Route
                path="/sign-up"
                exact
                render={props => {
                  return (
                    <UserRegister
                      {...props}
                      isAuth={isAuth}
                      setSnackbar={this.setSnackbar}
                      userAgent={this.userAgent}
                    />
                  );
                }}
              />
              <Route
                path="/venue-sign-up"
                exact
                render={props => {
                  return (
                    <VenueRegister
                      {...props}
                      isVenueAuth={isVenueAuth}
                      isAuth={isAuth}
                      venueRegisterDispatch={venueRegisterDispatch}
                      venueAgent={this.venueAgent}
                    />
                  );
                }}
              />
              <ProtectedRoute
                isAuth={isVenueAuth}
                path="/api/host/stripe/token"
                exact
                render={props => {
                  return (
                    <SettingUpVenueScreen
                      {...props}
                      venueAgent={this.venueAgent}
                    />
                  );
                }}
              />
              <ProtectedRoute
                isAuth={isAuth}
                path="/dashboard"
                exact
                render={props => {
                  return (
                    <Dashboard
                      {...props}
                      isVenueAuth={isVenueAuth}
                      userAgent={this.userAgent}
                    />
                  );
                }}
              />
              <Route
                path="/listing/:listingId"
                render={props => {
                  return (
                    <DetailedListing
                      {...props}
                      isAuth={isAuth}
                      userAgent={this.userAgent}
                    />
                  );
                }}
              />
              <ProtectedRoute
                isAuth={isAuth}
                path="/checkout"
                render={props => {
                  return <Checkout {...props} userAgent={this.userAgent} />;
                }}
              />
              <Route
                path="/logout"
                exact
                render={() => {
                  this.props.logout();
                  return <div>test</div>;
                }}
              />
              <ProtectedRoute
                isAuth={isAuth}
                path="/reservations/:reservationId"
                render={props => {
                  const propsWithParsedLocationSearch = {
                    ...props,
                    location: {
                      ...props.location,
                      parsedSearch: queryString.parse(props.location.search)
                    }
                  };
                  return (
                    <DetailedReservation
                      {...propsWithParsedLocationSearch}
                      userAgent={this.userAgent}
                    />
                  );
                }}
              />
              <Route path="/*" component={NotFound} />
            </Switch>
          </main>
          <figure>
            <Snackbar
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center"
              }}
              autoHideDuration={7500}
              open={this.state.snackbar.open}
              onClose={this.hideSnackbar}
              ContentProps={{
                "aria-describedby": "message-id"
              }}
            >
              <span
                id="message-id"
                className="michroma f7 pv3 ph3 black br2 bg-white b lh-copy tracked tl mb4"
              >
                {this.state.snackbar.message}
              </span>
            </Snackbar>
          </figure>
        </section>
      </MuiThemeProvider>
    );
  }
}

export default connect(
  state => ({
    isAuth: state.auth.isAuth,
    isVenueAuth: state.auth.isVenueAuth,
    venue: state.auth.venue,
    user: state.auth.user
  }),
  {
    logout,
    initUser,
    regularLogin: loginDispatch(),
    venueLogin: loginDispatch("venue"),
    venueRegisterDispatch: registerDispatch("venue")
  } // TODO: lift UserRegister's component's registerDispatch to App.js component
)(withRouter(App));
