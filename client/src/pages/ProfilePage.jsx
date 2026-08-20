import { useContext, useEffect, useMemo, useState } from 'react'
import {useNavigate} from 'react-router-dom'
import toast from 'react-hot-toast'
import avatarIcon from '../assets/avatar_icon.png'
import { AuthContext } from '../../context/AuthContext.js'

const MAX_IMAGE_SIZE = 3 * 1024 * 1024

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(new Error("Could not read the selected image"))
  reader.readAsDataURL(file)
})

const ProfilePage = () => {
  const { authUser , updateProfile } = useContext(AuthContext)

  const [selectedImg, setSelectedImg] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const [name, setName] = useState(authUser.fullName || '')
  const [bio, setBio] = useState(authUser.bio || '')
  const previewUrl = useMemo(
    () => selectedImg ? URL.createObjectURL(selectedImg) : null,
    [selectedImg]
  )

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const handleImageChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      event.target.value = ""
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be smaller than 3 MB")
      event.target.value = ""
      return
    }

    setSelectedImg(file)
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const profilePic = selectedImg ? await readFileAsDataUrl(selectedImg) : undefined
      const wasUpdated = await updateProfile({profilePic, fullName: name.trim(), bio: bio.trim()})
      if (wasUpdated) navigate('/')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="profile-page">
      <button type="button" className="profile-back" onClick={() => navigate('/')}>
        <span>←</span> Back to messages
      </button>

      <section className="profile-editor">
        <aside className="profile-preview-panel">
          <div className="brand-lockup compact">
            <span className="brand-mark">Q</span>
            <span className="brand-name">QuickChat</span>
          </div>

          <div className="profile-preview-content">
            <span className="section-kicker">YOUR PROFILE</span>
            <div className="profile-preview-avatar">
              <img src={previewUrl || authUser.profilePic || avatarIcon} alt="Profile preview" />
              <span></span>
            </div>
            <h1>{name || 'Your name'}</h1>
            <p>{bio || 'Your bio will appear here.'}</p>
          </div>

          <p className="profile-preview-note">This is how people see you in conversations.</p>
        </aside>

        <form onSubmit={handleSubmit} className="profile-form-card">
          <div className="profile-form-heading">
            <span className="form-kicker">PERSONAL DETAILS</span>
            <h2>Make it feel like you.</h2>
            <p>Update your photo, display name and the short intro shown to your contacts.</p>
          </div>

          <label htmlFor="avatar" className="upload-card">
            <input onChange={handleImageChange} type="file" id='avatar' accept='.png, .jpg, .jpeg, .webp' hidden />
            <img src={previewUrl || authUser.profilePic || avatarIcon} alt="Profile preview" />
            <span><strong>Change profile photo</strong><small>PNG, JPG or WEBP · Max 3 MB</small></span>
            <b>＋</b>
          </label>

          <label className="field-group">
            <span>Display name</span>
            <input onChange={(e)=>setName(e.target.value)} value={name} type="text" required placeholder='Your name' />
          </label>

          <label className="field-group">
            <span>Short bio</span>
            <textarea onChange={(e)=>setBio(e.target.value)} value={bio} placeholder='Write profile bio' required rows={5}></textarea>
          </label>

          <div className="profile-actions">
            <button type="button" className="secondary-action" onClick={() => navigate('/')}>Cancel</button>
            <button type="submit" disabled={isSubmitting} className="primary-action profile-save">
              <span>{isSubmitting ? "Saving..." : "Save changes"}</span><span>↗</span>
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default ProfilePage
