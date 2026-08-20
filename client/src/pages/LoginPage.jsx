import { useContext, useState } from 'react'
import { AuthContext } from '../../context/AuthContext.js'

const LoginPage = () => {
  const [currState, setCurrState] = useState('Sign up')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bio, setBio] = useState('')
  const [isDataSubmitted, setIsDataSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useContext(AuthContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    if (currState === "Sign up" && !isDataSubmitted) {
      setIsDataSubmitted(true)
      return;
    }

    setIsSubmitting(true)
    await login(currState === "Sign up" ? "signup" : "login", {
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      bio: bio.trim(),
    })
    setIsSubmitting(false)
  }
  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="QuickChat introduction">
        <div className="brand-lockup">
          <span className="brand-name">ChatFree</span>
        </div>

        <div className="auth-story">
          <span className="eyebrow">CONVERSATIONS, REFOCUSED</span>
          <h1>Make room for<br/><em>real connection.</em></h1>
          <p>A calmer space for the people who matter. Fast messages, shared moments, zero clutter.</p>
        </div>

        <div className="auth-proof">
          <div><strong>01</strong><span>Private by design</span></div>
          <div><strong>02</strong><span>Present on every device</span></div>
          <div><strong>03</strong><span>Built for everyday moments</span></div>
        </div>
      </section>

      <section className="auth-form-panel">
        <form onSubmit={onSubmitHandler} className="auth-card">
          <div className="auth-card-head">
            <div>
              <span className="form-kicker">
                {currState === "Sign up" ? (isDataSubmitted ? "STEP 2 OF 2" : "START HERE") : "WELCOME BACK"}
              </span>
              <h2>{currState === "Login" ? "Sign in to your space" : isDataSubmitted ? "Tell us about you" : "Create your account"}</h2>
              <p>{currState === "Login" ? "Your conversations are waiting." : isDataSubmitted ? "A short bio helps people recognize you." : "Set up your profile in under a minute."}</p>
            </div>
          {isDataSubmitted && (
            <button type="button" className="icon-button" onClick={() => setIsDataSubmitted(false)} aria-label="Back to account details">
              ←
            </button>
          )}
          </div>

        {
          currState === 'Sign up' && !isDataSubmitted && (
            <label className="field-group">
              <span>Full name</span>
              <input type="text" value={fullName} autoComplete="name" onChange={(e) => setFullName(e.target.value)} placeholder="How should people know you?" required />
            </label>
          )
        }

        {
          !isDataSubmitted && (
            <>
              <label className="field-group">
                <span>Email address</span>
                <input onChange={(e) => setEmail(e.target.value)} value={email} type="email" autoComplete="email" placeholder="you@example.com" required />
              </label>
              <label className="field-group">
                <span>Password</span>
                <input onChange={(e) => setPassword(e.target.value)} value={password} type="password" autoComplete={currState === "Sign up" ? "new-password" : "current-password"} minLength={6} placeholder="At least 6 characters" required />
              </label>
            </>
          )
        }

        {
          currState === "Sign up" && isDataSubmitted && (
            <label className="field-group">
              <span>Short bio</span>
              <textarea onChange={(e) => setBio(e.target.value)} value={bio} rows={5} placeholder="A few words about you..." required></textarea>
            </label>
          )
        }

        <button type='submit' disabled={isSubmitting} className="primary-action">
          <span>{isSubmitting ? "Please wait..." : currState === "Login" ? "Sign in" : isDataSubmitted ? "Create account" : "Continue"}</span>
          <span aria-hidden="true">↗</span>
        </button>

        {currState === "Sign up" && (
          <label className="terms-row">
            <input type="checkbox" required />
            <span>I agree to the terms of use and privacy policy.</span>
          </label>
        )}

          <p className="auth-switch">
            {currState === "Sign up" ? "Already have an account?" : "New to QuickChat?"}
            <button type="button" onClick={() => { setCurrState(currState === "Sign up" ? "Login" : "Sign up"); setIsDataSubmitted(false) }}>
              {currState === "Sign up" ? "Sign in" : "Create an account"}
            </button>
          </p>
        </form>
        <p className="auth-footnote">Your conversations stay yours.</p>
      </section>
    </main>
  )
}

export default LoginPage
