// HW05 local demo: Passport Local authentication and server-side sessions.
(() => {
  'use strict'

  const form = document.querySelector('#auth-form')
  const emailInput = document.querySelector('#demo-email')
  const passwordInput = document.querySelector('#demo-password')
  const submitButton = document.querySelector('#auth-submit')
  const logoutButton = document.querySelector('#demo-logout')
  const accessButton = document.querySelector('#check-access')
  const accessResponse = document.querySelector('#auth-response')
  const themeFeedback = document.querySelector('#theme-feedback')
  const authFeedback = document.querySelector('#auth-feedback')
  const accessFeedback = document.querySelector('#access-feedback')
  const authState = document.querySelector('#auth-state-label')
  const authDetail = document.querySelector('#auth-state-detail')
  const sessionButton = document.querySelector('#session-check')
  const sessionResetButton = document.querySelector('#session-reset')
  const sessionFeedback = document.querySelector('#session-feedback')
  const themeButtons = [...document.querySelectorAll('[data-theme-choice]')]
  const modeButtons = [...document.querySelectorAll('[data-auth-mode]')]

  let mode = 'register'

  function showFeedback(element, message, kind = '') {
    element.textContent = message
    if (kind) element.dataset.kind = kind
    else delete element.dataset.kind
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    })

    const raw = await response.text()
    let body = null
    if (raw) {
      try { body = JSON.parse(raw) }
      catch { body = { message: raw } }
    }
    return { status: response.status, ok: response.ok, body }
  }

  function updateAuthState(user) {
    const authorized = Boolean(user)
    authState.textContent = authorized ? `Signed in: ${user.email}` : 'Not signed in'
    authDetail.textContent = authorized
      ? 'Passport authenticated this user and restored the account from the server-side session.'
      : 'Register or sign in to create an authenticated Passport session.'
    logoutButton.disabled = !authorized
  }

  async function checkAccess(silent = false) {
    try {
      const result = await api('/protected')
      const user = result.ok ? result.body?.user : null
      updateAuthState(user)
      accessResponse.textContent = `HTTP ${result.status}\n${JSON.stringify(result.body, null, 2)}`
      if (!silent) {
        showFeedback(accessFeedback,
          result.ok ? 'Access granted: Passport session is authenticated.' : 'Access denied: authentication required.',
          result.ok ? 'success' : 'error')
      }
      return result
    } catch {
      updateAuthState(null)
      accessResponse.textContent = 'Server unavailable.'
      showFeedback(accessFeedback, 'Could not reach the Express server.', 'error')
      return null
    }
  }

  for (const button of modeButtons) {
    button.addEventListener('click', () => {
      mode = button.dataset.authMode
      for (const item of modeButtons) item.setAttribute('aria-pressed', String(item === button))
      submitButton.textContent = mode === 'register' ? 'Create account' : 'Sign in'
      passwordInput.autocomplete = mode === 'register' ? 'new-password' : 'current-password'
      showFeedback(authFeedback, '')
    })
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (!form.reportValidity()) return

    const email = emailInput.value.trim()
    const password = passwordInput.value
    const endpoint = mode === 'register' ? '/auth/register' : '/auth/login'
    submitButton.disabled = true
    form.setAttribute('aria-busy', 'true')
    showFeedback(authFeedback, 'Contacting server…')

    try {
      const result = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (!result.ok) {
        showFeedback(authFeedback, `HTTP ${result.status}: ${result.body?.error || 'Request failed'}`, 'error')
        return
      }

      showFeedback(authFeedback,
        `HTTP ${result.status}: ${mode === 'register' ? 'Account created' : 'Signed in'} successfully.`,
        'success')
      await checkAccess(true)
    } catch {
      showFeedback(authFeedback, 'Could not reach the Express server.', 'error')
    } finally {
      passwordInput.value = ''
      submitButton.disabled = false
      form.removeAttribute('aria-busy')
    }
  })

  logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true
    try {
      const result = await api('/auth/logout', { method: 'POST' })
      if (!result.ok) throw new Error('Logout request failed')
      showFeedback(authFeedback, 'Signed out. The Passport session was destroyed.', 'success')
      await checkAccess(true)
      showFeedback(accessFeedback, 'HTTP 401 expected after logout.', 'success')
    } catch {
      showFeedback(authFeedback, 'Logout failed. Please retry.', 'error')
      await checkAccess(true)
    }
  })

  accessButton.addEventListener('click', () => checkAccess())

  for (const button of themeButtons) {
    button.addEventListener('click', async () => {
      const choice = button.dataset.themeChoice
      try {
        const result = await api('/theme', {
          method: 'POST',
          body: JSON.stringify({ theme: choice }),
        })
        if (!result.ok) throw new Error('Theme preference rejected')
        document.documentElement.dataset.theme = choice
        for (const item of themeButtons) {
          item.setAttribute('aria-pressed', String(item === button))
        }
        for (const item of document.querySelectorAll('.theme-form .theme-btn')) {
          item.setAttribute('aria-pressed', String(item.value === choice))
        }
        showFeedback(themeFeedback, `Saved: ${choice} theme. Try navigating to Users or Articles.`, 'success')
      } catch {
        showFeedback(themeFeedback, 'Could not save the selected theme.', 'error')
      }
    })
  }

  sessionButton.addEventListener('click', async () => {
    sessionButton.disabled = true
    try {
      const response = await fetch('/session', { credentials: 'same-origin' })
      if (!response.ok) throw new Error('Session request failed')
      showFeedback(sessionFeedback, await response.text(), 'success')
    } catch {
      showFeedback(sessionFeedback, 'Could not read server session.', 'error')
    } finally {
      sessionButton.disabled = false
    }
  })

  sessionResetButton.addEventListener('click', async () => {
    sessionResetButton.disabled = true
    try {
      const response = await fetch('/session', {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (!response.ok) throw new Error('Session reset failed')
      showFeedback(sessionFeedback, 'Counter reset. Passport authentication is preserved.', 'success')
    } catch {
      showFeedback(sessionFeedback, 'Could not reset the session counter.', 'error')
    } finally {
      sessionResetButton.disabled = false
    }
  })

  checkAccess(true)
})()
