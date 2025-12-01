export default function Home() {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>OA Helper API</h1>
      <p>API is running. Available endpoints:</p>
      <ul>
        <li><a href="/api/health">/api/health</a> - Health check</li>
        <li>/api/auth/signout - Sign out (POST)</li>
      </ul>
    </div>
  )
}
