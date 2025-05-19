import React from 'react';

// Mock components
const BrowserRouter = ({ children }) => <div>{children}</div>;
const Routes = ({ children }) => <div>{children}</div>;
const Route = ({ children }) => <div>{children}</div>;
const Link = ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>;
const NavLink = ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>;
const Navigate = ({ to }) => <div data-testid="navigate" data-to={to} />;
const Outlet = () => <div data-testid="outlet" />;

// Mock hooks
const useNavigate = jest.fn().mockReturnValue(jest.fn());
const useParams = jest.fn().mockReturnValue({});
const useLocation = jest.fn().mockReturnValue({ pathname: '/', search: '', hash: '', state: null });
const useRouteError = jest.fn().mockReturnValue(null);
const useMatch = jest.fn().mockReturnValue(null);

module.exports = {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  Outlet,
  useNavigate,
  useParams,
  useLocation,
  useRouteError,
  useMatch
}; 