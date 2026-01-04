import { useState, useEffect } from 'react';
import BorderAnimatedContainer from '../components/BorderAnimatedContainer';
import { useChatStore } from '../store/useChatStore';
import { useGroupStore } from '../store/useGroupStore';
import ActiveTabSwitch from '../components/ActiveTabSwitch';
import ChatsList from '../components/ChatsList';
import ContactList from '../components/ContactList';
import GroupList from '../components/GroupList';
import ExploreGroups from '../components/ExploreGroups';
import NotificationTab from '../components/NotificationTab';
import ChatContainer from '../components/ChatContainer';
import GroupChatContainer from '../components/GroupChatContainer';
import AIChatContainer from '../components/AIChatContainer';
import NoConversationPlaceholder from '../components/NoConversationPlaceholder';
import ProfileHeader from '../components/ProfileHeader';
import CreateGroupModal from '../components/CreateGroupModal';
import AIChatModal from '../components/AIChatModal';
import { useNotificationStore } from '../store/useNotificationStore';
import { PlusIcon, Sparkles } from 'lucide-react';

function ChatPage() {
    const { activeTab, selectedUser, setSelectedUser, subscribeToGlobalMessages, unsubscribeFromGlobalMessages } = useChatStore();
    const { selectedGroup, setSelectedGroup, subscribeToGroups, unsubscribeFromGroups } = useGroupStore();
    const { getUnreadCount, subscribeToNotifications, unsubscribeFromNotifications } = useNotificationStore();
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);

    // Subscribe to group events, global message events, and notifications
    useEffect(() => {
        subscribeToGroups();
        subscribeToGlobalMessages();
        subscribeToNotifications();
        getUnreadCount(); // Fetch initial unread count for badge
        return () => {
            unsubscribeFromGroups();
            unsubscribeFromGlobalMessages();
            unsubscribeFromNotifications();
        };
    }, [subscribeToGroups, unsubscribeFromGroups, subscribeToGlobalMessages, unsubscribeFromGlobalMessages, subscribeToNotifications, unsubscribeFromNotifications, getUnreadCount]);

    // When selecting a group, deselect user and vice versa
    const handleGroupSelect = (group) => {
        setSelectedUser(null);
        setSelectedGroup(group);
    };

    // Determine what to show in the main area
    const renderMainContent = () => {
        // Check if AI contact is selected
        if (selectedUser?.isAI || selectedUser?._id === "chatify-ai") {
            return <AIChatContainer />;
        }
        if (selectedUser) {
            return <ChatContainer />;
        }
        if (selectedGroup) {
            return <GroupChatContainer />;
        }
        return <NoConversationPlaceholder />;
    };

    return (
        <div className='relative w-full max-w-6xl h-[85vh] overflow-hidden'>
            <BorderAnimatedContainer>
                {/* LEFT SIDE */}
                <div className='w-80 bg-w-80 bg-slate-800/50 backdrop-blur-sm flex flex-col'>
                    <ProfileHeader />
                    <ActiveTabSwitch />

                    <div className="flex-1 overflow-y-auto">
                        {activeTab === "chats" && <ChatsList />}
                        {activeTab === "contacts" && <ContactList />}
                        {activeTab === "groups" && (
                            <>
                                {/* Create Group Button */}
                                <div className="px-4 py-3 border-b border-slate-700/50">
                                    <button
                                        onClick={() => setShowCreateGroupModal(true)}
                                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-cyan-600/20 text-cyan-400 rounded-lg hover:bg-cyan-600/30 transition-colors"
                                    >
                                        <PlusIcon className="w-5 h-5" />
                                        Create Group
                                    </button>
                                </div>
                                <GroupList />
                            </>
                        )}
                        {activeTab === "explore" && <ExploreGroups />}
                        {activeTab === "notifications" && <NotificationTab />}
                    </div>
                </div>
                {/* RIGHT SIDE */}
                <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm">
                    {renderMainContent()}
                </div>
            </BorderAnimatedContainer>

            {/* Floating AI Button */}
            <button
                onClick={() => setShowAIModal(true)}
                className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-40 group"
                title="Ask Chatify AI"
            >
                <Sparkles className="w-6 h-6 text-white group-hover:animate-pulse" />
            </button>

            {/* Create Group Modal */}
            <CreateGroupModal
                isOpen={showCreateGroupModal}
                onClose={() => setShowCreateGroupModal(false)}
            />

            {/* AI Chat Modal */}
            <AIChatModal
                isOpen={showAIModal}
                onClose={() => setShowAIModal(false)}
                conversationType={selectedUser ? "private" : selectedGroup ? "group" : null}
                targetId={selectedUser?._id || selectedGroup?._id || null}
                targetName={selectedUser?.fullName || selectedGroup?.name || null}
            />
        </div>
    )
}

export default ChatPage

