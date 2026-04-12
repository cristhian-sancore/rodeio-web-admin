export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ 
      backgroundColor: 'transparent', 
      background: 'transparent',
      width: '100vw', 
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      {children}
    </div>
  )
}
