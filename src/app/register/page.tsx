'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const SLIDES = [
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1600&q=80',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=80',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&q=80',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1600&q=80',
  'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1600&q=80',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&q=80' // Add 6th slide for rotation
];

type FormState = {
  username: ''; email: ''; password: ''; confirmPassword: '';
  emp_id: ''; first_name: ''; last_name: ''; gender: '';
  date_of_birth: ''; phone: ''; position: ''; department: '';
  start_date: ''; employee_type: ''; role: '';
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

  const steps = ['บัญชีผู้ใช้', 'ข้อมูลพนักงาน', 'ข้อมูลการทำงาน', 'สิทธิ์ระบบ'];
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState('');
  const [emailError, setEmailError] = useState('');

  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    emp_id: '', first_name: '', last_name: '', gender: '', date_of_birth: '', phone: '',
    position: '', department: '', start_date: '', employee_type: '', role: ''
  });

  const roles = [
    { value: 'admin', label: 'Admin', icon: '👑', desc: 'ผู้ดูแลระบบ – มีสิทธิ์เข้าถึงทุกส่วนของระบบ' },
    { value: 'hr', label: 'HR', icon: '📊', desc: 'ฝ่ายทรัพยากรบุคคล – จัดการข้อมูลพนักงานและรายงาน' },
    { value: 'employee', label: 'Employee', icon: '👤', desc: 'พนักงานทั่วไป – ดูข้อมูลส่วนตัวและลางาน' }
  ];

  const takenUsernames = ['admin', 'hr', 'test', 'user'];

  const passwordStrength = useMemo(() => {
    const pwd = form.password;
    if (!pwd) return { percent: 0, level: '', text: '' };

    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { percent: 20, level: 'weak', text: 'อ่อน' };
    if (score <= 2) return { percent: 40, level: 'fair', text: 'พอใช้' };
    if (score <= 3) return { percent: 60, level: 'good', text: 'ดี' };
    if (score <= 4) return { percent: 80, level: 'strong', text: 'แข็งแกร่ง' };
    return { percent: 100, level: 'excellent', text: 'ยอดเยี่ยม' };
  }, [form.password]);

  const checkUsername = () => {
    if (!form.username) {
      setUsernameStatus('');
      return;
    }
    if (takenUsernames.includes(form.username.toLowerCase())) {
      setUsernameStatus('taken');
    } else {
      setUsernameStatus('available');
    }
  };

  const validateEmailField = () => {
    if (!form.email) {
      setEmailError('');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setEmailError('รูปแบบ Email ไม่ถูกต้อง');
    } else {
      setEmailError('');
    }
  };

  const validateStep = (step: number) => {
    const errs: string[] = [];

    if (step === 0) {
      if (!form.username) errs.push('กรุณากรอก Username');
      if (usernameStatus === 'taken') errs.push('Username นี้ถูกใช้แล้ว');
      if (!form.email) errs.push('กรุณากรอก Email');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (form.email && !emailRegex.test(form.email)) {
        errs.push('รูปแบบ Email ไม่ถูกต้อง');
      }
      if (!form.password) errs.push('กรุณากรอก Password');
      if (form.password && form.password.length < 6) {
        errs.push('Password ต้องมีอย่างน้อย 6 ตัวอักษร');
      }
      if (!form.confirmPassword) errs.push('กรุณายืนยัน Password');
      if (form.password !== form.confirmPassword) {
        errs.push('Password ไม่ตรงกัน');
      }
    }

    if (step === 1) {
      if (!form.emp_id) errs.push('กรุณากรอกรหัสพนักงาน');
      if (!form.first_name) errs.push('กรุณากรอกชื่อ');
      if (!form.last_name) errs.push('กรุณากรอกนามสกุล');
      if (!form.gender) errs.push('กรุณาเลือกเพศ');
      if (!form.date_of_birth) errs.push('กรุณากรอกวันเกิด');
      if (!form.phone) errs.push('กรุณากรอกเบอร์โทรศัพท์');
    }

    if (step === 2) {
      if (!form.position) errs.push('กรุณากรอกตำแหน่ง');
      if (!form.department) errs.push('กรุณากรอกแผนก');
      if (!form.start_date) errs.push('กรุณากรอกวันที่เริ่มงาน');
      if (!form.employee_type) errs.push('กรุณาเลือกประเภทพนักงาน');
    }

    if (step === 3) {
      if (!form.role) errs.push('กรุณาเลือกสิทธิ์การใช้งาน');
    }

    return errs;
  };

  const nextStep = () => {
    const errs = validateStep(currentStep);
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setCurrentStep(s => s + 1);
  };

  const prevStep = () => {
    setErrors([]);
    setCurrentStep(s => s - 1);
  };

  const goToStep = (idx: number) => {
    if (idx < currentStep) {
      setErrors([]);
      setCurrentStep(idx);
    }
  };

  const submitForm = async () => {
    const errs = validateStep(currentStep);
    if (errs.length) {
      setErrors(errs);
      return;
    }

    setErrors([]);
    setIsSubmitting(true);

    try {
      // สร้าง payload ที่ตรงกับ API (ไม่ส่ง confirmPassword)
      const { confirmPassword, role, ...rest } = form;
      const payload = { ...rest };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        setSuccessMessage('สมัครสมาชิกสำเร็จ! กำลังไปหน้าเข้าสู่ระบบ...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setErrors([data.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก']);
        setIsSubmitting(false);
      }
    } catch {
      setErrors(['เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์']);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
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
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          background: linear-gradient(
            135deg,
            rgba(0, 40, 80, 0.75),
            rgba(0, 120, 200, 0.45)
          );
        }

        .register-panel {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 720px;
          padding: 35px 40px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.6s ease-out;
          color: #fff;
        }

        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .register-header {
          text-align: center;
          margin-bottom: 25px;
        }

        .register-logo {
          width: 60px;
          display: block;
          margin: 0 auto 8px;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
        }

        .system-title {
          font-weight: 800;
          font-size: 22px;
          letter-spacing: 2px;
          margin: 0;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          margin: 4px 0 0;
        }

        .step-indicator {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 25px;
          flex-wrap: wrap;
        }

        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          opacity: 0.5;
          transition: all 0.3s ease;
          min-width: 80px;
        }

        .step-item.active { opacity: 1; }
        .step-item.completed { opacity: 0.85; cursor: pointer; }

        .step-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .step-item.active .step-circle {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          border-color: transparent;
          box-shadow: 0 0 15px rgba(37, 99, 235, 0.5);
        }

        .step-item.completed .step-circle {
          background: linear-gradient(135deg, #10b981, #059669);
          border-color: transparent;
        }

        .step-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          text-align: center;
        }
        .step-item.active .step-label { color: #fff; font-weight: 600; }

        .error-box {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 18px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .error-box ul { list-style: none; margin: 0; padding: 0; }
        .error-box li { font-size: 13px; color: #fca5a5; margin-bottom: 3px; }
        .error-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }

        .success-box {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.4);
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 18px;
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .success-box p { margin: 0; font-size: 14px; color: #6ee7b7; font-weight: 600; }
        .success-icon { font-size: 20px; }

        .form-section { margin-bottom: 10px; }
        .section-title {
          font-size: 16px; font-weight: 700; margin: 0 0 18px; display: flex; align-items: center; gap: 8px; color: #e0e7ff;
        }
        .section-icon { font-size: 20px; }

        .input-row { margin-bottom: 14px; }
        .input-row.two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        .input-group label { display: block; font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, 0.8); margin-bottom: 5px; }
        .required { color: #f87171; }

        .input-field {
          display: flex; align-items: center; background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 10px; padding: 10px 12px; transition: all 0.3s ease;
        }
        .input-field:focus-within { border-color: #60a5fa; background: rgba(255, 255, 255, 0.15); box-shadow: 0 0 12px rgba(96, 165, 250, 0.2); }
        .field-icon { margin-right: 8px; font-size: 16px; flex-shrink: 0; }
        .input-field input, .input-field select { border: none; background: none; width: 100%; font-size: 14px; color: #fff; outline: none; }
        .input-field input::placeholder { color: rgba(255, 255, 255, 0.4); }
        .input-field select { cursor: pointer; }
        .input-field select option { background: #1e293b; color: #fff; }
        
        .toggle-pass { cursor: pointer; font-size: 16px; margin-left: 6px; user-select: none; }
        .field-error { display: block; font-size: 12px; color: #fca5a5; margin-top: 4px; }
        .field-success { display: block; font-size: 12px; color: #6ee7b7; margin-top: 4px; }

        .password-strength { margin-top: 6px; display: flex; align-items: center; gap: 8px; }
        .strength-bar { flex: 1; height: 4px; background: rgba(255, 255, 255, 0.15); border-radius: 2px; overflow: hidden; }
        .strength-fill { height: 100%; border-radius: 2px; transition: width 0.3s ease, background 0.3s ease; }
        .strength-fill.weak { background: #ef4444; } .strength-fill.fair { background: #f97316; }
        .strength-fill.good { background: #eab308; } .strength-fill.strong { background: #22c55e; }
        .strength-fill.excellent { background: #10b981; }
        .strength-text { font-size: 11px; font-weight: 600; }
        .strength-text.weak { color: #fca5a5; } .strength-text.fair { color: #fdba74; }
        .strength-text.good { color: #fde047; } .strength-text.strong { color: #86efac; }
        .strength-text.excellent { color: #6ee7b7; }

        .role-selector { display: flex; flex-direction: column; gap: 12px; }
        .role-card {
          display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 14px;
          background: rgba(255, 255, 255, 0.06); border: 2px solid rgba(255, 255, 255, 0.1); cursor: pointer; transition: all 0.3s ease; position: relative;
        }
        .role-card:hover { background: rgba(255, 255, 255, 0.12); border-color: rgba(96, 165, 250, 0.3); transform: translateX(4px); }
        .role-card.selected { background: rgba(37, 99, 235, 0.15); border-color: #2563eb; box-shadow: 0 0 20px rgba(37, 99, 235, 0.2); }
        .role-icon { font-size: 32px; flex-shrink: 0; }
        .role-info h4 { margin: 0 0 3px; font-size: 15px; font-weight: 700; }
        .role-info p { margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.6); }
        .role-check {
          position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;
          animation: popIn 0.3s ease;
        }
        @keyframes popIn { from { transform: translateY(-50%) scale(0); } to { transform: translateY(-50%) scale(1); } }

        .action-buttons { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
        .btn { padding: 12px 24px; border: none; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 6px; }
        .btn-primary { flex: 1; justify-content: center; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4); }
        .btn-secondary { background: rgba(255, 255, 255, 0.1); color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); }
        .btn-secondary:hover { background: rgba(255, 255, 255, 0.2); }
        .btn-success { flex: 1; justify-content: center; background: linear-gradient(135deg, #10b981, #059669); color: #fff; }
        .btn-success:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); }
        .btn-success:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .btn-cancel { background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
        .btn-cancel:hover { background: rgba(239, 68, 68, 0.25); }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .register-footer { text-align: center; margin-top: 20px; font-size: 13px; color: rgba(255, 255, 255, 0.6); }
        .register-footer a { color: #60a5fa; text-decoration: none; font-weight: 600; transition: color 0.2s; }
        .register-footer a:hover { color: #93c5fd; text-decoration: underline; }

        @media (max-width: 600px) {
          .register-panel { padding: 24px 20px; }
          .input-row.two-cols { grid-template-columns: 1fr; }
          .step-indicator { gap: 4px; }
          .step-label { font-size: 10px; }
          .step-circle { width: 30px; height: 30px; font-size: 12px; }
        }
      ` }} />

      <div
        className="register-wrapper"
        style={{ backgroundImage: `url(${SLIDES[currentSlide]})` }}
      >
        <div className="overlay"></div>

        <div className="register-panel">
          {/* Header */}
          <div className="register-header">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3063/3063176.png"
              className="register-logo"
              alt="logo"
            />
            <h2 className="system-title">HOSPITAL HRM</h2>
            <p className="subtitle">สมัครสมาชิกระบบ Human Resource Management</p>
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

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="error-box">
              <div className="error-icon">⚠️</div>
              <ul>
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="success-box">
              <div className="success-icon">✅</div>
              <p>{successMessage}</p>
            </div>
          )}

          {/* Step 1: Account Information */}
          <form
            style={{ display: currentStep === 0 ? 'block' : 'none' }}
            className="form-section"
            onSubmit={e => { e.preventDefault(); nextStep(); }}
            autoComplete="on"
          >
            <h3 className="section-title">
              <span className="section-icon">🔐</span>
              ข้อมูลบัญชีผู้ใช้
            </h3>

            <div className="input-row">
              <div className="input-group">
                <label>Username <span className="required">*</span></label>
                <div className="input-field">
                  <span className="field-icon">👤</span>
                  <input
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="กรอกชื่อผู้ใช้"
                    onBlur={checkUsername}
                    autoComplete="username"
                  />
                </div>
                {usernameStatus === 'taken' && <span className="field-error">❌ Username นี้ถูกใช้แล้ว</span>}
                {usernameStatus === 'available' && <span className="field-success">✅ Username นี้สามารถใช้ได้</span>}
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Email <span className="required">*</span></label>
                <div className="input-field">
                  <span className="field-icon">📧</span>
                  <input
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    type="email"
                    placeholder="example@hospital.com"
                    onBlur={validateEmailField}
                    autoComplete="email"
                  />
                </div>
                {emailError && <span className="field-error">❌ {emailError}</span>}
              </div>
            </div>

            <div className="input-row two-cols">
              <div className="input-group">
                <label>Password <span className="required">*</span></label>
                <div className="input-field">
                  <span className="field-icon">🔒</span>
                  <input
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="กรอกรหัสผ่าน"
                    autoComplete="new-password"
                  />
                  <span className="toggle-pass" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '🙈' : '👁️'}
                  </span>
                </div>
                {/* Password Strength */}
                {form.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div
                        className={`strength-fill ${passwordStrength.level}`}
                        style={{ width: `${passwordStrength.percent}%` }}
                      ></div>
                    </div>
                    <span className={`strength-text ${passwordStrength.level}`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>Confirm Password <span className="required">*</span></label>
                <div className="input-field">
                  <span className="field-icon">🔒</span>
                  <input
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="ยืนยันรหัสผ่าน"
                    autoComplete="new-password"
                  />
                  <span className="toggle-pass" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </span>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <span className="field-error">❌ รหัสผ่านไม่ตรงกัน</span>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && form.password && (
                  <span className="field-success">✅ รหัสผ่านตรงกัน</span>
                )}
              </div>
            </div>
          </form>

          {/* Step 2: Employee Information */}
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }} className="form-section">
            <h3 className="section-title">
              <span className="section-icon">📋</span>
              ข้อมูลพนักงาน
            </h3>

            <div className="input-row two-cols">
              <div className="input-group">
                <label>รหัสพนักงาน <span className="required">*</span></label>
                <div className="input-field">
                  <span className="field-icon">🏷️</span>
                  <input
                    value={form.emp_id}
                    onChange={e => setForm(f => ({ ...f, emp_id: e.target.value }))}
                    placeholder="EMP-XXXX"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>เพศ <span className="required">*</span></label>
                <div className="input-field select-field">
                  <span className="field-icon">⚧</span>
                  <select
                    value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  >
                    <option value="" disabled>เลือกเพศ</option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                    <option value="other">อื่น ๆ</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="input-row two-cols">
              <div className="input-group">
                <label>ชื่อ <span className="required">*</span></label>
                <div className="input-field">
                  <span className="field-icon">✏️</span>
                  <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="กรอกชื่อ" />
                </div>
              </div>

              <div className="input-group">
                <label>นามสกุล <span className="required">*</span></label>
                <div className="input-field">
                  <span className="field-icon">✏️</span>
                  <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="กรอกนามสกุล" />
                </div>
              </div>
            </div>

            <div className="input-row two-cols">
              <div className="input-group">
                <label>วันเกิด <span className="required">*</span></label>
                <div className="input-field">
                  <span className="field-icon">📅</span>
                  <input value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} type="date" />
                </div>
              </div>

              <div className="input-group">
                <label>เบอร์โทรศัพท์ <span className="required">*</span></label>
                <div className="input-field">
                  <span className="field-icon">📱</span>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0XX-XXX-XXXX" />
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Work Information */}
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }} className="form-section">
            <h3 className="section-title">
              <span className="section-icon">💼</span>
              ข้อมูลการทำงาน
            </h3>

            <div className="input-row two-cols">
              <div className="input-group">
                <label>ตำแหน่ง <span className="required">*</span></label>
                <div className="input-field">
                  <span className="field-icon">🎯</span>
                  <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="กรอกตำแหน่ง" />
                </div>
              </div>

              <div className="input-group">
                <label>แผนก <span className="required">*</span></label>
                <div className="input-field">
                  <span className="field-icon">🏢</span>
                  <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="กรอกแผนก" />
                </div>
              </div>
            </div>

            <div className="input-row two-cols">
              <div className="input-group">
                <label>วันที่เริ่มงาน <span className="required">*</span></label>
                <div className="input-field">
                  <span className="field-icon">📅</span>
                  <input value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} type="date" />
                </div>
              </div>

              <div className="input-group">
                <label>ประเภทพนักงาน <span className="required">*</span></label>
                <div className="input-field select-field">
                  <span className="field-icon">📝</span>
                  <select value={form.employee_type} onChange={e => setForm(f => ({ ...f, employee_type: e.target.value }))}>
                    <option value="" disabled>เลือกประเภท</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Role / Permission */}
          <div style={{ display: currentStep === 3 ? 'block' : 'none' }} className="form-section">
            <h3 className="section-title">
              <span className="section-icon">🛡️</span>
              สิทธิ์การใช้งานระบบ
            </h3>

            <div className="role-selector">
              {roles.map(role => (
                <div
                  key={role.value}
                  className={`role-card ${form.role === role.value ? 'selected' : ''}`}
                  onClick={() => setForm(f => ({ ...f, role: role.value }))}
                >
                  <div className="role-icon">{role.icon}</div>
                  <div className="role-info">
                    <h4>{role.label}</h4>
                    <p>{role.desc}</p>
                  </div>
                  {form.role === role.value && <div className="role-check">✓</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="action-buttons">
            {currentStep > 0 && (
              <button className="btn btn-secondary" onClick={prevStep}>
                ← ย้อนกลับ
              </button>
            )}

            {currentStep < steps.length - 1 && (
              <button
                className="btn btn-primary"
                onClick={nextStep}
                type={currentStep === 0 ? 'submit' : 'button'}
                form={currentStep === 0 ? undefined : undefined}
              >
                ถัดไป →
              </button>
            )}

            {currentStep === steps.length - 1 && (
              <button
                className="btn btn-success"
                onClick={submitForm}
                disabled={isSubmitting}
              >
                {isSubmitting ? <span className="spinner"></span> : null}
                {isSubmitting ? ' กำลังสมัคร...' : ' 🚀 สมัครสมาชิก'}
              </button>
            )}

            <button className="btn btn-cancel" onClick={() => router.push('/login')}>
              ยกเลิก
            </button>
          </div>

          {/* Footer */}
          <div className="register-footer">
            <p>
              มีบัญชีอยู่แล้ว?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); router.push('/login'); }}>เข้าสู่ระบบ</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}