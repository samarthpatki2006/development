import React, { useState, useRef } from "react";
import { CalendarDays, Clock, User, Paperclip, Send, Image as ImageIcon, Pin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TeacherDepartmentProps {
  teacherData: any;
}

interface Message {
  id: number;
  sender: string;
  text?: string;
  time: string;
  file?: {
    name: string;
    url: string;
  };
  image?: string;
  pinned?: boolean;
  replies?: Message[];
}

const TeacherDepartment = ({ teacherData }: TeacherDepartmentProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Mock Events (Right Panel)
  const events = [
    {
      id: 1,
      title: "Department Meeting",
      time: "10:00 AM",
      description: "Monthly staff sync-up.",
      createdBy: "HOD, CSE",
      date: new Date(2025, 10, 5),
    },
    {
      id: 2,
      title: "Research Paper Review",
      time: "3:00 PM",
      description: "Faculty review session for publications.",
      createdBy: "Prof. Rao",
      date: new Date(2025, 10, 7),
    },
    {
      id: 3,
      title: "Test",
      time: "9:00 AM",
      description: "lol.",
      createdBy: "lol, CSE",
      date: new Date(2025, 10, 5),
    },
  ];

  const filteredEvents = selectedDate
    ? events.filter(
        (event) => event.date.toDateString() === selectedDate.toDateString()
      )
    : [];

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "HOD, CSE",
      text: "Reminder: Department meeting tomorrow at 10 AM.",
      time: "9:15 AM",
      pinned: true,
    },
    {
      id: 2,
      sender: "Prof. Meena",
      text: "Here’s the research paper draft for review.",
      time: "2:00 PM",
      file: { name: "ResearchDraft.pdf", url: "#" },
    },
  ]);

  const [newMessage, setNewMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Send message
  const handleSend = () => {
    if (!newMessage.trim() && !attachedFile) return;

    const newMsg: Message = {
      id: Date.now(),
      sender: "You",
      text: newMessage.trim() || undefined,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      file: attachedFile
        ? {
            name: attachedFile.name,
            url: URL.createObjectURL(attachedFile),
          }
        : undefined,
    };

    setMessages((prev) => [...prev, newMsg]);
    setNewMessage("");
    setAttachedFile(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  if (e.key === "Enter" && !e.shiftKey) { // prevents sending when pressing Shift+Enter
    e.preventDefault(); // stop newline in textarea
    handleSend();
  }
};

  // File picker
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  // Toggle pin
  const togglePin = (id: number) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, pinned: !msg.pinned } : msg
      )
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Panel — Department Chat */}
      <div className="w-full lg:w-3/5 h-[85vh] flex flex-col">
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex flex-col">
              <span className="text-lg font-semibold">Department Communication Stream</span>
              <span className="text-sm text-muted-foreground">
                Real-time message feed showing department-wide conversations.
              </span>
            </CardTitle>
          </CardHeader>

          {/* Chat Content */}
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {/* Pinned Messages */}
            {messages.some((m) => m.pinned) && (
              <div className="border-b border-muted mb-2 pb-2">
                <h4 className="text-sm font-semibold mb-1">📌 Pinned Messages</h4>
                {messages
                  .filter((m) => m.pinned)
                  .map((m) => (
                    <div key={m.id} className="text-sm bg-muted p-2 rounded mb-1 flex justify-between items-center">
                      <span>
                        <strong>{m.sender}:</strong> {m.text}
                        {m.file && (
                          <a
                            href={m.file.url}
                            download={m.file.name}
                            className="text-xs text-blue-500 underline ml-1"
                          >
                            {m.file.name}
                          </a>
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePin(m.id)}
                        title="Unpin Message"
                      >
                        <Pin className="w-4 h-4 text-blue-500" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col group">
                  <div className="flex items-start gap-2">
                    <div className="bg-muted p-2 rounded-lg max-w-[80%]">
                      <p className="text-sm">
                        <strong>{msg.sender}</strong>: {msg.text}
                      </p>

                      {msg.file && (
                        <a
                          href={msg.file.url}
                          download={msg.file.name}
                          className="text-xs text-blue-500 underline mt-1 block"
                        >
                          📎 {msg.file.name}
                        </a>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{msg.time}</span>

                    {/* Pin button */}
                    <button
                      onClick={() => togglePin(msg.id)}
                      className="opacity-0 group-hover:opacity-100 transition ml-2 text-muted-foreground hover:text-blue-500"
                      title={msg.pinned ? "Unpin message" : "Pin message"}
                    >
                      <Pin className={`w-4 h-4 ${msg.pinned ? "text-blue-500" : ""}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input Area */}
            <div className="mt-4 flex items-center gap-2">
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />

              <Button variant="ghost" size="icon" onClick={handleAttachClick}>
                <Paperclip className="w-4 h-4" />
              </Button>

              <Button variant="ghost" size="icon">
                <ImageIcon className="w-4 h-4" />
              </Button>

              <Input
                placeholder={
                  attachedFile ? `Attached: ${attachedFile.name}` : "Type a message..."
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button onClick={handleSend}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel — Calendar + Events */}
      <div className="w-full lg:w-2/5 h-[85vh] flex flex-col gap-4">
        <Card className="flex-1">
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> Mini Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center h-full">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                hasEvent: (date) =>
                  events.some(
                    (e) => e.date.toDateString() === date.toDateString()
                  ),
              }}
              modifiersClassNames={{
                hasEvent:
                  "relative after:content-['•'] after:text-blue-400 after:text-lg after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2",
              }}
            />
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card className="flex-1 overflow-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Event Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground">
                Select a date to view events.
              </p>
            ) : filteredEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No events on this date.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="border-b pb-2">
                    <h4 className="font-semibold">{event.title}</h4>
                    <p className="text-sm text-muted-foreground mb-1">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {event.time}
                      <User className="h-3 w-3 ml-3" />
                      {event.createdBy}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDepartment;
