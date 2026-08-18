interface BunnyProps {
  mood?: 'idle' | 'celebrate' | 'levelup'
  size?: number
}

export function Bunny({ mood = 'idle', size = 64 }: BunnyProps) {
  return (
    <div className={`bunny-character bunny-${mood}`} style={{ fontSize: size }} aria-hidden="true">
      🐰
      {mood === 'levelup' && (
        <div className="confetti">
          {['🎉', '✨', '💜', '🎊', '⭐'].map((p, i) => (
            <span key={i} className="confetti-piece" style={{ ['--i' as string]: i }}>{p}</span>
          ))}
        </div>
      )}
    </div>
  )
}
