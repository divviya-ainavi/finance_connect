import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageThread } from "@/components/messaging/MessageThread";
import { Loader2, MessageSquare, ArrowLeft, Users } from "lucide-react";
import { format } from "date-fns";

interface Connection {
  id: string;
  created_at: string;
  worker_profile_id: string;
  business_profile_id: string;
  worker_profiles?: {
    id: string;
    name: string;
    photo_url: string | null;
    profile_id: string;
  };
  business_profiles?: {
    id: string;
    company_name: string;
    logo_url: string | null;
    profile_id: string;
  };
  unreadCount?: number;
}

const Messages = () => {
  const { user, userType } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchConnections();
  }, [user, navigate]);

  const fetchConnections = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!profile) return;
      setProfileId(profile.id);

      let query;

      if (userType === "worker") {
        const { data: workerProfile } = await supabase
          .from("worker_profiles")
          .select("id")
          .eq("profile_id", profile.id)
          .single();

        if (!workerProfile) return;

        const { data } = await supabase
          .from("connection_requests")
          .select(`
            id,
            created_at,
            worker_profile_id,
            business_profile_id,
            business_profiles (id, company_name, logo_url, profile_id)
          `)
          .eq("worker_profile_id", workerProfile.id)
          .eq("status", "accepted")
          .eq("payment_status", "paid")
          .order("updated_at", { ascending: false });

        query = data;
      } else {
        const { data: businessProfile } = await supabase
          .from("business_profiles")
          .select("id")
          .eq("profile_id", profile.id)
          .single();

        if (!businessProfile) return;

        const { data } = await supabase
          .from("connection_requests")
          .select(`
            id,
            created_at,
            worker_profile_id,
            business_profile_id,
            worker_profiles (id, name, photo_url, profile_id)
          `)
          .eq("business_profile_id", businessProfile.id)
          .eq("status", "accepted")
          .eq("payment_status", "paid")
          .order("updated_at", { ascending: false });

        query = data;
      }

      if (query) {
        // Fetch unread counts for each connection
        const connectionsWithUnread = await Promise.all(
          query.map(async (conn: any) => {
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("connection_request_id", conn.id)
              .eq("is_read", false)
              .neq("sender_profile_id", profile.id);

            return { ...conn, unreadCount: count || 0 };
          })
        );

        setConnections(connectionsWithUnread);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOtherPartyName = (connection: Connection) => {
    if (userType === "worker") {
      return connection.business_profiles?.company_name || "Business";
    }
    return connection.worker_profiles?.name || "Finance Professional";
  };

  const getOtherPartyPhoto = (connection: Connection) => {
    if (userType === "worker") {
      return connection.business_profiles?.logo_url || undefined;
    }
    return connection.worker_profiles?.photo_url || undefined;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedConn = connections.find((c) => c.id === selectedConnection);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">Messages</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(userType === "worker" ? "/worker/dashboard" : "/business/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Connections List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Connections
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {connections.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <p>No active connections yet.</p>
                  <Button
                    variant="link"
                    onClick={() => navigate(userType === "worker" ? "/worker/dashboard" : "/search")}
                  >
                    {userType === "worker" ? "View pending requests" : "Find candidates"}
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {connections.map((connection) => (
                    <button
                      key={connection.id}
                      onClick={() => setSelectedConnection(connection.id)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${
                        selectedConnection === connection.id ? "bg-muted" : ""
                      }`}
                    >
                      <Avatar>
                        <AvatarImage src={getOtherPartyPhoto(connection)} />
                        <AvatarFallback>
                          {getOtherPartyName(connection).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {getOtherPartyName(connection)}
                          </p>
                          {connection.unreadCount && connection.unreadCount > 0 && (
                            <Badge variant="default" className="ml-2">
                              {connection.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Connected {format(new Date(connection.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Thread */}
          <div className="lg:col-span-2">
            {selectedConnection && selectedConn ? (
              <MessageThread
                connectionRequestId={selectedConnection}
                otherPartyName={getOtherPartyName(selectedConn)}
                otherPartyPhoto={getOtherPartyPhoto(selectedConn)}
              />
            ) : (
              <Card className="h-[500px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a connection to start messaging</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;