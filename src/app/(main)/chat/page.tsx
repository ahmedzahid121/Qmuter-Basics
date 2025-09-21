"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video,
  User,
  MessageCircle,
  Clock
} from "lucide-react";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

interface ChatConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data for development
  const mockConversations: ChatConversation[] = [
    {
      id: "1",
      participantId: "driver1",
      participantName: "John Smith",
      participantAvatar: null,
      lastMessage: "See you tomorrow at 8 AM!",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      unreadCount: 2,
      isOnline: true
    },
    {
      id: "2",
      participantId: "driver2",
      participantName: "Sarah Johnson",
      participantAvatar: null,
      lastMessage: "Thanks for the ride today!",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      unreadCount: 0,
      isOnline: false
    }
  ];

  const mockMessages: ChatMessage[] = [
    {
      id: "1",
      senderId: "driver1",
      senderName: "John Smith",
      senderAvatar: null,
      content: "Hi! I'm your driver for tomorrow's ride.",
      timestamp: new Date(1704063600000), // Static timestamp - 1 hour ago
      isRead: true
    },
    {
      id: "2",
      senderId: user?.uid || "",
      senderName: user?.displayName || "You",
      senderAvatar: user?.photoURL || undefined,
      content: "Hello! Looking forward to it.",
      timestamp: new Date(1704064500000), // Static timestamp - 45 minutes ago
      isRead: true
    },
    {
      id: "3",
      senderId: "driver1",
      senderName: "John Smith",
      senderAvatar: null,
      content: "I'll pick you up at the main entrance at 8 AM sharp.",
      timestamp: new Date(1704065400000), // Static timestamp - 30 minutes ago
      isRead: false
    },
    {
      id: "4",
      senderId: "driver1",
      senderName: "John Smith",
      senderAvatar: null,
      content: "See you tomorrow at 8 AM!",
      timestamp: new Date(1704065400000), // Static timestamp - 30 minutes ago
      isRead: false
    }
  ];

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConversations(mockConversations);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load conversations."
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessages(mockMessages);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load messages."
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: user?.uid || "",
      senderName: user?.displayName || "You",
      senderAvatar: user?.photoURL || undefined,
      content: newMessage.trim(),
      timestamp: new Date(),
      isRead: false
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, message]);
    setNewMessage("");

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update conversation list
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, lastMessage: message.content, lastMessageTime: message.timestamp, unreadCount: 0 }
          : conv
      ));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message."
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto max-w-6xl p-4 h-[calc(100vh-120px)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Messages</span>
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No conversations yet.</p>
                  <p className="text-sm text-muted-foreground">Start booking rides to chat with drivers!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={selectedConversation?.id === conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation.participantAvatar} />
                        <AvatarFallback>
                          {selectedConversation.participantName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{selectedConversation.participantName}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className={`w-2 h-2 rounded-full ${selectedConversation.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          {selectedConversation.isOnline ? 'Online' : 'Offline'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {loading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-3 animate-pulse">
                              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No messages yet.</p>
                          <p className="text-sm text-muted-foreground">Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <MessageItem
                            key={message.id}
                            message={message}
                            isOwnMessage={message.senderId === user?.uid}
                          />
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          className="flex-1"
                        />
                        <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a conversation to start messaging.</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

const ConversationItem = ({ 
  conversation, 
  isSelected, 
  onClick 
}: { 
  conversation: ChatConversation; 
  isSelected: boolean; 
  onClick: () => void; 
}) => {
  return (
    <div
      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
        isSelected ? 'bg-muted' : ''
      }`}
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.participantAvatar} />
          <AvatarFallback>
            {conversation.participantName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
          conversation.isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`}></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium truncate">{conversation.participantName}</h4>
          <span className="text-xs text-muted-foreground">
            {formatTime(conversation.lastMessageTime)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
      </div>
      {conversation.unreadCount > 0 && (
        <Badge variant="default" className="ml-2">
          {conversation.unreadCount}
        </Badge>
      )}
    </div>
  );
};

const MessageItem = ({ 
  message, 
  isOwnMessage 
}: { 
  message: ChatMessage; 
  isOwnMessage: boolean; 
}) => {
  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.senderAvatar} />
          <AvatarFallback>
            {message.senderName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[70%] ${isOwnMessage ? 'order-first' : ''}`}>
        <div className={`rounded-lg px-4 py-2 ${
          isOwnMessage 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}>
          <p className="text-sm">{message.content}</p>
        </div>
        <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
          isOwnMessage ? 'justify-end' : 'justify-start'
        }`}>
          <Clock className="h-3 w-3" />
          {formatTime(message.timestamp)}
          {isOwnMessage && (
            <span className={message.isRead ? 'text-blue-500' : 'text-muted-foreground'}>
              {message.isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
