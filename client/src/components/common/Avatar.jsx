// Avatar.jsx
import React from "react";


export default function Avatar({ src, alt = "avatar", size = 40, online }) {
return (
<div className="relative" style={{ width: size, height: size }}>
<img
src={src}
alt={alt}
className="rounded-full object-cover w-full h-full ring-1 ring-white/10"
/>
{online && (
<span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 ring-2 ring-bg-900" />
)}
</div>
);
}