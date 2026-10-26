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

const QUICK_CARDS = [
  {
    icon: '🫀',
    title: 'Hypertension Guidelines',
    desc: 'What are clinical stages of high blood pressure and lifestyle fixes?',
    tag: 'Cardiology',
    color: '#0df2c8',
  },
  {
    icon: '🩸',
    title: 'Type 2 Diabetes Signs',
    desc: 'What are early symptoms of diabetes and effective prevention habits?',
    tag: 'Endocrinology',
    color: '#00d2ff',
  },
  {
    icon: '💊',
    title: 'Medication Interactions',
    desc: 'How do common blood pressure and cholesterol drugs interact?',
    tag: 'Pharmacology',
    color: '#a855f7',
  },
  {
    icon: '🧠',
    title: 'Migraine Diagnostics',
    desc: 'How can you differentiate a tension headache from a neurological migraine?',
    tag: 'Neurology',
    color: '#3b82f6',
  },
];

const EcgLoader = () => (
  <svg width="60" height="22" viewBox="0 0 120 40" fill="none" style={{ display: 'block' }}>
    <path
      d="M0 20 H25 L32 20 L37 8 L43 32 L49 14 L53 20 H75 L81 20 L86 4 L92 36 L98 16 L102 20 H120"
      stroke="url(#ecgGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="240"
      strokeDashoffset="240"
      style={{ animation: 'ecgDash 1.4s linear infinite' }}
    />
    <defs>
      <linearGradient id="ecgGrad" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0df2c8" />
        <stop offset="1" stopColor="#00d2ff" />
      </linearGradient>
    </defs>
  </svg>
);

export default function MedicalAssistantApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('auramed_history');
      if (saved) setChatHistory(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const saveCurrentSession = (msgs: Message[]) => {
    if (msgs.length === 0) return;
    const session: ChatSession = {
      id: Date.now().toString(),
      title: msgs[0]?.content.slice(0, 34) + (msgs[0]?.content.length > 34 ? '...' : ''),
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      messages: msgs,
    };
    setChatHistory((prev) => {
      const updated = [session, ...prev.filter((s) => s.id !== session.id)].slice(0, 10);
      try {
        localStorage.setItem('auramed_history', JSON.stringify(updated));
      } catch {
        /* ignore */
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
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
        content: `⚠️ Consultation Notice: ${err.message || 'The clinical knowledge base is reconnecting. Please retry.'}`,
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

  const renderContent = (content: string) =>
    content.split('\n\n').map((paragraph, pIdx) => (
      <p key={pIdx} style={{ marginBottom: pIdx < content.split('\n\n').length - 1 ? '0.75rem' : 0 }}>
        {paragraph.split('\n').map((line, lIdx) => (
          <span key={lIdx}>
            {line.split(/(\*\*.*?\*\*)/g).map((part, partIdx) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={partIdx} style={{ color: '#0df2c8', fontWeight: 600 }}>
                  {part.slice(2, -2)}
                </strong>
              ) : (
                part
              )
            )}
            {lIdx < paragraph.split('\n').length - 1 && <br />}
          </span>
        ))}
      </p>
    ));

  return (
    <div style={{ display: 'flex', height: '100dvh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      {/* Background Ambience */}
      <div className="ambient-bg">
        <div className="aurora-conic" />
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="grid-overlay" />
      </div>
      <div className="noise-overlay" />

      {/* Sidebar Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 5, 12, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 39,
          }}
        />
      )}

      {/* Compact History Sidebar */}
      <aside
        style={{
          width: isSidebarOpen ? '280px' : '0px',
          transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          backgroundColor: 'rgba(8, 12, 22, 0.96)',
          backdropFilter: 'blur(20px)',
          borderRight: isSidebarOpen ? '1px solid var(--border-subtle)' : 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          position: isSidebarOpen ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          height: '100%',
          boxShadow: isSidebarOpen ? '20px 0 50px rgba(0, 0, 0, 0.6)' : 'none',
        }}
      >
        <div style={{ padding: '0.9rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
              CONSULTATIONS
            </span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                width: '26px',
                height: '26px',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '0.8rem',
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
              gap: '0.4rem',
              padding: '0.55rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(13, 242, 200, 0.15) 0%, rgba(0, 210, 255, 0.15) 100%)',
              border: '1px solid var(--border-bright)',
              color: '#0df2c8',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            ✚ New Consultation
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem' }}>
          {chatHistory.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.76rem', marginTop: '1.5rem' }}>
              No saved consultations yet.
            </p>
          ) : (
            chatHistory.map((s) => (
              <div
                key={s.id}
                onClick={() => loadPastSession(s)}
                style={{
                  padding: '0.65rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  marginBottom: '0.4rem',
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  transition: 'all 0.15s',
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
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                  {s.date} • {s.messages.length} msgs
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, position: 'relative', zIndex: 10 }}>
        {/* Slim Header (50px) */}
        <header
          style={{
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.25rem',
            backgroundColor: 'rgba(8, 12, 22, 0.75)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Toggle History"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                flexShrink: 0,
              }}
            >
              ☰
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.05rem',
                  boxShadow: '0 0 14px rgba(13, 242, 200, 0.35)',
                  flexShrink: 0,
                }}
              >
                🩺
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: '#ffffff',
                  }}
                >
                  AURA MED
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '0.1rem 0.45rem',
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
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {messages.length > 0 && (
              <>
                <button
                  onClick={exportChat}
                  title="Export Transcript"
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: '0.74rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  📥 Export
                </button>
                <button
                  onClick={clearChat}
                  title="Clear Chat"
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    color: '#fda4af',
                    fontSize: '0.74rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  🧹 Clear
                </button>
              </>
            )}
          </div>
        </header>

        {/* Center Content Body */}
        <main
          style={{
            flex: 1,
            overflowY: messages.length === 0 ? 'hidden' : 'auto',
            padding: messages.length === 0 ? '1rem 1.25rem' : '1.25rem 1.25rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: messages.length === 0 ? 'center' : 'flex-start',
            minHeight: 0,
          }}
        >
          <div style={{ width: '100%', maxWidth: '820px' }}>
            {messages.length === 0 ? (
              /* Non-scrollable Compact Hero (Fits 100% on screen) */
              <div style={{ animation: 'fadeIn 0.4s ease-out', textAlign: 'center' }}>
                {/* Compact Emblem */}
                <div
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, rgba(13, 242, 200, 0.2) 0%, rgba(0, 210, 255, 0.2) 100%)',
                    border: '1px solid var(--border-bright)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.9rem',
                    boxShadow: '0 0 25px rgba(13, 242, 200, 0.25)',
                    marginBottom: '0.85rem',
                  }}
                >
                  🩺
                </div>

                <h2
                  style={{
                    fontSize: 'clamp(1.35rem, 3vw, 1.75rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    marginBottom: '0.35rem',
                    color: '#ffffff',
                  }}
                >
                  Clinical Intelligence Assistant
                </h2>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.88rem',
                    maxWidth: '540px',
                    margin: '0 auto 1.5rem',
                    lineHeight: 1.5,
                  }}
                >
                  Ask clinical questions, review drug interactions, or check symptoms with evidence-based medical knowledge.
                </p>

                {/* Compact 2x2 Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
                    gap: '0.75rem',
                    textAlign: 'left',
                  }}
                >
                  {QUICK_CARDS.map((card, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSend(card.desc)}
                      style={{
                        backgroundColor: 'rgba(14, 23, 42, 0.65)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        padding: '0.9rem 1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backdropFilter: 'blur(10px)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(22, 36, 65, 0.85)';
                        e.currentTarget.style.borderColor = 'rgba(13, 242, 200, 0.4)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(13, 242, 200, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(14, 23, 42, 0.65)';
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{card.icon}</span>
                        <span
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: card.color,
                          }}
                        >
                          {card.tag.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.2rem' }}>
                        {card.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {card.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Message Stream */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '0.5rem' }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      animation: 'fadeIn 0.25s ease-out',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.65rem',
                        maxWidth: msg.role === 'user' ? 'min(85%, 620px)' : '100%',
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.95rem',
                          flexShrink: 0,
                          background:
                            msg.role === 'user'
                              ? 'linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)'
                              : 'var(--gradient-primary)',
                          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        {msg.role === 'user' ? '👤' : '🩺'}
                      </div>

                      <div
                        style={{
                          backgroundColor:
                            msg.role === 'user'
                              ? 'rgba(14, 116, 144, 0.32)'
                              : 'rgba(14, 23, 42, 0.88)',
                          border:
                            msg.role === 'user'
                              ? '1px solid rgba(14, 165, 233, 0.4)'
                              : '1px solid var(--border-subtle)',
                          backdropFilter: 'blur(16px)',
                          padding: '0.9rem 1.15rem',
                          borderRadius:
                            msg.role === 'user'
                              ? '16px 16px 4px 16px'
                              : '16px 16px 16px 4px',
                          color: '#f8fafc',
                          lineHeight: 1.6,
                          fontSize: '0.92rem',
                        }}
                      >
                        {msg.role === 'assistant' && (
                          <div
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              color: '#0df2c8',
                              marginBottom: '0.45rem',
                            }}
                          >
                            ✦ CLINICAL INSIGHTS
                          </div>
                        )}

                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {renderContent(msg.content)}
                        </div>

                        {msg.role === 'assistant' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                              marginTop: '0.75rem',
                              paddingTop: '0.55rem',
                              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                              fontSize: '0.72rem',
                              color: 'var(--text-dim)',
                            }}
                          >
                            <span>ℹ️ Informational use only</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <button
                                onClick={() => speakText(msg.content, msg.id)}
                                title="Listen"
                                style={{
                                  background: isSpeakingId === msg.id ? 'rgba(13, 242, 200, 0.15)' : 'transparent',
                                  border: 'none',
                                  color: isSpeakingId === msg.id ? '#0df2c8' : 'var(--text-muted)',
                                  padding: '0.2rem 0.45rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.72rem',
                                }}
                              >
                                {isSpeakingId === msg.id ? '🔊 Stop' : '🔈 Read'}
                              </button>
                              <button
                                onClick={() => copyToClipboard(msg.content, msg.id)}
                                title="Copy"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: copiedId === msg.id ? '#10b981' : 'var(--text-muted)',
                                  padding: '0.2rem 0.45rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.72rem',
                                }}
                              >
                                {copiedId === msg.id ? '✓ Copied' : '📋 Copy'}
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, true)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: msg.liked === true ? '#10b981' : 'var(--text-dim)',
                                  cursor: 'pointer',
                                  padding: '0.15rem',
                                }}
                              >
                                👍
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, false)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: msg.liked === false ? '#f43f5e' : 'var(--text-dim)',
                                  cursor: 'pointer',
                                  padding: '0.15rem',
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
                        fontSize: '0.66rem',
                        color: 'var(--text-dim)',
                        marginTop: '0.25rem',
                        marginRight: msg.role === 'user' ? '2.8rem' : 0,
                        marginLeft: msg.role === 'assistant' ? '2.8rem' : 0,
                      }}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {isLoading && (
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', animation: 'fadeIn 0.2s ease-out' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.95rem',
                        boxShadow: '0 0 16px rgba(13, 242, 200, 0.4)',
                        flexShrink: 0,
                      }}
                    >
                      🩺
                    </div>
                    <div
                      style={{
                        backgroundColor: 'rgba(14, 23, 42, 0.85)',
                        border: '1px solid rgba(13, 242, 200, 0.3)',
                        padding: '0.55rem 1rem',
                        borderRadius: '16px 16px 16px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <EcgLoader />
                      <span style={{ fontSize: '0.8rem', color: '#0df2c8', fontWeight: 600 }}>
                        Analyzing clinical database…
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Slim Floating Input Footer */}
        <footer
          style={{
            padding: '0.55rem 1.25rem 0.75rem',
            backgroundColor: 'rgba(8, 12, 22, 0.85)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ width: '100%', maxWidth: '820px' }}>
            {/* Slim Input Capsule */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                backgroundColor: 'rgba(14, 23, 42, 0.95)',
                border: '1px solid var(--border-bright)',
                borderRadius: '14px',
                padding: '0.4rem 0.65rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                transition: 'border-color 0.2s',
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about symptoms, conditions, medications, or lab values..."
                rows={1}
                aria-label="Medical question input"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  resize: 'none',
                  maxHeight: '120px',
                  lineHeight: 1.45,
                  fontFamily: 'inherit',
                  padding: '0.25rem 0.4rem',
                  minWidth: 0,
                }}
              />

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background:
                    !input.trim() || isLoading
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'var(--gradient-primary)',
                  color: !input.trim() || isLoading ? 'var(--text-dim)' : '#050811',
                  border: 'none',
                  cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 800,
                  transition: 'all 0.2s',
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
                marginTop: '0.35rem',
                fontSize: '0.68rem',
                color: 'var(--text-dim)',
                textAlign: 'center',
              }}
            >
              <span>Clinical guidance simulation • Always consult a licensed medical professional</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
