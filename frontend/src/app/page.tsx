'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  liked?: boolean | null;
}

interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

const MEDICAL_CATEGORIES = [
  { id: 'all', label: 'All Topics', icon: '🩺' },
  { id: 'cardio', label: 'Cardiology', icon: '🫀' },
  { id: 'diabetes', label: 'Endocrinology', icon: '🩸' },
  { id: 'pharma', label: 'Pharmacology', icon: '💊' },
  { id: 'neuro', label: 'Neurology', icon: '🧠' },
];

const BENTO_CARDS = [
  {
    category: 'cardio',
    tag: 'HYPERTENSION',
    icon: '🫀',
    title: 'Blood Pressure Guidelines',
    desc: 'What are the official clinical stages of hypertension and lifestyle control measures?',
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  {
    category: 'diabetes',
    tag: 'METABOLIC HEALTH',
    icon: '🩸',
    title: 'Diabetes Early Indicators',
    desc: 'What are early signs of Type 2 diabetes, HbA1c thresholds, and preventative habits?',
    gradient: 'linear-gradient(135deg, rgba(13, 242, 200, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
    borderColor: 'rgba(13, 242, 200, 0.35)',
  },
  {
    category: 'pharma',
    tag: 'MEDICATION SAFETY',
    icon: '💊',
    title: 'Drug Interaction & Side Effects',
    desc: 'How do common ACE inhibitors and Beta-blockers differ in mechanism and contraindications?',
    gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  {
    category: 'neuro',
    tag: 'DIAGNOSTICS',
    icon: '🧠',
    title: 'Migraine vs Cluster Headache',
    desc: 'How can you clinically differentiate migraines from tension and cluster headaches?',
    gradient: 'linear-gradient(135deg, rgba(0, 210, 255, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
    borderColor: 'rgba(0, 210, 255, 0.35)',
  },
  {
    category: 'all',
    tag: 'PREVENTATIVE CARE',
    icon: '🌿',
    title: 'Natural Cholesterol Management',
    desc: 'What dietary changes and natural interventions are proven to lower LDL cholesterol?',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(13, 242, 200, 0.15) 100%)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  {
    category: 'all',
    tag: 'SYMPTOM CHECK',
    icon: '⚡',
    title: 'Emergency Red Flag Symptoms',
    desc: 'What critical symptoms require immediate emergency room attention rather than home care?',
    gradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(251, 146, 60, 0.15) 100%)',
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
];

export default function MedicalAssistantApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  // Emergency notice removed for clean UI

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('auramed_history');
      if (saved) {
        setChatHistory(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save history on changes
  const saveCurrentSession = (msgs: Message[]) => {
    if (msgs.length === 0) return;
    const session: ChatSession = {
      id: Date.now().toString(),
      title: msgs[0]?.content.slice(0, 38) + (msgs[0]?.content.length > 38 ? '...' : ''),
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      messages: msgs,
    };
    setChatHistory((prev) => {
      const updated = [session, ...prev.filter((s) => s.id !== session.id)].slice(0, 10);
      try {
        localStorage.setItem('auramed_history', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to retrieve response');

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMessages = [...newMessages, botMessage];
      setMessages(finalMessages);
      saveCurrentSession(finalMessages);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Consultation Notice: ${err.message || 'The clinical knowledge base is currently reconnecting. Please try your query again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speakText = (text: string, id: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeakingId === id) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);
    setIsSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleFeedback = (id: string, liked: boolean) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, liked: m.liked === liked ? null : liked } : m))
    );
  };

  const clearChat = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setMessages([]);
  };

  const loadPastSession = (session: ChatSession) => {
    setMessages(session.messages);
    setIsSidebarOpen(false);
  };

  const exportChat = () => {
    if (messages.length === 0) return;
    const text = messages
      .map((m) => `[${m.timestamp}] ${m.role.toUpperCase()}:\n${m.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical_consultation_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredCards =
    selectedCategory === 'all'
      ? BENTO_CARDS
      : BENTO_CARDS.filter((c) => c.category === selectedCategory || c.category === 'all');

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Background Ambience */}
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
        <div className="grid-overlay" />
      </div>

      {/* Collapsible History Sidebar */}
      <aside
        style={{
          width: isSidebarOpen ? '300px' : '0px',
          transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          backgroundColor: 'rgba(7, 11, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: isSidebarOpen ? '1px solid var(--border-subtle)' : 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          position: 'relative',
        }}
      >
        <div style={{ padding: '1.25rem 1.25rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              CONSULTATIONS
            </span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              ✕
            </button>
          </div>
          <button
            onClick={() => {
              clearChat();
              setIsSidebarOpen(false);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, rgba(13, 242, 200, 0.15) 0%, rgba(0, 210, 255, 0.15) 100%)',
              border: '1px solid var(--border-bright)',
              color: '#0df2c8',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ✚ New Consultation
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {chatHistory.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '2rem' }}>
              No previous consultations yet.
            </p>
          ) : (
            chatHistory.map((s) => (
              <div
                key={s.id}
                onClick={() => loadPastSession(s)}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(13, 242, 200, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  {s.date} • {s.messages.length} messages
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          <p>🔒 HIPAA & GDPR Privacy Compliant Simulation</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 10 }}>
        {/* Global Navigation Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.5rem',
            backgroundColor: 'rgba(10, 16, 31, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Toggle consultation history"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                transition: 'all 0.2s',
              }}
            >
              ☰
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0df2c8 0%, #00d2ff 50%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.35rem',
                  boxShadow: '0 0 20px rgba(13, 242, 200, 0.35)',
                  position: 'relative',
                }}
              >
                🩺
                <div
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    border: '2px solid #050811',
                    animation: 'pulseGlow 2s infinite',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff 0%, #0df2c8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    AURA MED
                  </h1>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      fontWeight: 600,
                    }}
                  >
                    ● Active
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Your Intelligent Healthcare Companion
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {messages.length > 0 && (
              <>
                <button
                  onClick={exportChat}
                  title="Download consultation transcript"
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s',
                  }}
                >
                  📥 Export
                </button>

                <button
                  onClick={clearChat}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    color: '#fda4af',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s',
                  }}
                >
                  🧹 Clear
                </button>
              </>
            )}


          </div>
        </header>

        {/* Scrollable Chat Area */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '100%', maxWidth: '860px' }}>
            {messages.length === 0 ? (
              /* Welcome Hero & Bento Grid */
              <div style={{ animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                <div style={{ textAlign: 'center', margin: '2rem 0 2rem' }}>
                  {/* Glowing Medical Emblem */}
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.25rem' }}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: '-12px',
                        borderRadius: '50%',
                        border: '1px dashed rgba(13, 242, 200, 0.35)',
                        animation: 'radarWave 3s infinite linear',
                      }}
                    />
                    <div
                      style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: '26px',
                        background: 'linear-gradient(135deg, rgba(13, 242, 200, 0.25) 0%, rgba(0, 210, 255, 0.25) 100%)',
                        border: '1px solid var(--border-bright)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.8rem',
                        boxShadow: '0 0 35px rgba(13, 242, 200, 0.3)',
                        animation: 'heartbeat 3.5s infinite ease-in-out',
                      }}
                    >
                      🩺
                    </div>
                  </div>

                  <h2
                    style={{
                      fontSize: '2.1rem',
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      marginBottom: '0.65rem',
                      lineHeight: 1.25,
                    }}
                  >
                    Clinical Knowledge, Empowered by AI
                  </h2>
                  <p
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.98rem',
                      maxWidth: '620px',
                      margin: '0 auto',
                      lineHeight: 1.6,
                    }}
                  >
                    Ask clinical questions, review drug interactions, or analyze symptom profiles with evidence-based intelligence from the GALE Medical Encyclopedia.
                  </p>

                  {/* Category Filter Chips */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                      marginTop: '1.75rem',
                    }}
                  >
                    {MEDICAL_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.95rem',
                          borderRadius: '999px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor:
                            selectedCategory === cat.id
                              ? 'rgba(13, 242, 200, 0.15)'
                              : 'rgba(255, 255, 255, 0.04)',
                          color: selectedCategory === cat.id ? '#0df2c8' : 'var(--text-muted)',
                          border:
                            selectedCategory === cat.id
                              ? '1px solid rgba(13, 242, 200, 0.4)'
                              : '1px solid var(--border-subtle)',
                        }}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bento Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem',
                  }}
                >
                  {filteredCards.map((card, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSend(card.desc)}
                      style={{
                        background: 'var(--gradient-card)',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        backdropFilter: 'blur(12px)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                        e.currentTarget.style.borderColor = card.borderColor;
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = `0 12px 30px rgba(0, 0, 0, 0.5), 0 0 25px ${card.borderColor}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.6rem' }}>{card.icon}</span>
                        <span
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-dim)',
                          }}
                        >
                          {card.tag}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.4rem' }}>
                        {card.title}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                        {card.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Message Stream */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '1rem' }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.85rem',
                        maxWidth: msg.role === 'user' ? '80%' : '92%',
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          flexShrink: 0,
                          background:
                            msg.role === 'user'
                              ? 'linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)'
                              : 'linear-gradient(135deg, #0df2c8 0%, #00d2ff 100%)',
                          boxShadow:
                            msg.role === 'user'
                              ? '0 4px 15px rgba(2, 132, 199, 0.4)'
                              : '0 4px 15px rgba(13, 242, 200, 0.4)',
                        }}
                      >
                        {msg.role === 'user' ? '👤' : '🩺'}
                      </div>

                      {/* Bubble Card */}
                      <div
                        style={{
                          backgroundColor:
                            msg.role === 'user'
                              ? 'rgba(14, 116, 144, 0.28)'
                              : 'rgba(14, 23, 42, 0.85)',
                          border:
                            msg.role === 'user'
                              ? '1px solid rgba(14, 165, 233, 0.4)'
                              : '1px solid var(--border-subtle)',
                          backdropFilter: 'blur(16px)',
                          padding: '1.15rem 1.4rem',
                          borderRadius:
                            msg.role === 'user'
                              ? '20px 20px 4px 20px'
                              : '20px 20px 20px 4px',
                          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
                          color: '#f8fafc',
                          lineHeight: 1.65,
                          fontSize: '0.94rem',
                          position: 'relative',
                        }}
                      >
                        {msg.role === 'assistant' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              marginBottom: '0.65rem',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: '#0df2c8',
                              letterSpacing: '0.04em',
                            }}
                          >
                            <span>✦ CLINICAL INSIGHTS</span>
                          </div>
                        )}

                        {/* Message Text Rendering */}
                        <div style={{ whiteSpace: 'pre-wrap' }}>
                          {msg.content.split('\n\n').map((paragraph, pIdx) => (
                            <p key={pIdx} style={{ marginBottom: pIdx < msg.content.split('\n\n').length - 1 ? '0.85rem' : 0 }}>
                              {paragraph.split('\n').map((line, lIdx) => {
                                const parts = line.split(/(\*\*.*?\*\*)/g);
                                return (
                                  <span key={lIdx}>
                                    {parts.map((part, partIdx) => {
                                      if (part.startsWith('**') && part.endsWith('**')) {
                                        return (
                                          <strong key={partIdx} style={{ color: '#0df2c8', fontWeight: 700 }}>
                                            {part.slice(2, -2)}
                                          </strong>
                                        );
                                      }
                                      return part;
                                    })}
                                    {lIdx < paragraph.split('\n').length - 1 && <br />}
                                  </span>
                                );
                              })}
                            </p>
                          ))}
                        </div>

                        {/* Interactive Action Bar for Assistant */}
                        {msg.role === 'assistant' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginTop: '1rem',
                              paddingTop: '0.75rem',
                              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                              fontSize: '0.74rem',
                              color: 'var(--text-dim)',
                            }}
                          >
                            <span>ℹ️ Educational purpose only</span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <button
                                onClick={() => speakText(msg.content, msg.id)}
                                title="Listen to response"
                                style={{
                                  background: isSpeakingId === msg.id ? 'rgba(13, 242, 200, 0.15)' : 'transparent',
                                  border: isSpeakingId === msg.id ? '1px solid rgba(13, 242, 200, 0.3)' : '1px solid transparent',
                                  color: isSpeakingId === msg.id ? '#0df2c8' : 'var(--text-muted)',
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.74rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                              >
                                {isSpeakingId === msg.id ? '🔊 Stop' : '🔈 Read'}
                              </button>

                              <button
                                onClick={() => copyToClipboard(msg.content, msg.id)}
                                title="Copy answer"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: copiedId === msg.id ? '#10b981' : 'var(--text-muted)',
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.74rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                              >
                                {copiedId === msg.id ? '✓ Copied' : '📋 Copy'}
                              </button>

                              <button
                                onClick={() => handleFeedback(msg.id, true)}
                                title="Helpful"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: msg.liked === true ? '#10b981' : 'var(--text-dim)',
                                  cursor: 'pointer',
                                  padding: '0.2rem',
                                }}
                              >
                                👍
                              </button>

                              <button
                                onClick={() => handleFeedback(msg.id, false)}
                                title="Needs improvement"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: msg.liked === false ? '#f43f5e' : 'var(--text-dim)',
                                  cursor: 'pointer',
                                  padding: '0.2rem',
                                }}
                              >
                                👎
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-dim)',
                        marginTop: '0.35rem',
                        marginRight: msg.role === 'user' ? '3.2rem' : 0,
                        marginLeft: msg.role === 'assistant' ? '3.2rem' : 0,
                      }}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {/* Animated Thinking Wave */}
                {isLoading && (
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', animation: 'fadeIn 0.3s ease-out' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #0df2c8 0%, #00d2ff 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        boxShadow: '0 0 20px rgba(13, 242, 200, 0.4)',
                      }}
                    >
                      🩺
                    </div>
                    <div
                      style={{
                        backgroundColor: 'rgba(14, 23, 42, 0.85)',
                        border: '1px solid rgba(13, 242, 200, 0.3)',
                        padding: '0.85rem 1.35rem',
                        borderRadius: '20px 20px 20px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#0df2c8', fontWeight: 600 }}>
                        Analyzing clinical database & formulating diagnosis
                      </span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0df2c8', animation: 'waveBar 1s infinite' }} />
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00d2ff', animation: 'waveBar 1s infinite 0.2s' }} />
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'waveBar 1s infinite 0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Floating Futuristic Input Dock */}
        <footer
          style={{
            padding: '1rem 1.5rem 1.75rem',
            backgroundColor: 'rgba(5, 8, 17, 0.85)',
            backdropFilter: 'blur(24px)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '100%', maxWidth: '860px' }}>
            {/* Quick Topic Prompts */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.65rem',
                overflowX: 'auto',
                paddingBottom: '0.2rem',
              }}
            >
              {[
                '💊 Medication dosage warnings',
                '🫀 Blood pressure emergency range',
                '🩸 Fasting blood sugar levels',
                '🌿 Natural anti-inflammatory foods',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.slice(2))}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '999px',
                    color: 'var(--text-muted)',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(13, 242, 200, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(13, 242, 200, 0.3)';
                    e.currentTarget.style.color = '#0df2c8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Main Input Capsule */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                backgroundColor: 'rgba(14, 23, 42, 0.95)',
                border: '1px solid var(--border-bright)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.75rem 0.95rem',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(13, 242, 200, 0.15)',
                transition: 'all 0.2s',
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about symptoms, medical conditions, medications, or preventive care..."
                rows={1}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.96rem',
                  resize: 'none',
                  maxHeight: '180px',
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                  padding: '0.35rem 0.5rem',
                }}
              />

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background:
                    !input.trim() || isLoading
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'linear-gradient(135deg, #0df2c8 0%, #00d2ff 50%, #3b82f6 100%)',
                  color: !input.trim() || isLoading ? 'var(--text-dim)' : '#050811',
                  border: 'none',
                  cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  transition: 'all 0.2s',
                  boxShadow:
                    !input.trim() || isLoading
                      ? 'none'
                      : '0 4px 18px rgba(13, 242, 200, 0.45)',
                  flexShrink: 0,
                }}
              >
                ➤
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '0.6rem',
                fontSize: '0.74rem',
                color: 'var(--text-dim)',
                textAlign: 'center',
              }}
            >
              <span>Medical insights are for educational & informational guidance only. Always consult a physician.</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
