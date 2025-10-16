"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { API_BASE } from "@/lib/api"

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const instance = io(API_BASE, {
      transports: ["websocket"],
      withCredentials: true,
    })

    setSocket(instance)

    return () => {
      instance.disconnect()
    }
  }, [])

  return socket
}
