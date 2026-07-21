'use client';

import { DocPageLayout } from '@/components/docs/doc-page-layout';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';

export default function ChatRoomsPage() {
  return (
    <DocPageLayout
      title="In-App Live Chat"
      subtitle="AuthSys includes a built-in chat system that lets your end users send messages directly from your application. Perfect for in-game chat, support ticketing, and community features."
      sections={[
        {
          title: 'Creating Chat Rooms',
          content: (
            <>
              <p>Chat rooms are created per application from the dashboard or API:</p>
              <CodeBlock code={`// Create a chat room
POST /api/v1/developer/chatrooms
{
  "app_id": 1,
  "name": "General Support",
  "is_global": false
}

// List chat rooms
GET /api/v1/developer/chatrooms`} lang="bash" title="Chat rooms API" />
              <Callout variant="info">
                Chat room limits are based on your plan. Free and Developer plans have limited room counts. Seller and Enterprise plans have unlimited rooms.
              </Callout>
            </>
          ),
        },
        {
          title: 'Sending Messages (Client-Side)',
          content: (
            <>
              <p>End users can send messages to a chat room using the client API:</p>
              <CodeBlock code={`// End user sends a message
POST /api/v1/client/chat/send
{
  "room_id": 1,
  "message": "Hello! I need help with activation."
}

// Fetch messages (authenticated)
GET /api/v1/developer/chatrooms/{room_id}/messages`} lang="bash" title="Send & receive messages" />
            </>
          ),
        },
      ]}
    />
  );
}
