import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: string;
  recipientProfileId?: string;
  recipientEmail?: string;
  data: Record<string, any>;
}

const WEBHOOK_URLS = {
  onboard: "https://n8ndev.applygenius.ai/webhook/onboard",
  reference: "https://n8ndev.applygenius.ai/webhook/refrence",
  accept: "https://n8ndev.applygenius.ai/webhook/user-accept",
  reject: "https://n8ndev.applygenius.ai/webhook/user-reject",
};

async function sendWebhook(url: string, payload: Record<string, any>) {
  try {
    console.log(`Sending webhook to ${url}:`, payload);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log(`Webhook response status: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error(`Webhook error:`, error);
    return false;
  }
}

async function createInAppNotification(
  supabase: any,
  recipientProfileId: string,
  title: string,
  message: string,
  type: string,
  metadata: Record<string, any> = {}
) {
  const { error } = await supabase.from("in_app_notifications").insert({
    recipient_profile_id: recipientProfileId,
    title,
    message,
    type,
    metadata,
  });
  if (error) console.error("Error creating in-app notification:", error);
  return !error;
}

async function getAdminProfileIds(supabase: any) {
  // Get all admin user IDs
  const { data: adminRoles } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  
  if (!adminRoles || adminRoles.length === 0) {
    console.log("No admin users found in user_roles");
    return [];
  }
  
  console.log(`Found ${adminRoles.length} admin user(s)`);
  
  // Try to get profiles for these users
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, user_id")
    .in("user_id", adminRoles.map((r: any) => r.user_id));
  
  // If profiles exist, return their IDs
  if (profiles && profiles.length > 0) {
    console.log(`Found ${profiles.length} admin profile(s)`);
    return profiles.map((p: any) => ({ id: p.id }));
  }
  
  // If no profiles exist for admins, create them
  console.log("No admin profiles found, creating them...");
  const createdProfiles = [];
  for (const adminRole of adminRoles) {
    const { data: newProfile, error } = await supabase
      .from("profiles")
      .insert({
        user_id: adminRole.user_id,
        user_type: "worker", // Admin is a role, not a user type - use worker as placeholder
      })
      .select("id")
      .single();
    
    if (newProfile) {
      createdProfiles.push({ id: newProfile.id });
    } else if (error) {
      console.error("Error creating admin profile:", error);
    }
  }
  
  return createdProfiles;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { type, recipientProfileId, recipientEmail, data }: NotificationRequest = await req.json();
    console.log(`Processing notification type: ${type}`, { recipientProfileId, data });

    switch (type) {
      case "user_onboarded": {
        // Send email webhook
        await sendWebhook(WEBHOOK_URLS.onboard, {
          email: data.email,
          name: data.name,
        });
        
        // Send in-app notification to all admins
        const adminProfiles = await getAdminProfileIds(supabase);
        for (const admin of adminProfiles) {
          await createInAppNotification(
            supabase,
            admin.id,
            "New User Onboarded",
            `A new ${data.userType === 'worker' ? 'Finance Professional' : 'Business'} "${data.name}" has joined the platform.`,
            "user_onboarded",
            { userType: data.userType, userId: data.userId }
          );
        }
        break;
      }

      case "verification_completed": {
        // In-app notification to finance professional
        if (recipientProfileId) {
          await createInAppNotification(
            supabase,
            recipientProfileId,
            "Verification Updated",
            `Your ${data.verificationType} verification has been ${data.status}.`,
            "verification_completed",
            { verificationType: data.verificationType, status: data.status }
          );
        }
        break;
      }

      case "reference_added": {
        // Send email webhook for reference
        await sendWebhook(WEBHOOK_URLS.reference, {
          email: data.userEmail,
          refemail: data.refereeEmail,
          refname: data.refereeName,
          role: data.refereeRole,
          company: data.refereeCompany,
          name: data.userName,
        });
        break;
      }

      case "connection_request_sent": {
        // In-app notification to finance professional
        if (recipientProfileId) {
          await createInAppNotification(
            supabase,
            recipientProfileId,
            "New Connection Request",
            `${data.businessName} has sent you a connection request.`,
            "connection_request",
            { businessProfileId: data.businessProfileId, requestId: data.requestId }
          );
        }
        break;
      }

      case "connection_accepted": {
        // Send email webhook
        await sendWebhook(WEBHOOK_URLS.accept, {
          email: data.businessEmail,
          name: data.businessName,
        });
        
        // In-app notification to business
        if (recipientProfileId) {
          await createInAppNotification(
            supabase,
            recipientProfileId,
            "Connection Accepted",
            `${data.workerName} has accepted your connection request.`,
            "connection_accepted",
            { workerProfileId: data.workerProfileId, requestId: data.requestId }
          );
        }
        break;
      }

      case "connection_declined": {
        // Send email webhook
        await sendWebhook(WEBHOOK_URLS.reject, {
          email: data.businessEmail,
          name: data.businessName,
        });
        
        // In-app notification to business
        if (recipientProfileId) {
          await createInAppNotification(
            supabase,
            recipientProfileId,
            "Connection Declined",
            `${data.workerName} has declined your connection request.`,
            "connection_declined",
            { workerProfileId: data.workerProfileId, requestId: data.requestId }
          );
        }
        break;
      }

      case "payment_completed": {
        // In-app notification to worker
        if (recipientProfileId) {
          await createInAppNotification(
            supabase,
            recipientProfileId,
            "Payment Completed",
            `${data.businessName} has completed payment. You can now start chatting!`,
            "payment_completed",
            { businessProfileId: data.businessProfileId, requestId: data.requestId }
          );
        }
        break;
      }

      case "new_message": {
        // In-app notification to recipient
        if (recipientProfileId) {
          await createInAppNotification(
            supabase,
            recipientProfileId,
            "New Message",
            `You have a new message from ${data.senderName}.`,
            "new_message",
            { connectionRequestId: data.connectionRequestId, senderProfileId: data.senderProfileId }
          );
        }
        break;
      }

      case "new_review": {
        // In-app notification to reviewee
        if (recipientProfileId) {
          await createInAppNotification(
            supabase,
            recipientProfileId,
            "New Review",
            `${data.reviewerName} has left you a ${data.rating}-star review.`,
            "new_review",
            { reviewId: data.reviewId, rating: data.rating }
          );
        }
        break;
      }

      default:
        console.log(`Unknown notification type: ${type}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
