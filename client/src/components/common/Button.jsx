// Button.jsx
import React from "react";


export default function Button({ children, onClick, className = "", variant = "primary" }) {
const styles = {
primary: "bg-brand-500 text-black hover:bg-brand-400",
secondary: "bg-bg-700 text-text-200 hover:bg-bg-600",
outline: "border border-bg-600 text-text-200 hover:bg-bg-700"
};


return (
<button
onClick={onClick}
className={`px-4 py-2 rounded-lg text-sm transition ${styles[variant]} ${className}`}
>
{children}
</button>
);
}