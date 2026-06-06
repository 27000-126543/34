import { io, Socket } from 'socket.io-client'
import type { SocketEventMap } from '../types'

class GameSocket {
  private socket: Socket | null = null
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  connect(): void {
    if (this.socket?.connected) return

    const token = localStorage.getItem('token')
    this.socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    this.socket.on('connect', () => {
      this.emit('notification', { message: '已连接到服务器', type: 'success' })
    })

    this.socket.on('disconnect', () => {
      this.emit('notification', { message: '与服务器断开连接', type: 'warning' })
    })

    this.socket.on('connect_error', () => {
      this.emit('notification', { message: '连接服务器失败', type: 'error' })
    })

    Object.keys({} as SocketEventMap).forEach((event) => {
      this.socket?.on(event, (data) => {
        this.emit(event as keyof SocketEventMap, data)
      })
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on<K extends keyof SocketEventMap>(
    event: K,
    callback: (data: SocketEventMap[K]) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  private emit<K extends keyof SocketEventMap>(event: K, data: SocketEventMap[K]): void {
    this.listeners.get(event)?.forEach((callback) => callback(data))
  }

  send(event: string, data?: unknown): void {
    this.socket?.emit(event, data)
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

export const gameSocket = new GameSocket()
export default gameSocket
