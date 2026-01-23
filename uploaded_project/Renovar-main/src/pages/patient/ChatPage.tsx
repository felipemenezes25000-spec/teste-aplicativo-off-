import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChatWindow } from '@/components/ChatWindow';
import { MobileLayout } from '@/components/layout/MobileLayout';

export default function ChatPage() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const location = useLocation();
  const { requestType, otherUserName } = location.state || { 
    requestType: 'prescription', 
    otherUserName: 'Médico' 
  };

  if (!requestId) {
    navigate('/history');
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <ChatWindow
        requestId={requestId}
        requestType={requestType}
        otherUserName={otherUserName}
        onBack={() => navigate(-1)}
      />
    </div>
  );
}
