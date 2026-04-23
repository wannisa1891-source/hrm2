'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const SLIDES = [
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1600&q=80',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=80',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&q=80',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1600&q=80',
  'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1600&q=80',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&q=80'
];

type FieldErrors = {
  [key: string]: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(s => (s + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const steps = ['บัญชีผู้ใช้', 'ข้อมูลพนักงาน', 'ข้อมูลการทำงาน'];
  const [currentStep, setCurrentStep] = useState(0);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    first_name: '', last_name: '', gender: '', date_of_birth: '', phone: '',
    position: '', department: '', start_date: '', employee_type: ''
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Fake API for username duplicate check
  const takenUsernames = ['admin', 'hr', 'test', 'user', 'director'];

  useEffect(() => {
    const checkUsername = () => {
      if (!form.username) {
        setUsernameStatus('idle');
        return;
      }
      setUsernameStatus('checking');
      setTimeout(() => {
        if (takenUsernames.includes(form.username.toLowerCase())) {
          setUsernameStatus('taken');
        } else {
          setUsernameStatus('available');
        }
      }, 500);
    };

    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [form.username]);

  const passwordStrength = useMemo(() => {
    const pwd = form.password;
    if (!pwd) return { percent: 0, level: '', text: '' };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (pwd.length >= 12) score++;

    if (score <= 1) return { percent: 20, level: 'weak', text: 'อ่อน' };
    if (score === 2) return { percent: 40, level: 'fair', text: 'พอใช้' };
    if (score === 3) return { percent: 60, level: 'good', text: 'ดี' };
    if (score === 4) return { percent: 80, level: 'strong', text: 'แข็งแกร่ง' };
    return { percent: 100, level: 'excellent', text: 'ยอดเยี่ยม' };
  }, [form.password]);

  // Validation functions per step
  const validateStep1 = () => {
    const errs: FieldErrors = {};
    if (!form.username) errs.username = 'กรุณากรอก Username';
    else if (form.username.length < 3 || form.username.length > 20) errs.username = 'Username ต้องมี 3-20 ตัวอักษร';
    else if (usernameStatus === 'taken') errs.username = 'Username นี้ถูกใช้แล้ว';

    if (!form.email) errs.email = 'กรุณากรอก Email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'รูปแบบ Email ไม่ถูกต้อง';

    if (!form.password) errs.password = 'กรุณากรอกรหัสผ่าน';
    else {
      if (form.password.length < 8) errs.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
      else if (!/[A-Z]/.test(form.password)) errs.password = 'ต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว';
      else if (!/[0-9]/.test(form.password)) errs.password = 'ต้องมีตัวเลขอย่างน้อย 1 ตัว';
      else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) errs.password = 'ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว';
    }

    if (!form.confirmPassword) errs.confirmPassword = 'กรุณายืนยันรหัสผ่าน';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'รหัสผ่านไม่ตรงกัน';

    return errs;
  };

  const validateStep2 = () => {
    const errs: FieldErrors = {};
    if (!form.first_name) errs.first_name = 'กรุณากรอกชื่อ';
    if (!form.last_name) errs.last_name = 'กรุณากรอกนามสกุล';

    if (!form.date_of_birth) errs.date_of_birth = 'กรุณากรอกวันเกิด';
    else {
      const today = new Date();
      const dob = new Date(form.date_of_birth);
      if (dob > today) errs.date_of_birth = 'วันเกิดต้องไม่ใช่วันในอนาคต';
    }

    if (!form.phone) errs.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    else if (!/^[0-9]{10}$/.test(form.phone)) errs.phone = 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก';

    if (!form.gender || !['male', 'female'].includes(form.gender)) errs.gender = 'กรุณาเลือกเพศ (ชาย/หญิง)';

    return errs;
  };

  const validateStep3 = () => {
    const errs: FieldErrors = {};
    if (!form.position) errs.position = 'กรุณาเลือกตำแหน่ง';
    if (!form.department) errs.department = 'กรุณาเลือกแผนก';

    if (!form.start_date) errs.start_date = 'กรุณากรอกวันที่เริ่มงาน';
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(form.start_date);
      if (start > today) errs.start_date = 'วันที่เริ่มงานต้องไม่ใช่วันในอนาคต';
    }

    if (!form.employee_type) errs.employee_type = 'กรุณาเลือกประเภทพนักงาน';

    return errs;
  };

  // Check validities dynamically for Next/Submit buttons
  const isStep1Valid = Object.keys(validateStep1()).length === 0;
  const isStep2Valid = Object.keys(validateStep2()).length === 0;
  const isStep3Valid = Object.keys(validateStep3()).length === 0;

  const nextStep = () => {
    if (currentStep === 0) setFieldErrors(validateStep1());
    if (currentStep === 1) setFieldErrors(validateStep2());

    const isCurrentValid = currentStep === 0 ? isStep1Valid : (currentStep === 1 ? isStep2Valid : true);
    if (isCurrentValid) {
      setFieldErrors({});
      setApiError('');
      setCurrentStep(s => s + 1);
    }
  };

  const prevStep = () => {
    setFieldErrors({});
    setApiError('');
    setCurrentStep(s => s - 1);
  };

  const goToStep = (idx: number) => {
    if (idx < currentStep) {
      setFieldErrors({});
      setApiError('');
      setCurrentStep(idx);
    }
  };

  const handleBlur = (stepValidator: () => FieldErrors) => {
    // Only update errors that exist in stepValidator output to avoid showing future errors
    const errs = stepValidator();
    setFieldErrors(errs);
  };

  const submitForm = async () => {
    setFieldErrors(validateStep3());
    if (!isStep3Valid) return;

    setApiError('');
    setIsSubmitting(true);

    try {
      const { confirmPassword, ...payload } = form; // Don't send confirmPassword

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setSuccessMessage('สมัครสมาชิกสำเร็จ! กำลังพาท่านไปหน้าเข้าสู่ระบบ...');
        setTimeout(() => {
          router.push('/login');
        }, 2500);
      } else {
        setApiError(data.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก โปรดลองอีกครั้ง');
      }
    } catch {
      setApiError('เซิร์ฟเวอร์ขัดข้อง ไม่สามารถเชื่อมต่อ API ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .register-wrapper {
          min-height: 100vh;
          width: 100%;
          background-size: cover;
          background-position: center;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          transition: background-image 1s ease-in-out;
          padding: 30px 20px;
        }
        .overlay {
          position: absolute;
          width: 100%; height: 100%; top: 0; left: 0;
          background: linear-gradient(135deg, rgba(0, 40, 80, 0.75), rgba(0, 120, 200, 0.45));
        }
        .register-panel {
          position: relative; z-index: 2; width: 100%; max-width: 760px;
          padding: 35px 40px; border-radius: 20px; background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.18); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.6s ease-out; color: #fff;
        }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .register-header { text-align: center; margin-bottom: 25px; }
        .register-logo { width: 60px; display: block; margin: 0 auto 8px; filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3)); }
        .system-title { font-weight: 800; font-size: 24px; letter-spacing: 2px; margin: 0; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .subtitle { font-size: 14px; color: rgba(255, 255, 255, 0.7); margin: 4px 0 0; }
        .step-indicator { display: flex; justify-content: center; gap: 8px; margin-bottom: 25px; flex-wrap: wrap; }
        .step-item { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; opacity: 0.5; transition: all 0.3s ease; min-width: 90px; }
        .step-item.active { opacity: 1; } .step-item.completed { opacity: 0.85; }
        .step-circle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; border: 2px solid rgba(255, 255, 255, 0.3); background: rgba(255, 255, 255, 0.1); transition: all 0.3s ease; }
        .step-item.active .step-circle { background: linear-gradient(135deg, #2563eb, #7c3aed); border-color: transparent; box-shadow: 0 0 15px rgba(37, 99, 235, 0.5); }
        .step-item.completed .step-circle { background: linear-gradient(135deg, #10b981, #059669); border-color: transparent; }
        .step-label { font-size: 12px; color: rgba(255, 255, 255, 0.7); text-align: center; }
        .step-item.active .step-label { color: #fff; font-weight: 600; }
        .error-alert { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 12px; padding: 12px 16px; margin-bottom: 18px; display: flex; gap: 10px; align-items: center; color: #fca5a5; font-size: 14px;}
        .success-box { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 12px; padding: 14px 16px; margin-bottom: 18px; display: flex; gap: 10px; align-items: center; color: #6ee7b7; font-weight: 600; }
        .form-section { margin-bottom: 10px; }
        .section-title { font-size: 18px; font-weight: 700; margin: 0 0 20px; display: flex; align-items: center; gap: 8px; color: #e0e7ff; }
        .input-row { margin-bottom: 16px; align-items: flex-start; }
        .input-row.two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .input-group label { display: block; font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, 0.85); margin-bottom: 6px; }
        .required { color: #f87171; }
        .input-field { display: flex; align-items: center; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 10px; padding: 12px; transition: all 0.3s ease; }
        .input-field.error { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
        .input-field:focus-within:not(.error) { border-color: #60a5fa; background: rgba(255, 255, 255, 0.15); box-shadow: 0 0 12px rgba(96, 165, 250, 0.2); }
        .field-icon { margin-right: 10px; font-size: 16px; flex-shrink: 0; }
        .input-field input, .input-field select { border: none; background: none; width: 100%; font-size: 14.5px; color: #fff; outline: none; }
        .input-field input::placeholder { color: rgba(255, 255, 255, 0.4); }
        .input-field select { cursor: pointer; } .input-field select option { background: #1e293b; color: #fff; }
        .toggle-pass { cursor: pointer; font-size: 16px; margin-left: 6px; user-select: none; }
        .field-error-msg { display: block; font-size: 12px; color: #f87171; margin-top: 6px; font-weight: 500; }
        .field-success-msg { display: block; font-size: 12px; color: #6ee7b7; margin-top: 6px; font-weight: 500; }
        .password-strength { margin-top: 8px; display: flex; align-items: center; gap: 8px; }
        .strength-bar { flex: 1; height: 5px; background: rgba(255, 255, 255, 0.15); border-radius: 3px; overflow: hidden; }
        .strength-fill { height: 100%; border-radius: 3px; transition: width 0.3s ease, background 0.3s ease; }
        .strength-fill.weak { background: #ef4444; } .strength-fill.fair { background: #f97316; } .strength-fill.good { background: #eab308; } .strength-fill.strong { background: #22c55e; } .strength-fill.excellent { background: #10b981; }
        .strength-text { font-size: 12px; font-weight: 600; width: 60px; text-align: right; }
        .strength-text.weak { color: #fca5a5; } .strength-text.fair { color: #fdba74; } .strength-text.good { color: #fde047; } .strength-text.strong { color: #86efac; } .strength-text.excellent { color: #6ee7b7; }
        .action-buttons { display: flex; gap: 12px; margin-top: 24px; }
        .btn { padding: 14px 24px; border: none; border-radius: 12px; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-primary { flex: 1; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4); }
        .btn-secondary { background: rgba(255, 255, 255, 0.1); color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); }
        .btn-secondary:hover:not(:disabled) { background: rgba(255, 255, 255, 0.2); }
        .btn-success { flex: 1; background: linear-gradient(135deg, #10b981, #059669); color: #fff; }
        .btn-success:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(50%); }
        .btn-cancel { background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
        .btn-cancel:hover:not(:disabled) { background: rgba(239, 68, 68, 0.25); }
        .spinner { width: 18px; height: 18px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .register-footer { text-align: center; margin-top: 24px; font-size: 14px; color: rgba(255, 255, 255, 0.6); }
        .register-footer a { color: #60a5fa; text-decoration: none; font-weight: 600; transition: color 0.2s; }
        .register-footer a:hover { color: #93c5fd; text-decoration: underline; }
        @media (max-width: 600px) { .input-row.two-cols { grid-template-columns: 1fr; } .register-panel { padding: 25px 20px; } }
      ` }} />

      <div className="register-wrapper" style={{ backgroundImage: `url(${SLIDES[currentSlide]})` }}>
        <div className="overlay"></div>

        <div className="register-panel">
          {/* Header */}
          <div className="register-header">
            <h2 className="system-title">HOSPITAL HRM</h2>
            <p className="subtitle">สมัครสมาชิกระบบบุคลากร</p>
          </div>

          {/* Step Indicator */}
          <div className="step-indicator">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`step-item ${currentStep === idx ? 'active' : ''} ${currentStep > idx ? 'completed' : ''}`}
                onClick={() => goToStep(idx)}
              >
                <div className="step-circle">
                  {currentStep > idx ? <span>✓</span> : <span>{idx + 1}</span>}
                </div>
                <span className="step-label">{step}</span>
              </div>
            ))}
          </div>

          {/* Alert Messages */}
          {apiError && (
            <div className="error-alert">
              <span style={{ fontSize: '20px' }}>⚠️</span> {apiError}
            </div>
          )}
          {successMessage && (
            <div className="success-box">
              <span style={{ fontSize: '24px' }}>✅</span> {successMessage}
            </div>
          )}

          {/* Step 1: Account Information */}
          <form style={{ display: currentStep === 0 ? 'block' : 'none' }} className="form-section">
            <h3 className="section-title"><span className="section-icon">🔐</span>บัญชีผู้ใช้ (Account Information)</h3>

            <div className="input-row two-cols">
              <div className="input-group">
                <label>Username <span className="required">*</span></label>
                <div className={`input-field ${fieldErrors.username ? 'error' : ''}`}>
                  <span className="field-icon">👤</span>
                  <input
                    value={form.username}
                    onChange={e => { setForm(f => ({ ...f, username: e.target.value })); if (fieldErrors.username) setFieldErrors(e => ({ ...e, username: '' })); }}
                    onBlur={() => handleBlur(validateStep1)}
                    placeholder="ความยาว 3-20 อักษร"
                    maxLength={20}
                  />
                </div>
                {fieldErrors.username && <span className="field-error-msg">{fieldErrors.username}</span>}
                {!fieldErrors.username && usernameStatus === 'available' && <span className="field-success-msg">✅ Username นี้เว้นว่างและสามารถใช้งานได้</span>}
                {!fieldErrors.username && usernameStatus === 'checking' && <span className="field-success-msg" style={{ color: '#94a3b8' }}>กำลังตรวจสอบ...</span>}
              </div>

              <div className="input-group">
                <label>Email <span className="required">*</span></label>
                <div className={`input-field ${fieldErrors.email ? 'error' : ''}`}>
                  <span className="field-icon">📧</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => { setForm(f => ({ ...f, email: e.target.value })); if (fieldErrors.email) setFieldErrors(e => ({ ...e, email: '' })); }}
                    onBlur={() => handleBlur(validateStep1)}
                    placeholder="example@hospital.com"
                  />
                </div>
                {fieldErrors.email && <span className="field-error-msg">{fieldErrors.email}</span>}
              </div>
            </div>

            <div className="input-row two-cols">
              <div className="input-group">
                <label>Password <span className="required">*</span></label>
                <div className={`input-field ${fieldErrors.password ? 'error' : ''}`}>
                  <span className="field-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => { setForm(f => ({ ...f, password: e.target.value })); if (fieldErrors.password) setFieldErrors(e => ({ ...e, password: '' })); }}
                    onBlur={() => handleBlur(validateStep1)}
                    placeholder="รหัสผ่าน"
                  />
                  <span className="toggle-pass" onClick={() => setShowPassword(!showPassword)}>{showPassword ? '🙈' : '👁️'}</span>
                </div>
                {fieldErrors.password && <span className="field-error-msg">{fieldErrors.password}</span>}
                {form.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div className={`strength-fill ${passwordStrength.level}`} style={{ width: `${passwordStrength.percent}%` }}></div>
                    </div>
                    <span className={`strength-text ${passwordStrength.level}`}>{passwordStrength.text}</span>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>Confirm Password <span className="required">*</span></label>
                <div className={`input-field ${fieldErrors.confirmPassword ? 'error' : ''}`}>
                  <span className="field-icon">🔒</span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => { setForm(f => ({ ...f, confirmPassword: e.target.value })); if (fieldErrors.confirmPassword) setFieldErrors(e => ({ ...e, confirmPassword: '' })); }}
                    onBlur={() => handleBlur(validateStep1)}
                    placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                  />
                  <span className="toggle-pass" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? '🙈' : '👁️'}</span>
                </div>
                {fieldErrors.confirmPassword && <span className="field-error-msg">{fieldErrors.confirmPassword}</span>}
              </div>
            </div>
          </form>

          {/* Step 2: Employee Information */}
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }} className="form-section">
            <h3 className="section-title"><span className="section-icon">📋</span>ข้อมูลพนักงาน (Employee Information)</h3>

            <div className="input-row two-cols">
              <div className="input-group">
                <label>ชื่อ (First Name) <span className="required">*</span></label>
                <div className={`input-field ${fieldErrors.first_name ? 'error' : ''}`}>
                  <span className="field-icon">✏️</span>
                  <input
                    value={form.first_name}
                    onChange={e => { setForm(f => ({ ...f, first_name: e.target.value })); if (fieldErrors.first_name) setFieldErrors(e => ({ ...e, first_name: '' })); }}
                    onBlur={() => handleBlur(validateStep2)}
                    placeholder="ชื่อจริงภาษาไทย"
                  />
                </div>
                {fieldErrors.first_name && <span className="field-error-msg">{fieldErrors.first_name}</span>}
              </div>

              <div className="input-group">
                <label>นามสกุล (Last Name) <span className="required">*</span></label>
                <div className={`input-field ${fieldErrors.last_name ? 'error' : ''}`}>
                  <span className="field-icon">✏️</span>
                  <input
                    value={form.last_name}
                    onChange={e => { setForm(f => ({ ...f, last_name: e.target.value })); if (fieldErrors.last_name) setFieldErrors(e => ({ ...e, last_name: '' })); }}
                    onBlur={() => handleBlur(validateStep2)}
                    placeholder="นามสกุลภาษาไทย"
                  />
                </div>
                {fieldErrors.last_name && <span className="field-error-msg">{fieldErrors.last_name}</span>}
              </div>
            </div>

            <div className="input-row two-cols">
              <div className="input-group">
                <label>วันเกิด (Birthday) <span className="required">*</span></label>
                  <div className={`input-field ${fieldErrors.date_of_birth ? 'error' : ''}`}>
                    <span className="field-icon">🎂</span>
                    <input
                      type="date"
                      value={form.date_of_birth}
                      onChange={e => { setForm(f => ({ ...f, date_of_birth: e.target.value })); if (fieldErrors.date_of_birth) setFieldErrors(e => ({ ...e, date_of_birth: '' })); }}
                      onBlur={() => handleBlur(validateStep2)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                {fieldErrors.date_of_birth && <span className="field-error-msg">{fieldErrors.date_of_birth}</span>}
              </div>

              <div className="input-group">
                <label>เพศ (Gender) <span className="required">*</span></label>
                <div className={`input-field ${fieldErrors.gender ? 'error' : ''}`}>
                  <span className="field-icon">⚧</span>
                  <select
                    value={form.gender}
                    onChange={e => { setForm(f => ({ ...f, gender: e.target.value })); if (fieldErrors.gender) setFieldErrors(e => ({ ...e, gender: '' })); }}
                    onBlur={() => handleBlur(validateStep2)}
                  >
                    <option value="" disabled>เลือกเพศ</option>
                    <option value="male">ชาย (Male)</option>
                    <option value="female">หญิง (Female)</option>
                  </select>
                </div>
                {fieldErrors.gender && <span className="field-error-msg">{fieldErrors.gender}</span>}
              </div>
            </div>

            <div className="input-row two-cols">
              <div className="input-group">
                <label>เบอร์โทรศัพท์ (Phone) <span className="required">*</span></label>
                <div className={`input-field ${fieldErrors.phone ? 'error' : ''}`}>
                  <span className="field-icon">📱</span>
                  <input
                    value={form.phone}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length <= 10) setForm(f => ({ ...f, phone: val }));
                      if (fieldErrors.phone) setFieldErrors(e => ({ ...e, phone: '' }));
                    }}
                    onBlur={() => handleBlur(validateStep2)}
                    placeholder="ตัวเลข 10 หลัก"
                  />
                </div>
                {fieldErrors.phone && <span className="field-error-msg">{fieldErrors.phone}</span>}
              </div>
            </div>
          </div>

          {/* Step 3: Work Information */}
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }} className="form-section">
            <h3 className="section-title"><span className="section-icon">💼</span>ข้อมูลการทำงาน (Work Information)</h3>

            <div className="input-row two-cols">
              <div className="input-group">
                <label>ตำแหน่ง (Position) <span className="required">*</span></label>
                <div className={`input-field ${fieldErrors.position ? 'error' : ''}`}>
                  <span className="field-icon">🎯</span>
                  <select
                    value={form.position}
                    onChange={e => { setForm(f => ({ ...f, position: e.target.value })); if (fieldErrors.position) setFieldErrors(e => ({ ...e, position: '' })); }}
                    onBlur={() => handleBlur(validateStep3)}
                  >
                    <option value="" disabled>เลือกตำแหน่ง</option>
                    <option value="แพทย์">แพทย์</option>
                    <option value="พยาบาล">พยาบาล</option>
                    <option value="เภสัชกร">เภสัชกร</option>
                    <option value="เจ้าหน้าที่การเงิน">เจ้าหน้าที่การเงิน</option>
                    <option value="ธุรการ">เจ้าหน้าที่ธุรการ</option>
                    <option value="พนักงานบัญชี">พนักงานบัญชี</option>
                    <option value="ไอที">เจ้าหน้าที่ไอที</option>
                  </select>
                </div>
                {fieldErrors.position && <span className="field-error-msg">{fieldErrors.position}</span>}
              </div>

              <div className="input-group">
                <label>แผนก (Department) <span className="required">*</span></label>
                <div className={`input-field ${fieldErrors.department ? 'error' : ''}`}>
                  <span className="field-icon">🏢</span>
                  <select
                    value={form.department}
                    onChange={e => { setForm(f => ({ ...f, department: e.target.value })); if (fieldErrors.department) setFieldErrors(e => ({ ...e, department: '' })); }}
                    onBlur={() => handleBlur(validateStep3)}
                  >
                    <option value="" disabled>เลือกแผนก</option>
                    <option value="แผนกผู้ป่วยนอก">แผนกผู้ป่วยนอก (OPD)</option>
                    <option value="แผนกผู้ป่วยใน">แผนกผู้ป่วยใน (IPD)</option>
                    <option value="แผนกฉุกเฉิน">แผนกฉุกเฉิน (ER)</option>
                    <option value="ห้องปฏิบัติการ">ห้องปฏิบัติการ (Lab)</option>
                    <option value="แผนกเภสัชกรรม">แผนกเภสัชกรรม</option>
                    <option value="ฝ่ายบริหาร">ฝ่ายบริหาร</option>
                  </select>
                </div>
                {fieldErrors.department && <span className="field-error-msg">{fieldErrors.department}</span>}
              </div>
            </div>

            <div className="input-row two-cols">
              <div className="input-group">
                <label>วันที่เริ่มงาน (Start Date) <span className="required">*</span></label>
                <div className={`input-field ${fieldErrors.start_date ? 'error' : ''}`}>
                  <span className="field-icon">📅</span>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => { setForm(f => ({ ...f, start_date: e.target.value })); if (fieldErrors.start_date) setFieldErrors(e => ({ ...e, start_date: '' })); }}
                    onBlur={() => handleBlur(validateStep3)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {fieldErrors.start_date && <span className="field-error-msg">{fieldErrors.start_date}</span>}
              </div>

              <div className="input-group">
                <label>ประเภทพนักงาน (Employee Type) <span className="required">*</span></label>
                <div className={`input-field ${fieldErrors.employee_type ? 'error' : ''}`}>
                  <span className="field-icon">📋</span>
                  <select
                    value={form.employee_type}
                    onChange={e => { setForm(f => ({ ...f, employee_type: e.target.value })); if (fieldErrors.employee_type) setFieldErrors(e => ({ ...e, employee_type: '' })); }}
                    onBlur={() => handleBlur(validateStep3)}
                  >
                    <option value="" disabled>เลือกประเภทพนักงาน</option>
                    <option value="เต็มเวลา">เต็มเวลา (Full-time)</option>
                    <option value="พาร์ทไทม์">พาร์ทไทม์ (Part-time)</option>
                    <option value="สัญญาจ้าง">สัญญาจ้าง (Contract)</option>
                  </select>
                </div>
                {fieldErrors.employee_type && <span className="field-error-msg">{fieldErrors.employee_type}</span>}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="action-buttons">
            {currentStep > 0 && (
              <button className="btn btn-secondary" onClick={prevStep} type="button" disabled={isSubmitting}>
                ← ย้อนกลับ
              </button>
            )}

            {currentStep < steps.length - 1 && (
              <button
                className="btn btn-primary"
                onClick={nextStep}
                type="button"
                disabled={currentStep === 0 ? !isStep1Valid : !isStep2Valid}
              >
                ถัดไป →
              </button>
            )}

            {currentStep === steps.length - 1 && (
              <button
                className="btn btn-success"
                onClick={submitForm}
                type="button"
                disabled={!isStep3Valid || isSubmitting}
              >
                {isSubmitting ? <span className="spinner"></span> : '🚀 สมัครสมาชิก'}
              </button>
            )}

            <button className="btn btn-cancel" onClick={() => router.push('/login')} type="button" disabled={isSubmitting}>
              ยกเลิก
            </button>
          </div>

          {/* Footer */}
          <div className="register-footer">
            <p>
              มีบัญชีอยู่แล้ว? <a href="#" onClick={(e) => { e.preventDefault(); router.push('/login'); }}>เข้าสู่ระบบที่นี่</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}