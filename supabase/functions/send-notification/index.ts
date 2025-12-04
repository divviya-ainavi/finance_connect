import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "connection_request" | "connection_accepted" | "connection_declined" | "new_message" | "new_review";
  recipientEmail: string;
  recipientName: string;
  senderName?: string;
  metadata?: Record<string, any>;
}

const getEmailContent = (request: NotificationRequest) => {
  const { type, recipientName, senderName, metadata } = request;

  const templates: Record<string, { subject: string; html: string }> = {
    connection_request: {
      subject: "New Connection Request on FinanceConnect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">New Connection Request</h1>
          <p>Hi ${recipientName},</p>
          <p><strong>${senderName}</strong> would like to connect with you on FinanceConnect.</p>
          ${metadata?.message ? `<p style="background: #f4f4f5; padding: 16px; border-radius: 8px;">"${metadata.message}"</p>` : ''}
          <p>Hours per week: ${metadata?.hoursPerWeek || 'Not specified'}</p>
          <p><a href="${metadata?.dashboardUrl || 'https://financeconnect.app'}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Request</a></p>
          <p style="color: #666; font-size: 14px;">Best regards,<br>The FinanceConnect Team</p>
        </div>
      `,
    },
    connection_accepted: {
      subject: "Connection Request Accepted!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">Great News!</h1>
          <p>Hi ${recipientName},</p>
          <p><strong>${senderName}</strong> has accepted your connection request on FinanceConnect.</p>
          <p>You can now message each other directly through the platform.</p>
          <p><a href="${metadata?.dashboardUrl || 'https://financeconnect.app'}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Messaging</a></p>
          <p style="color: #666; font-size: 14px;">Best regards,<br>The FinanceConnect Team</p>
        </div>
      `,
    },
    connection_declined: {
      subject: "Connection Request Update",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">Connection Update</h1>
          <p>Hi ${recipientName},</p>
          <p>Unfortunately, your connection request to ${senderName} was not accepted at this time.</p>
          <p>Don't worry! There are many other talented professionals on FinanceConnect.</p>
          <p><a href="${metadata?.searchUrl || 'https://financeconnect.app/search'}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Browse Candidates</a></p>
          <p style="color: #666; font-size: 14px;">Best regards,<br>The FinanceConnect Team</p>
        </div>
      `,
    },
    new_message: {
      subject: "New Message on FinanceConnect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">New Message</h1>
          <p>Hi ${recipientName},</p>
          <p>You have a new message from <strong>${senderName}</strong>.</p>
          <p><a href="${metadata?.messagesUrl || 'https://financeconnect.app'}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Message</a></p>
          <p style="color: #666; font-size: 14px;">Best regards,<br>The FinanceConnect Team</p>
        </div>
      `,
    },
    new_review: {
      subject: "You Received a New Review on FinanceConnect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">New Review</h1>
          <p>Hi ${recipientName},</p>
          <p><strong>${senderName}</strong> has left you a review on FinanceConnect.</p>
          ${metadata?.rating ? `<p>Rating: ${'⭐'.repeat(metadata.rating)}</p>` : ''}
          <p><a href="${metadata?.reviewsUrl || 'https://financeconnect.app'}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Review</a></p>
          <p style="color: #666; font-size: 14px;">Best regards,<br>The FinanceConnect Team</p>
        </div>
      `,
    },
  };

  return templates[type] || templates.connection_request;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const request: NotificationRequest = await req.json();
    const { recipientEmail, type } = request;

    console.log(`Sending ${type} notification to ${recipientEmail}`);

    const emailContent = getEmailContent(request);

    // Check if Resend API key is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendApiKey) {
      // Send via Resend
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "FinanceConnect <notifications@financeconnect.app>",
          to: [recipientEmail],
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Resend error:", error);
        
        // Log failed notification
        await supabaseClient.from("notification_logs").insert({
          recipient_email: recipientEmail,
          notification_type: type,
          subject: emailContent.subject,
          status: "failed",
          error_message: error,
          metadata: request.metadata,
        });

        throw new Error(`Failed to send email: ${error}`);
      }

      // Log successful notification
      await supabaseClient.from("notification_logs").insert({
        recipient_email: recipientEmail,
        notification_type: type,
        subject: emailContent.subject,
        status: "sent",
        metadata: request.metadata,
      });

      console.log(`Email sent successfully to ${recipientEmail}`);
    } else {
      // Log notification without sending (Resend not configured)
      console.log("Resend API key not configured, logging notification only");
      
      await supabaseClient.from("notification_logs").insert({
        recipient_email: recipientEmail,
        notification_type: type,
        subject: emailContent.subject,
        status: "logged",
        metadata: { ...request.metadata, note: "Email not sent - Resend not configured" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification processed" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);