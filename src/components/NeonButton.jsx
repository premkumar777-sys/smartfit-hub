import React from "react";

export default function NeonButton({ children, color = "#00FF9C", href = "#" }) {
  return (
    <a
      href={href}
      className="sf-button relative inline-block px-6 py-3 text-lg font-semibold uppercase tracking-wider border border-black/40 rounded-md transition-all duration-500"
      style={{ "--color": color }}
    >
      <span className="sf-expand-bg absolute inset-0 -z-10 rounded-md" style={{ background: color }}></span>

      <span className="sf-bar absolute top-0 left-3 h-1 w-10 rounded-sm sf-glow-bars" style={{ background: color }}></span>
      <span className="sf-bar absolute top-3 right-0 h-10 w-1 rounded-sm sf-glow-bars" style={{ background: color }}></span>
      <span className="sf-bar absolute bottom-0 right-3 h-1 w-10 rounded-sm sf-glow-bars" style={{ background: color }}></span>
      <span className="sf-bar absolute bottom-3 left-0 h-10 w-1 rounded-sm sf-glow-bars" style={{ background: color }}></span>

      <span className="relative sf-neon-glow" style={{ color }}>
        {children}
      </span>
    </a>
  );
}
