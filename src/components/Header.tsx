import React from 'react';
import { useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();

  if (location.pathname === '/login') {
    return null;
  }

  return null;
};

export default Header;
