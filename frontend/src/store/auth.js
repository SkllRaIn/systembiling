import { create } from 'zustand'
import api from '../lib/api.js'

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  init: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return set({ loading: false })
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    set({ user: data.user })
    return data.user
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try { await api.post('/auth/logout', { refreshToken }) } catch {}
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null })
  },

  register: async (email, password, name, phone) => {
    const { data } = await api.post('/auth/register', { email, password, name, phone })
    return data.user
  },
}))
