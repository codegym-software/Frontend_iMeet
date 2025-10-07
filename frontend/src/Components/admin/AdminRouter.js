import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Layout from './Layout';
import HomePage from './HomePage';
import DeviceList from './DeviceList';
import RoomManagement from './RoomManagement';
import UserManagement from './UserManagement';

const RouterDOM = () => {
	return (
		<Router>
			<Layout>
				<Switch>
					{/* Trang chủ admin */}
					<Route exact path="/admin"><HomePage /></Route>
					<Route exact path="/admin/"><HomePage /></Route>
					
					{/* Các trang con của admin */}
					<Route exact path="/admin/devices"><DeviceList /></Route>
					<Route exact path="/admin/rooms"><RoomManagement /></Route>
					<Route exact path="/admin/users"><UserManagement /></Route>
					
					{/* Placeholder routes for other menu items */}
					<Route exact path="/admin/schedule"><div style={{ padding: '40px', textAlign: 'center', fontSize: '24px', color: '#666' }}>Schedule Meeting - Coming Soon</div></Route>
					<Route exact path="/admin/meetings"><div style={{ padding: '40px', textAlign: 'center', fontSize: '24px', color: '#666' }}>Meeting List - Coming Soon</div></Route>
					<Route exact path="/admin/notifications"><div style={{ padding: '40px', textAlign: 'center', fontSize: '24px', color: '#666' }}>Notifications - Coming Soon</div></Route>
					
					{/* Redirect root to admin */}
					<Route exact path="/"><HomePage /></Route>
				</Switch>
			</Layout>
		</Router>
	);
}
export default RouterDOM;
