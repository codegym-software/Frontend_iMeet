import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DeviceInventoryProvider } from './contexts/DeviceInventoryContext';
import { DataPreloaderProvider } from './pages/Admin/DataPreloaderContext';
import { DeviceProvider } from './pages/Admin/DeviceContext';
import { DeviceTypeProvider } from './pages/Admin/DeviceTypeContext';
import { ActivityProvider } from './pages/Admin/ActivityContext';
import AppRoutes from './routes';
import './styles/global.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <DeviceInventoryProvider>
          <DataPreloaderProvider>
            <DeviceTypeProvider>
              <DeviceProvider>
                <ActivityProvider>
                  <AppRoutes />
                </ActivityProvider>
              </DeviceProvider>
            </DeviceTypeProvider>
          </DataPreloaderProvider>
        </DeviceInventoryProvider>
      </Router>
    </AuthProvider>
  );
};

export default App;
