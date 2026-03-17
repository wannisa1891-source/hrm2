export const loginUser = async (username: string, password: string) => {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        // คืนค่า success พร้อม token (หาก backend ส่งมา) และข้อมูลอื่นๆ
        return { 
          success: true, 
          token: data.token || 'mocked-token', 
          username: data.username 
        };
      } else {
        return { 
          success: false, 
          message: data.message || 'Username หรือ Password ไม่ถูกต้อง' 
        };
      }
    } else {
      const errorData = await res.json().catch(() => ({}));
      return { 
        success: false, 
        message: errorData.message || 'Username หรือ Password ไม่ถูกต้อง' 
      };
    }
  } catch (error) {
    console.error('Login Error:', error);
    return { success: false, message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' };
  }
};
