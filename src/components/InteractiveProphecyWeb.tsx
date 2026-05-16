'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import NodeHoverPreview from './NodeHoverPreview'
import NodeContextPanel from './NodeContextPanel'
import ConnectionTooltip from './ConnectionTooltip'
import ExplorationControls from './ExplorationControls'

interface ProphecyWebProps {
  theme?: 'daniel' | 'sanctuary' | 'messiah' | 'all'
}

export default function InteractiveProphecyWeb({ theme = 'all' }: ProphecyWebProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  const nodesRef = useRef<Map<THREE.Mesh, any>>(new Map())
  const connectionsRef = useRef<Map<THREE.Line, any>>(new Map())
  
  const [webData, setWebData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [webglError, setWebglError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<any | null>(null)
  const [hoveredNode, setHoveredNode] = useState<any | null>(null)
  const [hoveredConnection, setHoveredConnection] = useState<any | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [contextPanelVisible, setContextPanelVisible] = useState(false)
  const [focusModeActive, setFocusModeActive] = useState(false)
  const [filters, setFilters] = useState({
    strongestOnly: false,
    directQuotation: true,
    propheticFulfillment: true,
    typology: true,
    thematicEcho: true,
    covenantDevelopment: true,
    narrativeContinuation: true,
    showLabels: true,
    testament: 'all' as 'all' | 'OT' | 'NT',
    theme: 'all',
  })

  useEffect(() => {
    loadProphecyWeb()
  }, [theme])

  useEffect(() => {
    if (!containerRef.current || !webData) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 20, 30)
    cameraRef.current = camera

    let renderer: THREE.WebGLRenderer | null = null
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      containerRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer
      setWebglError(null)
    } catch (error) {
      console.warn('InteractiveProphecyWeb WebGL init failed', error)
      setWebglError('This visual map cannot start in the current browser. The sermon study tools still work.')
      setLoading(false)
      return
    }

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controlsRef.current = controls

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(10, 10, 10)
    scene.add(pointLight)

    // Create nodes with importance scaling
    webData.nodes.forEach((node: any) => {
      const baseSize = node.size || 0.5
      const importanceMultiplier = node.importance === 'high' ? 1.5 : node.importance === 'medium' ? 1.0 : 0.7
      const size = baseSize * importanceMultiplier
      
      const geometry = new THREE.SphereGeometry(size, 32, 32)
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(node.color),
        emissive: new THREE.Color(node.color),
        emissiveIntensity: node.type === 'prophecy' ? 0.5 : 0.3,
        metalness: 0.3,
        roughness: 0.7
      })
      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.set(node.position.x, node.position.y, node.position.z)
      scene.add(sphere)

      // Store node data
      nodesRef.current.set(sphere, {
        reference: node.reference,
        title: node.title || node.label,
        theme: node.theme,
        themes: node.themes || (node.theme ? [node.theme] : []),
        testament: node.testament || 'UNKNOWN',
        snippet: node.snippet,
        connectionType: node.connectionType,
        connectionStrength: node.connectionStrength,
        explanation: node.explanation,
        verseText: node.verseText || node.snippet,
        relatedThemes: node.relatedThemes || [],
        relatedNodes: node.relatedNodes || [],
        preachingInsight: node.preachingInsight,
        importance: node.importance,
        type: node.type
      })

      // Add label if enabled
      if (filters.showLabels) {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        canvas.width = 256
        canvas.height = 64
        context.fillStyle = '#ffffff'
        context.font = 'bold 16px Arial'
        context.textAlign = 'center'
        context.fillText(node.reference, 128, 32)

        const texture = new THREE.CanvasTexture(canvas)
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
        const sprite = new THREE.Sprite(spriteMaterial)
        sprite.position.set(node.position.x, node.position.y + size + 1.5, node.position.z)
        sprite.scale.set(5, 1.2, 1)
        scene.add(sprite)
      }
    })

    // Create connections with different styles
    webData.connections.forEach((conn: any) => {
      const sourceNode = webData.nodes.find((n: any) => n.id === conn.source)
      const targetNode = webData.nodes.find((n: any) => n.id === conn.target)

      if (sourceNode && targetNode) {
        const points = [
          new THREE.Vector3(sourceNode.position.x, sourceNode.position.y, sourceNode.position.z),
          new THREE.Vector3(targetNode.position.x, targetNode.position.y, targetNode.position.z)
        ]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        
        let material: THREE.LineBasicMaterial | THREE.LineDashedMaterial
        
        if (conn.type === 'prophetic_fulfillment') {
          material = new THREE.LineBasicMaterial({
            color: 0xffaa00,
            opacity: 0.9,
            transparent: true,
            linewidth: 2
          })
        } else if (conn.type === 'typology') {
          material = new THREE.LineBasicMaterial({
            color: 0xaa00ff,
            opacity: 0.7,
            transparent: true,
            linewidth: 1.5
          })
        } else if (conn.type === 'thematic_echo') {
          material = new THREE.LineDashedMaterial({
            color: 0x0088ff,
            opacity: 0.6,
            transparent: true,
            dashSize: 0.3,
            gapSize: 0.1
          })
        } else {
          material = new THREE.LineBasicMaterial({
            color: conn.color || 0x00ffff,
            opacity: conn.strength || 0.5,
            transparent: true
          })
        }
        
        const line = new THREE.Line(geometry, material)
        if (material instanceof THREE.LineDashedMaterial) {
          line.computeLineDistances()
        }
        scene.add(line)

        connectionsRef.current.set(line, {
          type: conn.type || 'prophetic_fulfillment',
          strength: conn.strength === 'high' || conn.strength > 0.7 ? 'high' : conn.strength === 'low' || conn.strength < 0.4 ? 'low' : 'medium',
          explanation: conn.explanation,
          fromReference: sourceNode.reference,
          toReference: targetNode.reference,
          category: conn.category || 'prophecy'
        })
      }
    })

    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      setMousePosition({ x: event.clientX, y: event.clientY })
      checkHover()
    }

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
      const intersects = raycasterRef.current.intersectObjects(Array.from(nodesRef.current.keys()))
      
      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh
        const nodeData = nodesRef.current.get(mesh)
        if (nodeData) {
          handleNodeClick(nodeData)
        }
      }
    }

    renderer.domElement.addEventListener('mousemove', handleMouseMove)
    renderer.domElement.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (renderer) {
        renderer.domElement.removeEventListener('mousemove', handleMouseMove)
        renderer.domElement.removeEventListener('click', handleClick)
        renderer.dispose()
        containerRef.current?.removeChild(renderer.domElement)
      }
    }
  }, [webData, filters.showLabels])

  useEffect(() => {
    applyFilters()
  }, [filters])

  const checkHover = () => {
    if (!cameraRef.current) return
    
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
    
    const nodeIntersects = raycasterRef.current.intersectObjects(Array.from(nodesRef.current.keys()))
    if (nodeIntersects.length > 0) {
      const mesh = nodeIntersects[0].object as THREE.Mesh
      const nodeData = nodesRef.current.get(mesh)
      if (nodeData) {
        setHoveredNode(nodeData)
        highlightNode(mesh, true)
        return
      }
    } else {
      setHoveredNode(null)
      clearHighlights()
    }

    const connectionIntersects = raycasterRef.current.intersectObjects(Array.from(connectionsRef.current.keys()))
    if (connectionIntersects.length > 0) {
      const line = connectionIntersects[0].object as THREE.Line
      const connectionData = connectionsRef.current.get(line)
      if (connectionData) {
        setHoveredConnection(connectionData)
        return
      }
    } else {
      setHoveredConnection(null)
    }
  }

  const highlightNode = (mesh: THREE.Mesh, highlight: boolean) => {
    const material = mesh.material as THREE.MeshStandardMaterial
    if (highlight) {
      material.emissiveIntensity = 0.8
      nodesRef.current.forEach((data, otherMesh) => {
        if (otherMesh !== mesh) {
          const otherMaterial = otherMesh.material as THREE.MeshStandardMaterial
          otherMaterial.opacity = 0.3
          otherMaterial.transparent = true
        }
      })
    }
  }

  const clearHighlights = () => {
    nodesRef.current.forEach((data, mesh) => {
      const material = mesh.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = data.type === 'prophecy' ? 0.5 : 0.3
      material.opacity = 1
      material.transparent = false
    })
  }

  const handleNodeClick = (nodeData: any) => {
    setSelectedNode(nodeData)
    setContextPanelVisible(true)
    
    if (focusModeActive) {
      focusOnNode(nodeData)
    }
  }

  const focusOnNode = (nodeData: any) => {
    if (!cameraRef.current || !controlsRef.current) return
    
    const targetMesh = Array.from(nodesRef.current.entries()).find(
      ([, data]) => data.reference === nodeData.reference
    )?.[0]
    if (!targetMesh) return

    const targetPosition = targetMesh.position.clone()
    targetPosition.z += 10
    
    const startPosition = cameraRef.current.position.clone()
    const duration = 1000
    const startTime = Date.now()
    
    const animateCamera = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      
      cameraRef.current!.position.lerpVectors(startPosition, targetPosition, eased)
      controlsRef.current!.target.copy(targetMesh.position)
      controlsRef.current!.update()
      
      if (progress < 1) {
        requestAnimationFrame(animateCamera)
      }
    }
    animateCamera()
  }

  const applyFilters = () => {
    connectionsRef.current.forEach((data, line) => {
      let visible = true
      const relationType = String(data.connectionType || data.category || '').toLowerCase()
      
      if (filters.strongestOnly && data.strength !== 'high') {
        visible = false
      }
      
      if (!filters.directQuotation && relationType.includes('direct')) {
        visible = false
      }
      
      if (!filters.propheticFulfillment && relationType.includes('prophetic')) {
        visible = false
      }
      
      if (!filters.typology && relationType.includes('typolog')) {
        visible = false
      }

      if (!filters.thematicEcho && relationType.includes('thematic')) {
        visible = false
      }

      if (!filters.covenantDevelopment && relationType.includes('covenant')) {
        visible = false
      }

      if (!filters.narrativeContinuation && relationType.includes('narrative')) {
        visible = false
      }
      
      line.visible = visible
    })

    nodesRef.current.forEach((data, mesh) => {
      const material = mesh.material as THREE.MeshStandardMaterial
      const testamentOk = filters.testament === 'all' || data.testament === filters.testament
      const themeList = Array.isArray(data.themes) ? data.themes.map((theme: string) => String(theme).toLowerCase()) : []
      const themeOk = filters.theme === 'all' || themeList.some((theme: string) => theme.includes(filters.theme))
      material.opacity = testamentOk && themeOk ? 1 : 0.12
      material.transparent = !testamentOk || !themeOk
    })
  }

  const loadProphecyWeb = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = theme
        ? `${process.env.NEXT_PUBLIC_API_URL}/visualization/prophecy-web?theme=${theme}`
        : `${process.env.NEXT_PUBLIC_API_URL}/visualization/prophecy-web`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setWebData(data)
      setLoading(false)
    } catch (error) {
      console.warn('Error loading prophecy web:', error)
      setLoading(false)
    }
  }

  const handleAddToSermon = (reference: string) => {
    console.log('Adding to sermon:', reference)
  }

  const handleOpenPassage = (reference: string) => {
    console.log('Opening passage:', reference)
  }

  const handleExploreConnections = (reference: string) => {
    console.log('Exploring connections for:', reference)
  }

  const handleResetView = () => {
    if (!cameraRef.current || !controlsRef.current) return
    cameraRef.current.position.set(0, 20, 30)
    controlsRef.current.target.set(0, 0, 0)
    controlsRef.current.update()
    setFocusModeActive(false)
  }

  const handleFocusMode = () => {
    setFocusModeActive(!focusModeActive)
  }

  return (
    <div className="relative w-full h-[600px]">
      <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />
      
      {webglError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-black/80 p-6">
          <div className="max-w-md rounded-2xl border border-white/10 bg-black/60 p-4 text-center">
            <p className="text-sm font-semibold text-cyan-200">Visual exploration unavailable</p>
            <p className="mt-2 text-xs text-gray-300">{webglError}</p>
          </div>
        </div>
      )}
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
          <div className="text-cyan-300 animate-pulse">Weaving Prophecy Connections...</div>
        </div>
      )}

      <NodeHoverPreview
        nodeData={hoveredNode}
        position={mousePosition}
        visible={!!hoveredNode && !contextPanelVisible}
      />

      <ConnectionTooltip
        connectionData={hoveredConnection}
        position={mousePosition}
        visible={!!hoveredConnection && !contextPanelVisible}
      />

      <NodeContextPanel
        nodeData={selectedNode}
        visible={contextPanelVisible}
        onClose={() => setContextPanelVisible(false)}
        onAddToSermon={handleAddToSermon}
        onOpenPassage={handleOpenPassage}
        onExploreConnections={handleExploreConnections}
      />

      <ExplorationControls
        filters={filters}
        onFilterChange={setFilters}
        onResetView={handleResetView}
        onFocusMode={handleFocusMode}
        focusModeActive={focusModeActive}
      />
    </div>
  )
}
