import { useState } from "react";
import { Chatbot, ChatbotTrigger } from "./Chatbot";

export const ChatbotWrapper = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && <Chatbot onClose={() => setIsOpen(false)} />}
      {!isOpen && <ChatbotTrigger onClick={() => setIsOpen(true)} />}
    </>
  );
};
