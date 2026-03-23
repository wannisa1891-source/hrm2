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
          user: data.user   // { user_id, username, first_name, last_name, email, role, status }
        };
      } else {
        return { 
          success: false, 
          message: data.message || 'รหัสผ่านหรือผู้ใช้ไม่ถูกต้อง' 
        };
      }
    } else {
      const errorData = await res.json().catch(() => ({}));
      return { 
        success: false, 
        message: errorData.message || 'รหัสผ่านหรือผู้ใช้ไม่ถูกต้อง' 
      };
    }
  } catch (error) {
    console.error('Login Error:', error);
    return { success: false, message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' };
  }
};

export const registerUser = async (formData: Record<string, string>) => {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message, user_id: data.user_id };
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
