import { lazy, Suspense } from "react";

// Lazy load the chatbot for performance
const ChatbotLive = lazy(() => import("./ChatbotLive").then(m => ({ default: m.ChatbotLive })));

export const ChatbotWrapper = () => {
  return (
    <Suspense fallback={null}>
      <ChatbotLive />
    </Suspense>
  );
};
