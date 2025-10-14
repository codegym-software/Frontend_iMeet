import React from 'react';
import '../../admin.css';
import RouterDOM from './AdminRouter';
import { DeviceTypeProvider } from './DeviceTypeContext';
import { DeviceProvider } from './DeviceContext';
import { DataPreloaderProvider } from './DataPreloaderContext';

function App() {
  return (
    <div className="App">
      <DataPreloaderProvider>
        <DeviceTypeProvider>
          <DeviceProvider>
            <RouterDOM />
          </DeviceProvider>
        </DeviceTypeProvider>
      </DataPreloaderProvider>
    </div>
  );
}

export default App;