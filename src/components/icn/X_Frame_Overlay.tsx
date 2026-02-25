interface X_Frame_OverlayProps {
    opacity?: number;
}

export function X_Frame_Overlay({ opacity = 0.5 }: X_Frame_OverlayProps) {
    return (
        <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-300"
            style={{ opacity }}
        >
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Main X-Frame Guides */}
                <line x1="20" y1="20" x2="80" y2="80" stroke="#d4af37" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="80" y1="20" x2="20" y2="80" stroke="#d4af37" strokeWidth="0.5" strokeDasharray="2,2" />

                {/* Shoulder Line */}
                <line x1="15" y1="25" x2="85" y2="25" stroke="#3b82f6" strokeWidth="0.5" opacity="0.8" />

                {/* Hip Line */}
                <line x1="25" y1="55" x2="75" y2="55" stroke="#3b82f6" strokeWidth="0.5" opacity="0.8" />

                {/* Verticle Balance Axis */}
                <line x1="50" y1="5" x2="50" y2="95" stroke="#d4af37" strokeWidth="0.3" strokeDasharray="4,4" />

                {/* Focal Points for Posing */}
                <circle cx="50" cy="25" r="1" fill="#d4af37" />
                <circle cx="20" cy="25" r="1" fill="#3b82f6" />
                <circle cx="80" cy="25" r="1" fill="#3b82f6" />
            </svg>

            {/* HUD Labels */}
            <div className="absolute top-4 left-4 text-[8px] font-mono text-gold/60 uppercase tracking-tighter">
                Symmetry-Grid v1.0 // Elite Guard
            </div>
            <div className="absolute bottom-4 right-4 text-[8px] font-mono text-blue-400/60 uppercase tracking-tighter">
                X-Frame Reference // iCompete Natural
            </div>
        </div>
    );
}
