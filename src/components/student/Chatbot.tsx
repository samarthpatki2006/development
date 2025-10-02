import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { chatService } from '../../lib/ChatServices';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;

    const newUserMessage = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Add placeholder for AI response with typing effect
    setMessages(prev => [...prev, { role: 'assistant', content: '', isTyping: true }]);

    try {
      // Simulated typing effect - replace with your actual API call
        const response = await chatService.sendMessage(userMessage);
      
      // Simulate typing effect
      let currentText = '';
      for (let i = 0; i < response.length; i++) {
        currentText += response[i];
        await new Promise(resolve => setTimeout(resolve, 20));
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { 
            role: 'assistant', 
            content: currentText,
            isTyping: i < response.length - 1 
          };
          return newMessages;
        });
      }
    } catch (err) {
      setError('Failed to get AI response. Please try again.');
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { 
          role: 'assistant', 
          content: "I'm sorry, I encountered an error. Please try again."
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden w-full">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-700 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold">AI Assistant</h1>
            <p className="text-xs">Powered by Gemini</p>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/50 border-l-4  p-3 mx-4 mt-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full ">
            <Bot className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">Start a conversation with AI</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}
            
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                message.role === 'user'
                  ? 'bg-gray-600 '
                  : 'bg-gray-800 '
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              {message.isTyping && (
                <span className="inline-block w-1 h-4 ml-1 animate-pulse"></span>
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-lg  flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 " />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg  flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 " />
            </div>
            <div className="rounded-2xl px-4 py-2.5">
              <Loader2 className="w-4 h-4  animate-spin" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 flex-shrink-0 bg-black">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 bg-black rounded-xl px-4 py-2.5 text-sm border focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className=" disabled:cursor-not-allowed rounded-xl px-4 py-2.5 flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;