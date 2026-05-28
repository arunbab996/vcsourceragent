import { useState } from 'react'
import { DiscoveryScoutLogo } from './Logos'

export default function PasswordGate({ onUnlock }) {
  const [value, setValue]   = useState('')
  const [error, setError]   = useState(false)
  const [shaking, setShake] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    const PASSWORD = import.meta.env.VITE_ACCESS_PASSWORD
    if (value === PASSWORD) {
      localStorage.setItem('ds_auth', '1')
      onUnlock()
    } else {
      setError(true)
      setShake(true)
      setValue('')
      setTimeout(() => setShake(false), 420)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: '#0F0F0F',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 320,
        animation: shaking ? 'dsShake .42s ease' : 'none',
      }}>
        <style>{`
          @keyframes dsShake {
            0%,100% { transform: translateX(0); }
            20%      { transform: translateX(-8px); }
            40%      { transform: translateX(8px); }
            60%      { transform: translateX(-5px); }
            80%      { transform: translateX(5px); }
          }
        `}</style>

        {/* Logo + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <DiscoveryScoutLogo size={20} />
          <span style={{ color: '#DDD', fontSize: 13, fontWeight: 600, fontFamily: 'system-ui,sans-serif' }}>discoveryos</span>
          <span style={{ color: '#444', fontSize: 13 }}>/</span>
          <span style={{ color: '#555', fontSize: 13, fontFamily: 'system-ui,sans-serif' }}>scout</span>
        </div>

        {/* Heading */}
        <p style={{ color: '#E2E2E2', fontSize: 15, fontWeight: 600, margin: '0 0 4px', fontFamily: 'system-ui,sans-serif' }}>
          Access required
        </p>
        <p style={{ color: '#555', fontSize: 12, margin: '0 0 20px', fontFamily: 'system-ui,sans-serif' }}>
          Enter the access code to continue
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="password"
            value={value}
            onChange={e => { setValue(e.target.value); setError(false) }}
            placeholder="Access code"
            autoFocus
            style={{
              background: '#1A1A1A',
              border: `1px solid ${error ? '#7A3030' : '#2A2A2A'}`,
              borderRadius: 7,
              color: '#E2E2E2',
              fontSize: 13,
              padding: '9px 12px',
              outline: 'none',
              fontFamily: 'system-ui,sans-serif',
              transition: 'border-color .2s',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <p style={{ color: '#8A4040', fontSize: 11, margin: 0, fontFamily: 'system-ui,sans-serif' }}>
              Incorrect code — try again
            </p>
          )}

          <button
            type="submit"
            disabled={!value}
            style={{
              background: value ? '#1060E8' : '#161616',
              color: value ? '#fff' : '#444',
              border: 'none',
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              padding: '9px 0',
              cursor: value ? 'pointer' : 'default',
              transition: 'background .2s, color .2s',
              fontFamily: 'system-ui,sans-serif',
            }}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}
