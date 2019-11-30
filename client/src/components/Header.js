import React, { Component, Fragment } from "react";
import { NavLink, Link } from "react-router-dom";
import { withStyles } from "@material-ui/core/styles";

// Components
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import Drawer from "@material-ui/core/Drawer";
import Divider from "@material-ui/core/Divider";

// svgs
import VippyLogo from "../svgs/logo";

const styles = theme => ({
  paper: {
    background: "#151515",
    maxWidth: "400px",
    width: "75%",
    paddingLeft: "1rem",
    paddingTop: "4rem"
  }
});

class Header extends Component {
  constructor(props) {
    super(props);
    this.toggleDrawer = this.toggleDrawer.bind(this);
    this.state = {
      drawerState: false
    };
  }

  toggleDrawer(open = !this.state.drawerState) {
    this.setState({
      drawerState: open
    });
  }

  render() {
    const {
      classes,
      isAuth = false,
      user = { firstname: "John" }
    } = this.props;
    return (
      <header className="Header pv1 ph3 ph2-l mw8 center sticky top-0 z-999 bg-vippy">
        <Drawer
          classes={{ paper: classes.paper }}
          open={this.state.drawerState}
          onClose={() => this.toggleDrawer(false)}
        >
          <div className="drawerContainer w100 flex flex-column pr1 flex-grow-1">
            <div className="logoContainer--noQuery">
              <NavLink to="/" onClick={e => this.toggleDrawer()}>
                <VippyLogo />
              </NavLink>
            </div>
            {isAuth && (
              <p className="michroma tw-text-2xs tracked-1 ttu lh-extra white-40 pt1">
                {`hello ${user.firstname}`}
              </p>
            )}
            <div className="flex flex-grow-1 flex-column justify-between pb4">
              <ul className="drawerContainer__list mt3 ph1 near-white flex flex-column">
                {isAuth ? (
                  <Fragment>
                    <li className="mv2">
                      <NavLink
                        to="/dashboard"
                        onClick={e => this.toggleDrawer()}
                        className="michroma tw-text-2xs tracked-1 ttu lh-extra no-underline near-white"
                      >
                        Dashboard
                      </NavLink>
                    </li>
                    <li className="mv2">
                      <p className="michroma tw-text-2xs tracked-1 ttu lh-extra">
                        my reservations
                      </p>
                    </li>
                    <li className="mv2 order-8">
                      <button
                        onClick={() => {
                          this.toggleDrawer();
                          this.props.logout();
                        }}
                        className="bn michroma tw-text-2xs bg-transparent outline-0 tracked-1 pa0 ttu lh-extra dim pointer silver"
                      >
                        logout
                      </button>
                    </li>
                  </Fragment>
                ) : (
                  <Fragment>
                    <li className="mv2">
                      <NavLink
                        to="/sign-up"
                        onClick={e => this.toggleDrawer()}
                        className="michroma tw-text-2xs tracked-1 ttu lh-extra no-underline near-white"
                      >
                        create an account
                      </NavLink>
                    </li>
                    <li className="mv2">
                      <NavLink
                        to="/login"
                        onClick={e => this.toggleDrawer()}
                        className="michroma tw-text-2xs tracked-1 ttu lh-extra no-underline near-white"
                      >
                        sign in
                      </NavLink>
                    </li>
                  </Fragment>
                )}
                <li className="mv2" onClick={e => this.toggleDrawer()}>
                  <p className="michroma tw-text-2xs tracked-1 ttu lh-extra">
                    browse events near you
                  </p>
                </li>
                <Divider />
                <li className="mv2" onClick={e => this.toggleDrawer()}>
                  <p className="michroma tw-text-2xs tracked-1 ttu lh-extra">
                    more info/faq
                  </p>
                </li>
                <li className="mv2" onClick={e => this.toggleDrawer()}>
                  <p className="michroma tw-text-2xs tracked-1 ttu lh-extra">
                    customer support
                  </p>
                </li>
              </ul>
              <Link
                onClick={e => this.toggleDrawer()}
                to="/venue-sign-up"
                className="michroma tw-text-2xs tracked-1 ttu lh-extra white-40 pt1 self-end"
              >
                Click here to register your venue.
              </Link>
            </div>
          </div>
        </Drawer>
        <div className="flex flex-row items-center w-100 justify-between mt4 mb2">
          <div className="flex flex-column">
            <div className="logoContainer ml1">
              <NavLink to="/">
                <VippyLogo />
              </NavLink>
            </div>
            {isAuth && (
              <p className="michroma tw-text-2xs tracked-1 ttu lh-extra white-40 pt1">
                {`hello ${user.firstname}`}
              </p>
            )}
          </div>
          <IconButton
            color="primary"
            classes={{ root: "dn-l-important" }}
            onClick={() => this.toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
          <div className="Header__largeNavMenu dn flex-l pa3 mv1 ba b--white-30 br1 white">
            {isAuth ? (
              <ul className="flex items-center">
                <li>
                  <NavLink
                    to="/dashboard"
                    className="michroma tw-text-2xs tracked-mega ttu lh-extra pointer dim mh1 no-underline near-white"
                  >
                    dashboard
                  </NavLink>
                  <span className="br bw1 b--white-70 mh3 h-100" />
                </li>
                <li>
                  <NavLink
                    to="/settings"
                    className="michroma tw-text-2xs tracked-mega ttu lh-extra pointer dim mh1 no-underline near-white"
                  >
                    settings
                  </NavLink>
                  <span className="br bw1 b--white-70 mh3 h-100" />
                </li>
                <li>
                  <a className="michroma tw-text-2xs tracked-mega ttu lh-extra pointer dim mh1">
                    help
                  </a>
                  <span className="br bw1 b--white-70 mh3 h-100" />
                </li>
                <li>
                  <button
                    onClick={() => this.props.logout()}
                    className="bn michroma tw-text-2xs bg-transparent outline-0 tracked-mega ttu lh-extra dim pointer ph0 white"
                  >
                    sign out
                  </button>
                  <span className="br bw1 b--white-70 mh3 h-100" />
                </li>
                <li>
                  <button
                    onClick={() => this.toggleDrawer(true)}
                    className="bn michroma tw-text-2xs bg-transparent outline-0 tracked-mega ttu lh-extra dim pointer mh1 ph0 white"
                  >
                    more
                  </button>
                </li>
              </ul>
            ) : (
              <ul className="flex items-center">
                <li>
                  <NavLink
                    to="/login"
                    className="michroma tw-text-2xs tracked-mega ttu lh-extra pointer dim mh1 no-underline near-white"
                  >
                    sign in
                  </NavLink>
                  <span className="br bw1 b--white-70 mh3 h-100" />
                </li>
                <li>
                  <NavLink
                    to="/sign-up"
                    className="michroma tw-text-2xs tracked-mega ttu lh-extra pointer dim mh1 no-underline near-white"
                  >
                    create an account
                  </NavLink>
                  <span className="br bw1 b--white-70 mh3 h-100" />
                </li>
                <li>
                  <a className="michroma tw-text-2xs tracked-mega ttu lh-extra pointer dim mh1">
                    help
                  </a>
                  <span className="br bw1 b--white-70 mh3 h-100" />
                </li>
                <li>
                  <button
                    onClick={() => this.toggleDrawer(true)}
                    className="bn michroma tw-text-2xs bg-transparent outline-0 tracked-mega ttu lh-extra dim pointer mh1 ph0 white"
                  >
                    more
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </header>
    );
  }
}

export default withStyles(styles)(Header);
