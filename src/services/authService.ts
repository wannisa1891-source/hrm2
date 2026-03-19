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
        return { 
          success: true, 
          token: data.token, 
          user: data.user 
        };
      } else {
        return { 
          success: false, 
          message: data.message || 'Email หรือ Password ไม่ถูกต้อง' 
        };
      }
    } else {
      const errorData = await res.json().catch(() => ({}));
      return { 
        success: false, 
        message: errorData.message || 'Email หรือ Password ไม่ถูกต้อง' 
      };
    }
  } catch (error) {
    console.error('Login Error:', error);
    return { success: false, message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' };
  }
};

export const registerUser = async (name: string, email: string, password: string) => {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message };
    } else {
      const errorData = await res.json().catch(() => ({}));
      return { 
        success: false, 
        message: errorData.message || 'การสมัครสมาชิกไม่สำเร็จ' 
      };
    }
  } catch (error) {
    console.error('Register Error:', error);
    return { success: false, message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' };
  }
};
