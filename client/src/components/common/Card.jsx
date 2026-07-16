import React from "react";


export default function Card({ children, className = "" }) {
return (
<div className={`bg-bg-800/60 rounded-xl p-4 shadow-sm border border-bg-700/40 ${className}`}>
{children}
</div>
);
}