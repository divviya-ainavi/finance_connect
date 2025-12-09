import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { sendNotification } from "@/hooks/useNotifications";

interface Message {
  id: string;
  content: string;
  sender_profile_id: string;
  is_read: boolean;
  created_at: string;
}

interface MessageThreadProps {
  connectionRequestId: string;
  otherPartyName: string;
  otherPartyPhoto?: string;
  otherPartyProfileId?: string;
}

export function MessageThread({ connectionRequestId, otherPartyName, otherPartyPhoto, otherPartyProfileId }: MessageThreadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchProfileAndMessages();
    }
  }, [user, connectionRequestId]);

  useEffect(() => {
    // Subscribe to realtime messages
    const channel = supabase
      .channel(`messages-${connectionRequestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `connection_request_id=eq.${connectionRequestId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          
          // Mark as read if not sender
          if (newMsg.sender_profile_id !== profileId) {
            markAsRead(newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionRequestId, profileId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchProfileAndMessages = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (profile) {
        setProfileId(profile.id);

        const { data: messagesData } = await supabase
          .from("messages")
          .select("*")
          .eq("connection_request_id", connectionRequestId)
          .order("created_at", { ascending: true });

        setMessages(messagesData || []);

        // Mark unread messages as read
        const unreadMessages = messagesData?.filter(
          (m) => !m.is_read && m.sender_profile_id !== profile.id
        );
        
        if (unreadMessages && unreadMessages.length > 0) {
          for (const msg of unreadMessages) {
            markAsRead(msg.id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("id", messageId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profileId) return;

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        connection_request_id: connectionRequestId,
        sender_profile_id: profileId,
        content: newMessage.trim(),
      });

      if (error) throw error;

      // Send notification to recipient
      if (otherPartyProfileId) {
        // Get sender's name
        const { data: workerProfile } = await supabase
          .from("worker_profiles")
          .select("name")
          .eq("profile_id", profileId)
          .maybeSingle();

        const { data: businessProfile } = await supabase
          .from("business_profiles")
          .select("company_name")
          .eq("profile_id", profileId)
          .maybeSingle();

        const senderName = workerProfile?.name || businessProfile?.company_name || "Someone";

        await sendNotification("new_message", otherPartyProfileId, {
          senderName,
          senderProfileId: profileId,
          connectionRequestId,
        });
      }

      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-lg bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar>
          <AvatarImage src={otherPartyPhoto} />
          <AvatarFallback>{otherPartyName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{otherPartyName}</h3>
          <p className="text-sm text-muted-foreground">Connected</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_profile_id === profileId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {format(new Date(message.created_at), "HH:mm")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}