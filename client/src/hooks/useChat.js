export const useChat = () => {
  const startNewChat = (userId, options) => {
    console.log("Navigating to chat with:", userId, options.initialMessage);
  };
  return { startNewChat };
};