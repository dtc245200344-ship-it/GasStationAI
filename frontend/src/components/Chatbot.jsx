import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Fuel } from 'lucide-react';
import api from '../api';
import ReactMarkdown from 'react-markdown';
import Draggable from 'react-draggable';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Chào bạn! Tôi là GasStation AI. Bạn cần tra cứu thông tin gì hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await api.post('/chat', { message: userMessage });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || '';
      if (errorMsg.includes('503')) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Hiện tại hệ thống AI đang bị quá tải (Google Gemini trả về lỗi 503 High Demand). Bạn vui lòng đợi một chút rồi thử lại nhé!' }]);
      } else if (errorMsg.includes('429')) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'API Key của bạn đã hết lượt sử dụng miễn phí hôm nay (Lỗi 429 Quota Exceeded). Vui lòng sử dụng API Key khác.' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, tôi đang gặp sự cố khi kết nối tới hệ thống. Vui lòng thử lại sau.' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-all transform hover:scale-110 z-50 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <Fuel size={24} />
      </button>

      {/* Chat Window */}
      <Draggable handle=".chat-header" bounds="parent">
        <div className={`fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col transition-opacity z-50 border border-slate-200 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          
          {/* Header */}
          <div className="chat-header cursor-move bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Fuel size={24} />
              <h3 className="font-bold">Trợ lý Trạm Xăng</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition cursor-pointer">
              <X size={20} />
            </button>
          </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm prose-blue">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex space-x-2">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Hỏi tôi bất cứ điều gì..."
            className="flex-1 px-4 py-2 bg-slate-100 border-transparent rounded-full focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition"
          >
            <Send size={18} />
          </button>
        </form>
        </div>
      </Draggable>
    </>
  );
};

export default Chatbot;
