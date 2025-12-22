import React from 'react';
import { Route, Switch } from 'react-router-dom';
import ProtectedRoute from '../Components/ProtectedRoute';
import RoleBasedRoute from '../Components/RoleBasedRoute';

// Pages
import LoginPage from '../pages/Login';
import SignupPage from '../pages/Signup';
import ForgotPasswordPage from '../pages/ForgotPassword';
import HomePage from '../pages/Home';
import ProfilePage from '../pages/Profile';
import OAuth2CallbackPage from '../pages/OAuth2Callback';
import GoogleCalendarCallback from '../Components/GoogleCalendarCallback';
import InvitationResponsePage from '../pages/InvitationResponse/InvitationResponse';
import GroupInvitePage from '../pages/GroupInvite/GroupInvitePage';

// Layouts
import AdminLayout from '../layouts/AdminLayout';

const AppRoutes = () => {
  return (
    <Switch>
      {/* Public Routes */}
      <Route exact path="/" component={LoginPage} />
      <Route exact path="/signup" component={SignupPage} />
      <Route exact path="/login" component={LoginPage} />
      <Route exact path="/forgot-password" component={ForgotPasswordPage} />
      <Route exact path="/oauth2/callback" component={OAuth2CallbackPage} />
      <Route exact path="/google-calendar-callback" component={GoogleCalendarCallback} />
      <Route exact path="/invitation-response" component={InvitationResponsePage} />
      <Route exact path="/group/invite/:token" component={GroupInvitePage} />
      
      {/* Admin Routes - chỉ admin mới truy cập được */}
      <RoleBasedRoute path="/admin" adminOnly={true}>
        <AdminLayout />
      </RoleBasedRoute>

      {/* User Routes - chỉ user mới truy cập được */}
      <RoleBasedRoute exact path="/trang-chu" requiredRole="user">
        <HomePage />
      </RoleBasedRoute>
      
      <RoleBasedRoute exact path="/profile" requiredRole="user">
        <ProfilePage />
      </RoleBasedRoute>
    </Switch>
  );
};

export default AppRoutes;
