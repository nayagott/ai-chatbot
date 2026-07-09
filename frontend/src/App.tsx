import { useEffect, useState } from 'react';
import { Header } from './components/header/header';
import { Sidebar } from './components/sidebar/sidebar';
import { ChatArea } from './components/chat-area/chat-area';
import { createSession, listSessions } from './api/session-api';
import { streamMessage } from './api/chat-stream';
import type { ChatMessage, Session } from './types';
import './App.css';

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    listSessions().then(setSessions);
  }, []);

  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;

  function appendMessage(sessionId: string, message: ChatMessage) {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, messages: [...session.messages, message], updatedAt: Date.now() }
          : session
      )
    );
  }

  async function handleNewSession() {
    const session = await createSession();
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    setIsSidebarOpen(false);
  }

  function handleSelectSession(id: string) {
    setActiveSessionId(id);
    setIsSidebarOpen(false);
  }

  async function handleSend(content: string) {
    if (!activeSessionId) return;
    const sessionId = activeSessionId;

    appendMessage(sessionId, { role: 'user', content });
    setIsStreaming(true);
    setStreamingText('');

    await streamMessage(sessionId, content, {
      onToken: (delta) => setStreamingText((prev) => prev + delta),
      onDone: (message) => {
        appendMessage(sessionId, message);
        setIsStreaming(false);
        setStreamingText('');
      },
      onError: () => {
        setIsStreaming(false);
        setStreamingText('');
      },
    });
  }

  return (
    <div className="app">
      <Header title="AI 챗봇" onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <div className="app-body">
        <div className={`sidebar${isSidebarOpen ? ' sidebar--open' : ''}`}>
          <Sidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onNewSession={handleNewSession}
            onSelectSession={handleSelectSession}
          />
        </div>
        <div className="chat-area">
          <ChatArea
            messages={activeSession?.messages ?? []}
            isStreaming={isStreaming}
            streamingText={streamingText}
            onSend={handleSend}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
