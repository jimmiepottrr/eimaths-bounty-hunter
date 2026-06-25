import React from 'react';
import { useNavigate } from 'react-router-dom';

// A simple login page with mock form. In a real application this
// would handle user authentication, but here we just navigate to
// the grade selection screen when the form is submitted.
const Login: React.FC = () => {
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For this demo we don't perform authentication. Navigate to grade page.
    navigate('/grade');
  };

  return (
    <div>
      <h1>เข้าสู่ระบบ</h1>
      <p>กรุณาใส่รหัสผู้ปกครองหรืออีเมลเพื่อล็อกอิน</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: 320 }}>
        <label htmlFor="email">อีเมล / รหัสผู้ปกครอง</label>
        <input id="email" type="text" placeholder="example@domain.com" required />
        <label htmlFor="password" style={{ marginTop: '1rem' }}>รหัสผ่าน</label>
        <input id="password" type="password" required />
        <button type="submit" style={{ marginTop: '1.5rem' }}>เข้าสู่ระบบ</button>
      </form>
    </div>
  );
};

export default Login;