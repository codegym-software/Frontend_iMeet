import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Layout from './Layout';
import HomePage from './HomePage';
import DeviceList from './DeviceList';
import RoomManagement from './RoomManagement';
import UserManagement from './UserManagement';
import MeetingList from './MeetingList';
import { ActivityProvider } from './ActivityContext';

const RouterDOM = () => {
	return (
		<Router>
			<ActivityProvider>
				<Layout>
					<Switch>
						{/* Trang chủ admin */}
						<Route exact path="/admin"><HomePage /></Route>
						<Route exact path="/admin/"><HomePage /></Route>
						
						{/* Các trang con của admin */}
						<Route exact path="/admin/devices"><DeviceList /></Route>
						<Route exact path="/admin/rooms"><RoomManagement /></Route>
						<Route exact path="/admin/users"><UserManagement /></Route>
						<Route exact path="/admin/meetings"><MeetingList /></Route>
						
						{/* Redirect root to admin */}
						<Route exact path="/"><HomePage /></Route>
					</Switch>
				</Layout>
			</ActivityProvider>
		</Router>
	);
}
export default RouterDOM;
