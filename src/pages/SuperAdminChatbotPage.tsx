// Dedicated Super Admin AI Chatbot page.
// Reuses the ChatbotPage component at a separate route (/super-admin/chatbot)
// so the Super Admin Guard does not redirect away when launched from the
// Super Admin side panel.
import ChatbotPage from './ChatbotPage';

const SuperAdminChatbotPage = () => <ChatbotPage />;

export default SuperAdminChatbotPage;
