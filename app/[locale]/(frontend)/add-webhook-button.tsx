"use client";
import { Button } from "@/components/ui/button";
import { hostifyRequest } from "@/utils/hostify-request";
export const AddWebhookButton = () => {
  return (
    <Button
      onClick={async () => {
        const response = await hostifyRequest(
          "webhooks_v2",
          "GET",
          undefined,
          /*{
            url: "https://alojamentoideal.vercel.app/api/webhook/hostify",
            notification_type: "message_new",
            auth: "cXRirAj14XasjPYOs9UDbCYieXrrqj2Gw7wuMvNq",
          }*/
        );
        console.log(response);
      }}
    >
      Add Webhook
    </Button>
  );
};
