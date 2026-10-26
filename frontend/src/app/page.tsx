'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const EXAMPLE_PROMPTS = [
  {
    icon: '🩺',
    title: 'Diabetes & Prevention',
    desc: 'What are the early symptoms of diabetes and how can it be prevented?',
  },
  {
    icon: '🌿',
    title: 'Natural Blood Pressure Care',
    desc: 'How can I naturally lower my blood pressure without medication?',
  },
  {
    icon: '💊',
    title: 'Hypertension Medications',
    desc: 'What are the different types of hypertension medications and their side effects?',
  },
  {
    icon: '🔬',
    title: 'Type 1 vs Type 2 Diabetes',
    desc: 'Explain the difference between Type 1 and Type 2 diabetes in detail.',
  },
  {
    icon: '🫀',
    title: 'Heart Health Habits',
    desc: 'What daily habits most effectively protect cardiovascular and heart health?',
  },
  {
    icon: '🧠',
    title: 'Migraine vs Headache',
    desc: 'How can you distinguish a tension headache from a neurological migraine?',
  },
];

export default function MedicalChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto resize input textarea
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

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve medical answer');
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Error: ${err.message || 'Unable to connect to medical knowledge base. Please check backend status.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
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
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);
    setIsSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const clearChat = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setMessages([]);
  };

  // Helper to format assistant responses cleanly
  const renderFormattedContent = (content: string) => {
    // Break into paragraphs and render bold highlights
    const paragraphs = content.split(/\n\n+/);
    return paragraphs.map((para, pIdx) => {
      const lines = para.split('\n');
      return (
        <p key={pIdx} style={{ marginBottom: pIdx < paragraphs.length - 1 ? '0.85rem' : 0 }}>
          {lines.map((line, lIdx) => {
            // Process bold formatting **text**
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
              <span key={lIdx}>
                {parts.map((part, partIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={partIdx} style={{ color: '#2dd4bf', fontWeight: 600 }}>
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return part;
                })}
                {lIdx < lines.length - 1 && <br />}
              </span>
            );
          })}
        </p>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.75rem',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-color)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.45rem',
              boxShadow: '0 4px 16px rgba(13, 148, 136, 0.35)',
            }}
          >
            🩺
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                AI Medical Assistant
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.72rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(20, 184, 166, 0.15)',
                  color: '#2dd4bf',
                  border: '1px solid rgba(20, 184, 166, 0.3)',
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    animation: 'pulseGlow 2s infinite',
                  }}
                />
                RAG Online
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Powered by LangChain • FAISS Vector Store • Groq AI
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.15)';
                e.currentTarget.style.color = '#fb7185';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              🧹 Clear Chat
            </button>
          )}

          <a
            href="https://vercel.com"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#ffffff',
              color: '#000000',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(255, 255, 255, 0.15)',
            }}
          >
            ▲ Vercel Ready
          </a>
        </div>
      </header>

      {/* Main Chat Scrollable Container */}
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
        <div style={{ width: '100%', maxWidth: '820px' }}>
          {messages.length === 0 ? (
            /* Welcome / Empty State View */
            <div style={{ animation: 'fadeIn 0.6s ease-out', marginTop: '1.5rem' }}>
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '2.5rem',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '74px',
                    height: '74px',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.2) 0%, rgba(2, 132, 199, 0.2) 100%)',
                    border: '1px solid rgba(20, 184, 166, 0.3)',
                    fontSize: '2.4rem',
                    marginBottom: '1rem',
                    boxShadow: 'var(--shadow-glow)',
                  }}
                >
                  🏥
                </div>
                <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                  Medical Knowledge at Your Fingertips
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
                  Ask clinical questions, understand symptom profiles, and explore medical literature indexed with Retrieval-Augmented Generation.
                </p>
              </div>

              {/* Grid of Prompt Templates */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '0.9rem',
                }}
              >
                {EXAMPLE_PROMPTS.map((card, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSend(card.desc)}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.15rem',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                      e.currentTarget.style.borderColor = 'var(--border-glow)';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '1.45rem', marginBottom: '0.55rem' }}>{card.icon}</div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem', color: '#e2e8f0' }}>
                      {card.title}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      {card.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Messages Stream */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'fadeIn 0.35s ease-out',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      maxWidth: '85%',
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.05rem',
                        flexShrink: 0,
                        background:
                          msg.role === 'user'
                            ? 'linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)'
                            : 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                        boxShadow:
                          msg.role === 'user'
                            ? '0 4px 12px rgba(2, 132, 199, 0.3)'
                            : '0 4px 12px rgba(13, 148, 136, 0.3)',
                      }}
                    >
                      {msg.role === 'user' ? '👤' : '🩺'}
                    </div>

                    {/* Message Bubble */}
                    <div
                      style={{
                        backgroundColor:
                          msg.role === 'user'
                            ? 'rgba(14, 116, 144, 0.28)'
                            : 'rgba(15, 23, 42, 0.88)',
                        border:
                          msg.role === 'user'
                            ? '1px solid rgba(14, 165, 233, 0.35)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(12px)',
                        padding: '1rem 1.25rem',
                        borderRadius:
                          msg.role === 'user'
                            ? '18px 18px 4px 18px'
                            : '18px 18px 18px 4px',
                        boxShadow: 'var(--shadow-sm)',
                        color: '#f8fafc',
                        lineHeight: 1.6,
                        fontSize: '0.94rem',
                      }}
                    >
                      {msg.role === 'user' ? (
                        <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                      ) : (
                        renderFormattedContent(msg.content)
                      )}

                      {/* Footer Actions for Assistant Messages */}
                      {msg.role === 'assistant' && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '0.85rem',
                            paddingTop: '0.65rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            fontSize: '0.75rem',
                            color: 'var(--text-dim)',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>ℹ️ Informational use only</span>
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              onClick={() => speakText(msg.content, msg.id)}
                              title="Listen to response"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isSpeakingId === msg.id ? '#14b8a6' : 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '0.2rem 0.4rem',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
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
                                cursor: 'pointer',
                                padding: '0.2rem 0.4rem',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                              }}
                            >
                              {copiedId === msg.id ? '✓ Copied' : '📋 Copy'}
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
                      marginRight: msg.role === 'user' ? '3rem' : 0,
                      marginLeft: msg.role === 'assistant' ? '3rem' : 0,
                    }}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {/* Loading Thinking Indicator */}
              {isLoading && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', animation: 'fadeIn 0.3s ease-out' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.05rem',
                    }}
                  >
                    🩺
                  </div>
                  <div
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(20, 184, 166, 0.25)',
                      padding: '0.85rem 1.25rem',
                      borderRadius: '18px 18px 18px 4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: '0.84rem', color: '#2dd4bf', fontWeight: 500 }}>
                      Consulting medical vector database
                    </span>
                    <div style={{ display: 'flex', gap: '4px', marginLeft: '0.2rem' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#14b8a6', animation: 'wave 1.2s infinite ease-in-out' }} />
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#14b8a6', animation: 'wave 1.2s infinite ease-in-out 0.2s' }} />
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#14b8a6', animation: 'wave 1.2s infinite ease-in-out 0.4s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Floating Modern Input Section */}
      <footer
        style={{
          padding: '1rem 1.25rem 1.5rem',
          backgroundColor: 'rgba(10, 15, 29, 0.85)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <div style={{ width: '100%', maxWidth: '820px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--border-glow)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.65rem 0.85rem',
              boxShadow: 'var(--shadow-md)',
              transition: 'all 0.2s',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask a medical question (e.g. causes of high blood pressure, symptoms, treatment)..."
              rows={1}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '0.95rem',
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
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background:
                  !input.trim() || isLoading
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                color: !input.trim() || isLoading ? 'var(--text-dim)' : '#ffffff',
                border: 'none',
                cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                transition: 'all 0.2s',
                boxShadow: !input.trim() || isLoading ? 'none' : '0 4px 14px rgba(13, 148, 136, 0.35)',
                flexShrink: 0,
              }}
            >
              ➤
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.55rem',
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
              padding: '0 0.5rem',
            }}
          >
            <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</span>
            <span>RAG Medical Database v1.0 • Groq LLaMA/OSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
