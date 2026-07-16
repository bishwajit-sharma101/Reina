// ChatHeader.jsx
import React from "react";
import Avatar from "../common/Avatar";


export default function ChatHeader({ activeChat }) {
if (!activeChat) return null;


return (
<div className="h-16 border-b border-gray-800 bg-gray-900 flex items-center gap-3 px-4">
<Avatar name={activeChat.name} />
<div className="text-white font-medium">{activeChat.name}</div>
</div>
);
}