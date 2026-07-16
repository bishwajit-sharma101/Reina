// Loader.jsx
import React from "react";


export default function Loader({ size = 22 }) {
return (
<div
className="animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
style={{ width: size, height: size }}
/>
);
}