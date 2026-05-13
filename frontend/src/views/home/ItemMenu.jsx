import React from 'react';
import './ItemMenu.css';

const ItemMenu = ({ icon, label, counter, onClick }) => {
  return (
    <div className="item-menu" onClick={onClick}>
      <div className="item-menu-icon">
        {icon || ''}
      </div>
      <div className="item-menu-content">
        <span className="item-menu-label">{label}</span>
        {counter !== undefined && (
          <span className="item-menu-counter">{counter}</span>
        )}
      </div>
    </div>
  );
};

export default ItemMenu;
