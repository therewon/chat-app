import { useContext, useEffect, useState } from 'react'
import avatarIcon from '../assets/avatar_icon.png'
import { useNavigate } from 'react-router-dom'
import { ChatContext } from '../../context/ChatContext.js'
import { AuthContext } from '../../context/AuthContext.js'

const Sidebar = () => {

    const { getUsers, users, selectedUser, selectUser, unseenMessages} = useContext(ChatContext)

    const { logout, onlineUsers } = useContext(AuthContext)

    const [input, setInput] = useState('')
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const navigate = useNavigate()

    const filteredUsers = input ? users.filter((user)=> user.fullName.toLowerCase().includes(input.toLowerCase())) : users

    useEffect(()=>{
        getUsers()
    },[getUsers])

    return (
        <aside className={`conversation-sidebar ${selectedUser ? "mobile-hidden" : ""}`}>
            <header className="sidebar-top">
                <div className="sidebar-brand-row">
                    <div className="brand-lockup compact">
                        <span className="brand-name">ChatFree</span>
                    </div>
                    <div className="menu-wrap" onMouseLeave={() => setIsMenuOpen(false)}>
                        <button
                            type="button"
                            className="sidebar-menu-button"
                            onClick={() => setIsMenuOpen((open) => !open)}
                            aria-label="Open account menu"
                            aria-expanded={isMenuOpen}
                        >
                            •••
                        </button>
                        <div className={`account-menu ${isMenuOpen ? 'is-open' : ''}`}>
                            <button type="button" onClick={() => { setIsMenuOpen(false); navigate('/profile') }}>Edit profile <span>↗</span></button>
                            <button type="button" onClick={()=> { setIsMenuOpen(false); logout() }}>Log out <span>→</span></button>
                        </div>
                    </div>
                </div>

                <div className="sidebar-title-row">
                    <div>
                        <span className="section-kicker">INBOX</span>
                        <h1>Messages</h1>
                    </div>
                    <span className="user-count">{users.length}</span>
                </div>

                <label className="search-box">
                    <span aria-hidden="true">⌕</span>
                    <input onChange={(e)=>setInput(e.target.value)} value={input} type="search" placeholder="Search people" aria-label="Search people" />
                </label>
            </header>

            <div className="conversation-list">
                {filteredUsers.map((user) => (
                    <button
                        type="button"
                        onClick={() => selectUser(user)}
                        key={user._id}
                        className={`conversation-item ${selectedUser?._id === user._id ? 'is-active' : ''}`}>
                        <span className="avatar-wrap">
                            <img src={user?.profilePic || avatarIcon} alt={`${user.fullName} profile`} />
                            <span className={`presence-dot ${onlineUsers.includes(user._id) ? 'is-online' : ''}`}></span>
                        </span>
                        <span className="conversation-copy">
                            <strong>{user.fullName}</strong>
                            <span>{onlineUsers.includes(user._id) ? 'Available now' : 'Away for now'}</span>
                        </span>
                        {unseenMessages[user._id] && <span className="unread-count">{unseenMessages[user._id]}</span>}
                        <span className="row-arrow" aria-hidden="true">›</span>
                    </button>
                ))}
                {filteredUsers.length === 0 && (
                    <div className="empty-list">
                        <span>⌕</span>
                        <p>No people found</p>
                    </div>
                )}
            </div>
            <footer className="sidebar-footer"><span></span> Realtime connection</footer>
        </aside>
    )
}

export default Sidebar
