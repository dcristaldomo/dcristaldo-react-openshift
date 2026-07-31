import { useCallback, useEffect, useState } from 'react'
import './App.css'

const TABS = [
  { key: 'centros', label: 'Centros de Servicio' },
  { key: 'sipap', label: 'Motivos SIPAP' },
  { key: 'favoritos', label: 'Favoritos' },
]

const TITULOS = {
  centros: [
    'Centros de Servicio',
  ],
  sipap: [
    'Motivos SIPAP',
  ],
  favoritos: [
    'Favoritos',
  ],
}

const tipoDe = (tab) => (tab === 'centros' ? 'CENTRO' : 'SIPAP')

const endpointDe = (tab) =>
  tab === 'centros' ? '/api/sucursales' : '/api/sipap?dominio=motivos-sipap'

/** El backend a veces manda el string "null" en vez de un null real. */
const valor = (v) => (v === null || v === undefined || v === 'null' || v === '' ? '—' : v)

function aFila(tab, item) {
  if (tab === 'centros') {
    const nombre = item.nombre || item.titulo || 'Sin nombre'
    const ciudad = item.ciudad || '—'
    return {
      referenciaId: `CENTRO-${item.nombre || item.titulo || 'unknown'}-${item.ciudad || 'unknown'}`.replace(/\s+/g, '-'),
      descripcion: nombre,
      titulo: nombre,
      sub: [item.direccion, item.ciudad].filter(Boolean).join(' · ') || 'Sin dirección registrada',
      chip: item.tipo,
      busqueda: `${nombre} ${item.direccion || ''} ${item.ciudad || ''}`.toLowerCase(),
      detalles: [
        { k: 'Título', v: valor(item.titulo) },
        { k: 'Nombre', v: valor(item.nombre) },
        { k: 'Descripción', v: valor(item.descripcion) },
        { k: 'Dirección', v: valor(item.direccion) },
        { k: 'Ciudad', v: valor(item.ciudad) },
        { k: 'Departamento', v: valor(item.departamento) },
        { k: 'Barrio', v: valor(item.barrio) },
        { k: 'Latitud', v: item.latitud ?? '—' },
        { k: 'Longitud', v: item.longitud ?? '—' },
      ],
    }
  }

  return {
    referenciaId: `SIPAP-${item.codigoMotivo}`,
    descripcion: item.motivo,
    titulo: item.motivo,
    sub: `dominio=motivos-sipap · código ${item.codigoMotivo}`,
    chip: item.estado,
    busqueda: `${item.motivo || ''} ${item.codigoMotivo || ''}`.toLowerCase(),
    detalles: [
      { k: 'Código', v: item.codigoMotivo },
      { k: 'Dominio', v: 'motivos-sipap' },
      { k: 'Estado', v: item.estado || '—' },
      { k: 'Origen', v: 'GET /api/sipap' },
    ],
  }
}

const formatearFecha = (valor) => {
  if (!valor) return '—'
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? valor : fecha.toLocaleString()
}

function App() {
  const apiUrl = window.__CONFIG__?.VITE_API_URL || import.meta.env.VITE_API_URL || ''

  const [tab, setTab] = useState('centros')
  const [query, setQuery] = useState('')
  const [expandida, setExpandida] = useState(null)

  const [listado, setListado] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [favoritos, setFavoritos] = useState([])
  const [loadingFavoritos, setLoadingFavoritos] = useState(false)
  const [errorFavoritos, setErrorFavoritos] = useState(null)
  const [eliminandoId, setEliminandoId] = useState(null)

  const [toasts, setToasts] = useState([])

  const toast = useCallback((t) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [{ id, ...t }, ...prev].slice(0, 3))
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200)
  }, [])

  const fetchListado = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${apiUrl}${endpointDe(tab)}`)
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      const data = await response.json()
      setListado(data.ubicaciones || data)
    } catch (err) {
      setListado([])
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiUrl, tab])

  const fetchFavoritos = useCallback(async () => {
    setLoadingFavoritos(true)
    setErrorFavoritos(null)
    try {
      const response = await fetch(`${apiUrl}/api/favoritos`)
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      setFavoritos(await response.json())
    } catch (err) {
      setErrorFavoritos(err.message)
    } finally {
      setLoadingFavoritos(false)
    }
  }, [apiUrl])

  // Al cambiar de pestaña se recarga su fuente. Los favoritos se piden siempre,
  // porque además de su tabla alimentan las estrellas de los listados.
  /* eslint-disable react-hooks/set-state-in-effect --
     los fetch marcan loading de forma síncrona a propósito: el spinner debe
     aparecer en el mismo render que dispara la petición. */
  useEffect(() => {
    setExpandida(null)
    fetchFavoritos()
    if (tab !== 'favoritos') fetchListado()
  }, [tab, fetchListado, fetchFavoritos])
  /* eslint-enable react-hooks/set-state-in-effect */

  const esFavorito = (referenciaId) =>
    favoritos.some((f) => f.referenciaId === referenciaId)

  const guardarEnFavoritos = async (fila) => {
    if (esFavorito(fila.referenciaId)) {
      toast({
        codigo: '409',
        titulo: 'Ya está en Favoritos',
        texto: `${fila.descripcion} ya figura en tu lista.`,
        error: true,
      })
      return
    }

    try {
      const response = await fetch(`${apiUrl}/api/favoritos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: tipoDe(tab),
          descripcion: fila.descripcion,
          referenciaId: fila.referenciaId,
          fechaRegistro: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Este elemento ya está en favoritos')
        }
        throw new Error(`Error: ${response.status}`)
      }

      toast({ codigo: '201', titulo: 'Guardado en Favoritos', texto: fila.descripcion })
      fetchFavoritos()
    } catch (err) {
      toast({ codigo: '409', titulo: 'No se pudo guardar', texto: err.message, error: true })
    }
  }

  const eliminarFavorito = async (fav) => {
    setEliminandoId(fav.id)
    try {
      const response = await fetch(`${apiUrl}/api/favoritos/${fav.id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      setFavoritos((prev) => prev.filter((f) => f.id !== fav.id))
      toast({ codigo: '200', titulo: 'Favorito eliminado', texto: fav.descripcion })
    } catch (err) {
      toast({ codigo: '409', titulo: 'No se pudo eliminar', texto: err.message, error: true })
    } finally {
      setEliminandoId(null)
    }
  }

  const filas = (Array.isArray(listado) ? listado : [])
    .map((item) => aFila(tab, item))
    .filter((f) => !query.trim() || f.busqueda.includes(query.trim().toLowerCase()))

  const [tituloVista, subtituloVista] = TITULOS[tab]
  const cargando = tab === 'favoritos' ? loadingFavoritos : loading
  const errorVista = tab === 'favoritos' ? errorFavoritos : error
  const hayError = Boolean(errorVista) && !cargando
  const mostrarBuscador = tab === 'centros' && !hayError

  const conteos = {
    centros: tab === 'centros' ? filas.length : null,
    sipap: tab === 'sipap' ? filas.length : null,
    favoritos: favoritos.length,
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-right">
          <span className="env-chip mono">
            <span className={`env-dot${hayError ? ' is-down' : ''}`} />
            <span>VITE_API_URL = {apiUrl || '(no definida)'}</span>
          </span>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tab${tab === t.key ? ' is-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {conteos[t.key] !== null && <span className="tab-count">{conteos[t.key]}</span>}
          </button>
        ))}
      </nav>

      <main className="app-main">
        <div className="view-head">
          <div>
            <h3>{tituloVista}</h3>
            <p className="text-muted">{subtituloVista}</p>
          </div>
          {mostrarBuscador && (
            <label className="search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M16.5 16.5L21 21" />
              </svg>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setExpandida(null)
                }}
                placeholder="Buscar por nombre o dirección…"
              />
            </label>
          )}
        </div>

        {hayError && (
          <div className="card error-card">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3.5L21.5 20H2.5z" />
              <path d="M12 9.5v5" />
              <path d="M12 17.2h.01" />
            </svg>
            <h4>No pudimos cargar la información</h4>
            <p className="text-muted">Ocurrió un problema al conectar con el servidor. Probá nuevamente.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => (tab === 'favoritos' ? fetchFavoritos() : fetchListado())}
            >
              Reintentar
            </button>
          </div>
        )}

        {!hayError && tab !== 'favoritos' && (
          <div className="panel">
            {cargando && <div className="panel-empty">Cargando {tituloVista.toLowerCase()}…</div>}

            {!cargando &&
              filas.map((f) => {
                const desplegable = tab !== 'sipap'
                const abierta = desplegable && expandida === f.referenciaId
                const fav = esFavorito(f.referenciaId)
                return (
                  <div className="row" key={f.referenciaId}>
                    <div className="row-main">
                      <button
                        type="button"
                        className={`star${fav ? ' is-fav' : ''}`}
                        title={fav ? 'Ya está en Favoritos' : 'Guardar en Favoritos'}
                        onClick={() => guardarEnFavoritos(f)}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill={fav ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinejoin="round"
                        >
                          <path d="M12 2.9l2.9 6.1 6.6.9-4.8 4.7 1.2 6.6L12 18l-5.9 3.2 1.2-6.6-4.8-4.7 6.6-.9z" />
                        </svg>
                      </button>
                      <div className="row-text">
                        <span className="row-title">{f.titulo}</span>
                        {desplegable && <span className="row-sub">{f.sub}</span>}
                      </div>
                      {desplegable && f.chip && <span className="tag tag-neutral">{f.chip}</span>}
                      {desplegable && (
                        <button
                          type="button"
                          className={`icon-btn${abierta ? ' is-open' : ''}`}
                          aria-expanded={abierta}
                          aria-label={abierta ? 'Ocultar detalle' : 'Ver detalle'}
                          onClick={() => setExpandida(abierta ? null : f.referenciaId)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9.5l6 6 6-6" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {abierta && (
                      <div className="row-details">
                        {f.detalles.map((d) => (
                          <div className="detail" key={d.k}>
                            <span className="detail-k">{d.k}</span>
                            <span className="detail-v">{d.v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

            {!cargando && filas.length === 0 && (
              <div className="panel-empty">
                {query.trim()
                  ? `Ningún resultado para “${query}”.`
                  : 'El backend no devolvió registros.'}
              </div>
            )}
          </div>
        )}

        {!hayError && tab === 'favoritos' && (
          <>
            <div className="panel">
              <table className="table fav-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>referenciaId</th>
                    <th>Descripción</th>
                    <th>Fecha de registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {favoritos.map((fav, index) => (
                    <tr key={fav.id ?? `${fav.referenciaId}-${index}`}>
                      <td>
                        <span className="tag tag-accent">{fav.tipo}</span>
                      </td>
                      <td className="cell-ref">{fav.referenciaId || '—'}</td>
                      <td>{fav.descripcion}</td>
                      <td className="cell-date">
                        {formatearFecha(fav.fechaRegistro || fav.fechaCreacion)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="icon-btn icon-btn-danger"
                          title="Eliminar favorito"
                          aria-label="Eliminar favorito"
                          disabled={eliminandoId === fav.id}
                          onClick={() => eliminarFavorito(fav)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 7h16" />
                            <path d="M9 7V4.8c0-.44.36-.8.8-.8h4.4c.44 0 .8.36.8.8V7" />
                            <path d="M6.5 7l.7 12.2c.04.98.86 1.8 1.85 1.8h6.9c.99 0 1.81-.82 1.85-1.8L19.5 7" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loadingFavoritos && <div className="panel-empty">Cargando favoritos…</div>}
              {!loadingFavoritos && favoritos.length === 0 && (
                <div className="panel-empty">
                  Todavía no guardaste favoritos. Marcá la estrella en Centros de Servicio o Motivos
                  SIPAP.
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <div className="toasts">
        {toasts.map((t) => (
          <div className={`toast${t.error ? ' is-error' : ''}`} key={t.id}>
            <div className="toast-head">
              <span className="toast-code">{t.codigo}</span>
              <span className="toast-title">{t.titulo}</span>
            </div>
            <span className="toast-text">{t.texto}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
