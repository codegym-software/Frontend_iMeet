import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import ProtectedRoute from '../Components/ProtectedRoute';
import RoleBasedRoute from '../Components/RoleBasedRoute';
import { AdminLayout } from '../Components/admin';
import Signup from '../Components/Signup';
import Login from '../Components/Login';
import Dashboard from '../Components/main/TrangChu';
import Profile from '../Components/Profile';
import ForgotPassword from '../Components/ForgotPassword';
import { OAuth2Callback } from '../Components';

const RouterDOM = () => {
	return (
		<AuthProvider>
			<Router>
				<Switch>
					<Route exact path="/">
						<Login />
					</Route>
					<Route exact path="/signup"><Signup /></Route>
					<Route exact path="/login"><Login /></Route>
					<Route exact path="/forgot-password"><ForgotPassword /></Route>
					
					{/* Admin Routes - chỉ admin mới truy cập được */}
					<RoleBasedRoute path="/admin" adminOnly={true}>
						<AdminLayout />
					</RoleBasedRoute>

					{/* User Routes - chỉ user mới truy cập được */}
					<RoleBasedRoute exact path="/trang-chu" requiredRole="user">
						<Dashboard />
					</RoleBasedRoute>
					<RoleBasedRoute exact path="/profile" requiredRole="user">
						<Profile />
					</RoleBasedRoute>
					
					{/* Route xử lý callback từ Cognito */}
					<Route exact path="/oauth2/callback"><OAuth2Callback /></Route>
				</Switch>
			</Router>
		</AuthProvider>
	);
}


export default RouterDOM;