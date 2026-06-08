import { useState, useEffect, useRef } from 'react';
import { Heart, Send, RefreshCw, Activity, Download, User, ClipboardList, Mic, MicOff, Volume2, VolumeX, Moon, Sun, Info, Shield, Zap, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, } from 'recharts';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
}

const QUESTIONS = [
  { key: 'name', question: "Before we begin, what is your name?", type: 'text' },
  { key: 'age', question: "What is your age?", type: 'number', min: 1, max: 120 },
  { key: 'sex', question: "What is your gender?", type: 'choice', options: [{ label: 'Male', value: 1 }, { label: 'Female', value: 0 }] },
  { key: 'cp', question: "Chest pain type?", type: 'choice', options: [
    { label: 'Typical Angina', value: 0 }, { label: 'Atypical Angina', value: 1 },
    { label: 'Non-anginal Pain', value: 2 }, { label: 'Asymptomatic', value: 3 }
  ], info: "Angina is chest pain caused by reduced blood flow to the heart." },
  { key: 'trestbps', question: "Resting blood pressure (mm Hg)?", type: 'number', min: 50, max: 250, info: "Normal: <120/80. Elevated: 120-129. Hypertension: >130." },
  { key: 'chol', question: "Serum cholesterol (mg/dl)?", type: 'number', min: 100, max: 600, info: "Healthy: <200 mg/dL. Borderline: 200-239. High: >240." },
  { key: 'fbs', question: "Fasting blood sugar > 120 mg/dl?", type: 'choice', options: [{ label: 'Yes', value: 1 }, { label: 'No', value: 0 }], info: "Normal: 70-99 mg/dL. Prediabetes: 100-125. Diabetes: >126." },
  { key: 'restecg', question: "Resting ECG results?", type: 'choice', options: [
    { label: 'Normal', value: 0 }, { label: 'ST-T Wave Abnormality', value: 1 }, { label: 'Left Ventricular Hypertrophy', value: 2 }
  ]},
  { key: 'thalach', question: "Maximum heart rate achieved?", type: 'number', min: 60, max: 220, info: "Typical max heart rate is roughly 220 minus your age." },
  { key: 'exang', question: "Exercise induced angina?", type: 'choice', options: [{ label: 'Yes', value: 1 }, { label: 'No', value: 0 }] },
  { key: 'oldpeak', question: "ST depression (Oldpeak)?", type: 'number', min: 0, max: 10 },
  { key: 'slope', question: "Slope of peak exercise ST segment?", type: 'choice', options: [
    { label: 'Upsloping', value: 0 }, { label: 'Flat', value: 1 }, { label: 'Downsloping', value: 2 }
  ]},
  { key: 'ca', question: "Number of major vessels (0-3)?", type: 'number', min: 0, max: 3 },
  { key: 'thal', question: "Thalassemia (Thallium Test)?", type: 'choice', options: [
    { label: 'Normal', value: 1 }, { label: 'Fixed Defect', value: 2 }, { label: 'Reversable Defect', value: 3 }
  ], info: "Normal: Good flow. Fixed: Permanent damage. Reversible: Blockage risk during exercise." },
];

const AdvancedChartIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="advanced-chart-icon">
    <defs>
      <linearGradient id="chart-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
      <linearGradient id="chart-grad-accent" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
      </linearGradient>
      <filter id="icon-glow">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Base Axis */}
    <path d="M3 3v16a2 2 0 0 0 2 2h16" stroke="url(#chart-grad-main)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Animated Bars */}
    <g filter="url(#icon-glow)">
      <rect x="7" y="13" width="3" height="5" rx="1" fill="url(#chart-grad-main)" className="bar-1">
        <animate attributeName="height" values="5;9;5" dur="3s" repeatCount="indefinite" />
        <animate attributeName="y" values="13;9;13" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="12" y="5" width="3" height="13" rx="1" fill="url(#chart-grad-main)" className="bar-2">
        <animate attributeName="height" values="13;7;13" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="y" values="5;11;5" dur="2.5s" repeatCount="indefinite" />
      </rect>
      <rect x="17" y="9" width="3" height="9" rx="1" fill="url(#chart-grad-main)" className="bar-3">
        <animate attributeName="height" values="9;14;9" dur="4s" repeatCount="indefinite" />
        <animate attributeName="y" values="9;4;9" dur="4s" repeatCount="indefinite" />
      </rect>
    </g>
    
    {/* Connecting Line (Tech aesthetic) */}
    <path d="M7 14L12 6L17 10" stroke="white" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="2 2" />
  </svg>
);

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hi, I'm HeartSync AI. I'll guide you through a quick heart health assessment.", sender: 'bot' }
  ]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [formData, setFormData] = useState<any>({});
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Speech Recognition Setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInputValue('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.sender === 'bot') {
      speak(lastMessage.text);
    }
  }, [messages]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const handleSend = (value: string | number, label?: string) => {
    const userText = label || value.toString();
    setMessages(prev => [...prev, { id: Date.now(), text: userText, sender: 'user' }]);
    
    if (currentStep === -1) {
      setCurrentStep(0);
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), text: QUESTIONS[0].question, sender: 'bot' }]);
      }, 500);
    } else {
      const updatedData = { ...formData, [QUESTIONS[currentStep].key]: value };
      setFormData(updatedData);
      
      if (currentStep < QUESTIONS.length - 1) {
        const next = currentStep + 1;
        setCurrentStep(next);
        setTimeout(() => {
          setMessages(prev => [...prev, { id: Date.now(), text: QUESTIONS[next].question, sender: 'bot' }]);
        }, 500);
      } else {
        // Prepare data for prediction (exclude non-medical 'name' field)
        const { name, ...medicalData } = updatedData;
        performPrediction(medicalData);
      }
    }
    setInputValue('');
  };

  const performPrediction = async (data: any) => {
    setIsProcessing(true);
    setMessages(prev => [...prev, { id: Date.now(), text: "Analyzing your results using our AI model...", sender: 'bot' }]);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await response.json();
      setResult(resData);
      setMessages(prev => [...prev, { id: Date.now(), text: "Analysis complete. I've generated your risk profile.", sender: 'bot' }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now(), text: "I'm having trouble connecting to the medical server. Please try again.", sender: 'bot' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const primaryColor = [37, 99, 235];
    
    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('HeartSync AI Clinical Report', 20, 25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Advanced Cardiovascular Risk Assessment', 20, 35);
    
    // Patient Info Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Information', 20, 60);
    doc.line(20, 62, 190, 62);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${formData.name || 'N/A'}`, 20, 72);
    doc.text(`Age: ${formData.age}`, 80, 72);
    doc.text(`Gender: ${formData.sex === 1 ? 'Male' : 'Female'}`, 140, 72);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 80);
    doc.text(`Report ID: HS-${Math.floor(Math.random() * 1000000)}`, 140, 80);
    
    // Executive Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Risk Assessment Summary', 20, 100);
    doc.line(20, 102, 190, 102);
    
    const riskColor = result.risk_level === 'High' ? [239, 68, 68] : [34, 197, 94];
    doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.setFontSize(18);
    doc.text(`${result.risk_level} Risk Level`, 20, 115);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Probability Score: ${(result.probability * 100).toFixed(1)}%`, 20, 125);
    
    // Medical Metrics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Clinical Data Points', 20, 145);
    doc.line(20, 147, 190, 147);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const metrics = [
      ['Resting BP', `${formData.trestbps} mmHg`, 'Normal: <120'],
      ['Cholesterol', `${formData.chol} mg/dL`, 'Healthy: <200'],
      ['Max Heart Rate', `${formData.thalach} BPM`, 'Avg: 220-Age'],
      ['ST Depression', `${formData.oldpeak}`, 'Normal: <1.0'],
    ];
    
    metrics.forEach((m, i) => {
      doc.text(m[0], 25, 157 + i * 10);
      doc.text(m[1], 80, 157 + i * 10);
      doc.setTextColor(100, 100, 100);
      doc.text(m[2], 140, 157 + i * 10);
      doc.setTextColor(0, 0, 0);
    });
    
    // Contributing Factors
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Primary AI Risk Drivers', 20, 210);
    doc.line(20, 212, 190, 212);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    result.top_factors?.forEach((f: string, i: number) => {
      doc.text(`\u2022 ${f}`, 25, 222 + i * 10);
    });
    
    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Disclaimer: This report is generated by HeartSync AI for informational purposes only.', 20, 275);
    doc.text('It is not a substitute for professional medical advice, diagnosis, or treatment.', 20, 280);
    doc.text('Always seek the advice of your physician with any questions regarding a medical condition.', 20, 285);
    
    doc.save(`HeartSync_Report_${formData.name || 'Patient'}.pdf`);
  };

  const progress = currentStep === -1 ? 0 : ((currentStep + 1) / QUESTIONS.length) * 100;

  /*const radarData = result ? [
    { subject: 'BP', A: formData.trestbps, fullMark: 200 },
    { subject: 'Chol', A: formData.chol / 2, fullMark: 200 },
    { subject: 'Heart Rate', A: formData.thalach, fullMark: 200 },
    { subject: 'ST Dep.', A: formData.oldpeak * 20, fullMark: 200 },
    { subject: 'Vessels', A: formData.ca * 50, fullMark: 200 },
  ] : [];*/

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="progress-header">
        <motion.div 
          className="progress-fill" 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>
      
      <header>
        <div className="logo">
          <Heart color="#2563eb" fill="#2563eb" size={24} className="heart-icon" />
          <h1>SK HeartSync AI</h1>
        </div>
        <div className="header-actions">
          <button onClick={() => setIsMuted(!isMuted)} className="icon-btn">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="icon-btn">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {result && (
            <button onClick={() => window.location.reload()} className="icon-btn">
              <RefreshCw size={20} />
            </button>
          )}
        </div>
      </header>

      <div className="chat-window">
        <AnimatePresence>
          {messages.map(m => (
            <motion.div 
              key={m.id} 
              initial={{ opacity: 0, x: m.sender === 'bot' ? -20 : 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              className={`message-wrapper ${m.sender === 'bot' ? 'bot-wrapper' : 'user-wrapper'}`}
            >
              {m.sender === 'bot' && (
                <div className="avatar bot-avatar">
                  <Activity size={16} color="white" />
                </div>
              )}
              <div className={`message ${m.sender === 'bot' ? 'bot-message' : 'user-message'}`}>
                {m.text}
              </div>
              {m.sender === 'user' && (
                <div className="avatar user-avatar">
                  <User size={16} color="white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isProcessing && (
          <div className="typing-indicator-wrapper">
            <div className="avatar bot-avatar">
              <Activity size={16} color="white" />
            </div>
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className={`risk-card ${result.risk_level === 'High' ? 'risk-high' : 'risk-low'}`}
          >
            <div className="report-personalized-header">
              <div className="user-profile-header">
                <div className="user-avatar-large">
                  <User size={24} color="white" />
                </div>
                <div>
                  <h2 className="user-greeting">Health Report for {formData.name || 'Guest'}</h2>
                  <p className="report-date">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              <div className="card-header">
                <div className="risk-badge">
                  {result.risk_level === 'High' ? <AlertCircle size={20} /> : <Shield size={20} />}
                  <span>{result.risk_level} Cardiovascular Risk</span>
                </div>
                <div className="action-btns">
                  <button className="action-icon-btn" title="Toggle Detailed Stats" onClick={() => setShowDashboard(!showDashboard)}>
                    <AdvancedChartIcon size={20} />
                  </button>
                  <button className="action-icon-btn" title="Download Report" onClick={generatePDF}>
                    <Download size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="dashboard-main">
              <div className="gauge-container">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Pie
                      data={[
                        { name: 'Risk', value: result.probability * 100 },
                        { name: 'Remaining', value: 100 - (result.probability * 100) }
                      ]}
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={0}
                      dataKey="value"
                      isAnimationActive={true}
                    >
                      <Cell fill={result.risk_level === 'High' ? '#ef4444' : '#22c55e'} />
                      <Cell fill={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="gauge-center-text">
                  <span className="gauge-value">{(result.probability * 100).toFixed(0)}%</span>
                  <span className="gauge-label">Risk Score</span>
                </div>
              </div>
            </div>

            <div className="clinical-summary">
              <div className="summary-title"><ClipboardList size={16} /> Patient Summary</div>
              <p>Based on our SK AI analysis, <strong>{formData.name}</strong> has a <strong>{result.risk_level.toLowerCase()}</strong> probability of underlying cardiovascular issues. The most significant factors contributing to this assessment are listed below.</p>
            </div>
            
            <AnimatePresence>
              {showDashboard && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="dashboard-container"
                >
                  <div className="chart-section">
                    <h4>Clinical Benchmarks Comparison</h4>
                    <div style={{ height: 180, width: '100%' }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={[
                            { name: 'BP', User: formData.trestbps, Normal: 120 },
                            { name: 'Chol', User: formData.chol / 2, Normal: 100 },
                            { name: 'HR', User: formData.thalach, Normal: 150 },
                            { name: 'Peak', User: formData.oldpeak * 20, Normal: 20 },
                          ]}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? "#94a3b8" : "#64748b" }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? "#94a3b8" : "#64748b" }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", borderColor: isDarkMode ? "#334155" : "#e2e8f0", borderRadius: '8px' }}
                            itemStyle={{ fontSize: '12px' }}
                          />
                          <Bar dataKey="User" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
                          <Bar dataKey="Normal" fill={isDarkMode ? "#334155" : "#cbd5e1"} radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-card">
                      <User size={14} className="stat-icon" />
                      <span className="stat-label">Age</span>
                      <span className="stat-value">{formData.age}</span>
                    </div>
                    <div className="stat-card">
                      <Activity size={14} className="stat-icon" />
                      <span className="stat-label">BP</span>
                      <span className="stat-value">{formData.trestbps}</span>
                    </div>
                    <div className="stat-card">
                      <Zap size={14} className="stat-icon" />
                      <span className="stat-label">Chol</span>
                      <span className="stat-value">{formData.chol}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {result.top_factors?.length > 0 && (
              <div className="explanation-section">
                <h3>Primary Risk Drivers</h3>
                <div className="factor-tags">
                  {result.top_factors.map((f: string, i: number) => (
                    <span key={i} className="factor-tag">
                      <Activity size={10} style={{ marginRight: '4px' }} />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="thal-guide">
              <h4>Understanding Thallium Results</h4>
              <div className="guide-grid">
                <div className="guide-item">
                  <span className="dot normal"></span>
                  <strong>Normal:</strong> Optimal blood flow during activity.
                </div>
                <div className="guide-item">
                  <span className="dot fixed"></span>
                  <strong>Fixed Defect:</strong> Evidence of previous heart tissue damage.
                </div>
                <div className="guide-item">
                  <span className="dot reversible"></span>
                  <strong>Reversible:</strong> Potential blockage detectable under stress.
                </div>
              </div>
            </div>
            
            <p className="disclaimer-text">
              <Info size={12} /> SK AI analysis is for educational use. Consult a doctor for diagnosis.
            </p>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="input-area">
        <AnimatePresence mode="wait">
          {currentStep === -1 && !result ? (
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="primary-btn" 
              onClick={() => handleSend("Start")}
            >
              Begin Health Assessment
            </motion.button>
          ) : QUESTIONS[currentStep]?.type === 'choice' ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="options-grid"
            >
              {QUESTIONS[currentStep].options?.map(opt => (
                <button key={opt.value} className="option-btn" onClick={() => handleSend(opt.value, opt.label)}>
                  {opt.label}
                </button>
              ))}
            </motion.div>
          ) : QUESTIONS[currentStep]?.type === 'number' || QUESTIONS[currentStep]?.type === 'text' ? (
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="input-group" 
              onSubmit={(e) => { e.preventDefault(); if(inputValue) handleSend(inputValue); }}
            >
              <div className="input-with-addons">
                <input 
                  type={QUESTIONS[currentStep].type} 
                  placeholder={`Enter ${QUESTIONS[currentStep].key}...`} 
                  value={inputValue} 
                  onChange={(e) => setInputValue(e.target.value)} 
                  autoFocus 
                  min={QUESTIONS[currentStep].min}
                  max={QUESTIONS[currentStep].max}
                />
                <button 
                  type="button" 
                  onClick={toggleListening} 
                  className={`mic-btn ${isListening ? 'listening' : ''}`}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              </div>
              <button className="send-btn" type="submit" disabled={!inputValue}>
                <Send size={20} />
              </button>
            </motion.form>
          ) : result ? (
            <button className="primary-btn secondary" onClick={() => window.location.reload()}>
              Restart Assessment
            </button>
          ) : null}
        </AnimatePresence>
        
        {currentStep >= 0 && QUESTIONS[currentStep]?.info && (
          <div className="step-hint">
            <Info size={14} /> {QUESTIONS[currentStep].info}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

