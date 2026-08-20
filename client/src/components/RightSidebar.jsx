import { useContext, useMemo } from 'react'
import avatarIcon from '../assets/avatar_icon.png'
import { ChatContext } from '../../context/ChatContext.js'
import { AuthContext } from '../../context/AuthContext.js'

const RightSidebar = () => {

  const {selectedUser, messages} = useContext(ChatContext)
  const {logout, onlineUsers} = useContext(AuthContext)
  const msgImages = useMemo(
    () => messages.filter((message) => message.image).map((message) => message.image),
    [messages]
  )

  return selectedUser && (
    <aside className="profile-sidebar">
      <span className="profile-rail-label">CONTACT DETAILS</span>
      <div className="contact-hero">
        <div className="contact-avatar-ring">
          <img src={selectedUser?.profilePic || avatarIcon} alt={`${selectedUser.fullName} profile`} />
        </div>
        <span className={`presence-chip ${onlineUsers.includes(selectedUser._id) ? 'is-online' : ''}`}>
          <span></span>{onlineUsers.includes(selectedUser._id) ? 'Available now' : 'Currently away'}
        </span>
        <h2>{selectedUser.fullName}</h2>
        <p>{selectedUser.bio || 'No bio shared yet.'}</p>
      </div>

      <section className="media-section">
        <div className="panel-section-title">
          <span>Shared media</span>
          <b>{msgImages.length}</b>
        </div>
        <div className="media-grid">
          {msgImages.map((url, index) => (
            <button type="button" key={url + index} onClick={()=>window.open(url, '_blank', 'noopener,noreferrer')}>
              <img src={url} alt="Shared media" />
            </button>
          ))}
          {msgImages.length === 0 && <p className="empty-media">Shared photos will appear here.</p>}
        </div>
      </section>

      <button type="button" onClick={logout} className="logout-action">
        <span>Log out</span><span>→</span>
      </button>
    </aside>
  )
}

export default RightSidebar
