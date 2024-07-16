import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import FoodInfoApp from './FoodInfoApp';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <FoodInfoApp />
  </React.StrictMode>,
  document.getElementById('root')
);
