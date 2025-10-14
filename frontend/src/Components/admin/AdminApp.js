import React from 'react';
import '../../admin.css';
import RouterDOM from './AdminRouter';
import { DeviceTypeProvider } from './DeviceTypeContext';
import { DeviceProvider } from './DeviceContext';

function App() {
  return (
    <div className="App">
      <DeviceTypeProvider>
        <DeviceProvider>
          <RouterDOM />
        </DeviceProvider>
      </DeviceTypeProvider>
    </div>
  );
}

export default App;