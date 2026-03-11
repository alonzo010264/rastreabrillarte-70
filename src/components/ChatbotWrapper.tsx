import { useEffect } from "react";

export const ChatbotWrapper = () => {
  useEffect(() => {
    // Add ElevenLabs widget script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
    script.async = true;
    script.type = "text/javascript";
    document.body.appendChild(script);

    // Add widget element
    const widget = document.createElement("elevenlabs-convai");
    widget.setAttribute("agent-id", "agent_5101kkcnps9yet0vaybzxy9ygz35");
    document.body.appendChild(widget);

    return () => {
      document.body.removeChild(widget);
      document.body.removeChild(script);
    };
  }, []);

  return null;
};
