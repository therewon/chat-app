import { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import {Toaster} from 'react-hot-toast'
import { AuthContext } from '../context/AuthContext.js'

const App = () => {
  const {authUser, isCheckingAuth} = useContext(AuthContext)

  if (isCheckingAuth) {
    return (
      <div className="app-loading">
        <span className="loading-mark">Q</span>
        <span className="loading-pulse" aria-label="Loading"></span>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Toaster toastOptions={{className: 'quick-toast'}} />
      <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login" />}/>
        <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" /> }/>
        <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/login" />}/>
        <Route path='*' element={<Navigate to={authUser ? "/" : "/login"} replace />}/>
      </Routes>
    </div>
  )
}

export default App
