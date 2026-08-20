import { useContext } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { ChatContext } from '../../context/ChatContext.js'

const HomePage = () => {
  const {selectedUser} = useContext(ChatContext)

  return (
    <main className="home-page">
      <section className={`chat-workspace ${selectedUser ? 'is-chatting' : 'is-idle'}`}>
        <Sidebar />
        <ChatContainer/>
        <RightSidebar/>
      </section>
    </main>
  )
}

export default HomePage
