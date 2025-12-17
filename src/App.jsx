import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [apiData, setApiData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Runtime configuration - lee desde window.__CONFIG__ que se genera al arrancar el contenedor
  const apiUrl = window.__CONFIG__?.VITE_API_URL || import.meta.env.VITE_API_URL || ''

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${apiUrl}/api/surcusales`)
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      const contentType = response.headers.get('content-type')
      let data
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }
      setApiData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>

      <div className="card">
        <button onClick={fetchData} disabled={loading}>
          {loading ? 'Cargando...' : 'Consultar API Quarkus'}
        </button>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {apiData && (
          <div>
            <h3>Respuesta del servidor:</h3>
            {typeof apiData === 'object' ? (
              <pre style={{ 
                textAlign: 'left', 
                background: '#1e1e1e', 
                padding: '1rem', 
                borderRadius: '8px',
                overflow: 'auto'
              }}>
                {JSON.stringify(apiData, null, 2)}
              </pre>
            ) : (
              <p>{apiData}</p>
            )}
          </div>
        )}
        <p style={{ fontSize: '0.8em', color: '#888' }}>
          API URL: {apiUrl}
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
