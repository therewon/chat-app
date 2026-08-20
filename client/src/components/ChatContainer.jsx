import { useContext, useEffect, useRef, useState } from 'react'
import avatarIcon from '../assets/avatar_icon.png'
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext.js'
import { AuthContext } from '../../context/AuthContext.js'
import toast from 'react-hot-toast'

const MAX_IMAGE_SIZE = 3 * 1024 * 1024

const ChatContainer = () => {

  const { messages, selectedUser, setSelectedUser, sendMessages, getMessages } = useContext(ChatContext)
  const { authUser, onlineUsers } = useContext(AuthContext)

  const scrollEnd = useRef()

  const [input, setInput] = useState('')

  
  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if(input.trim() === "") return;
    const wasSent = await sendMessages({text: input.trim()})
    if (wasSent) setInput("")
  }
  
  // handle sending an image
  const handleSendImage = async (e) => {
    const file = e.target.files[0]
    if(!file || !file.type.startsWith("image/")){
      toast.error("select an image file")
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be smaller than 3 MB")
      e.target.value = ""
      return
    }
    const reader = new FileReader()
    
    reader.onloadend = async () => {
      const wasSent = await sendMessages({image: reader.result})
      if (wasSent) e.target.value = ""
    }
    reader.readAsDataURL(file)
    
  }

  useEffect(()=>{
    if(selectedUser){
      getMessages(selectedUser._id)
    }
  },[getMessages, selectedUser])

  useEffect(()=> {
    if(scrollEnd.current && messages){
      scrollEnd.current.scrollIntoView({behavior: 'smooth'})
    }
  },[messages])
  
  return selectedUser ? (
    <section className="chat-panel">
      <header className="chat-header">
        <button type="button" onClick={()=>setSelectedUser(null)} className="mobile-back" aria-label="Back to users">
          ←
        </button>
        <span className="avatar-wrap header-avatar">
          <img src={selectedUser.profilePic || avatarIcon} alt={`${selectedUser.fullName} profile`}/>
          <span className={`presence-dot ${onlineUsers.includes(selectedUser._id) ? 'is-online' : ''}`}></span>
        </span>
        <div className="chat-person">
          <strong>{selectedUser.fullName}</strong>
          <span>{onlineUsers.includes(selectedUser._id) ? 'Online — replies quickly' : 'Offline — messages will be waiting'}</span>
        </div>
        <span className="secure-chip"><span>●</span> Private chat</span>
      </header>

      <div className="messages-feed">
        <div className="day-marker"><span>Today</span></div>
        {messages.map((msg)=> (
            <div key={msg._id} className={`message-row ${msg.senderId === authUser._id ? 'is-own' : 'is-incoming'}`}>
              <img className="message-avatar" src={msg.senderId === authUser._id ? authUser?.profilePic || avatarIcon : selectedUser?.profilePic || avatarIcon} alt="" />
              <div className="message-stack">
                {msg.image ? (
                  <button type="button" className="message-image" onClick={() => window.open(msg.image, '_blank', 'noopener,noreferrer')}>
                    <img src={msg.image} alt="Shared attachment" />
                  </button>
                ) : (
                  <p className="message-bubble">{msg.text}</p>
                )}
                <span className="message-time">{formatMessageTime(msg.createdAt)}</span>
              </div>
            </div>
        ))}
        <div ref={scrollEnd}></div>
      </div>

      <form className="message-composer" onSubmit={handleSendMessage}>
        <label htmlFor="image" className="attachment-button" title="Attach image">
          <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg, image/webp' hidden />
          ＋
        </label>
        <input type="text" onChange={(e)=> setInput(e.target.value)} value={input} placeholder='Write a message...' className="composer-input" aria-label="Message" />
        <button type="submit" className="composer-send" aria-label="Send message">
          <span>Send</span><b>↗</b>
        </button>
      </form>
    </section>
  ) : (
    <section className="empty-chat">
      <span className="section-kicker">SELECT A CONVERSATION</span>
      <div className="empty-orbit" aria-hidden="true">
        <span className="orbit-dot one"></span>
        <span className="orbit-dot two"></span>
        <span className="orbit-dot three"></span>
        <img src="/logo.png" alt="" className='w-35 rounded-full'/>
      </div>
      <h2>Your people,<br/><em>one place.</em></h2>
      <p>Choose someone from your inbox and pick up right where you left off.</p>
    </section>
  )
}

export default ChatContainer
