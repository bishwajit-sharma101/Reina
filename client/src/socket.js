// src/socket.js
import { io } from "socket.io-client";
import Cookies from "js-cookie";

let socket = null;

export function getSocket() {
  const token = Cookies.get("token");
  if (!token) {
    console.log("no token");
    return null
  };

  if (!socket) {
    socket = io("http://localhost:5000", {
      withCredentials: true,
      autoConnect: true,
    });
    console.log("sokket is running");
    
  }

  return socket;
}
