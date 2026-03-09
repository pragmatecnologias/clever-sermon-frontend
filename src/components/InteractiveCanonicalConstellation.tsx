'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import NodeHoverPreview from './NodeHoverPreview'
import NodeContextPanel from './NodeContextPanel'
import ConnectionTooltip from './ConnectionTooltip'
import ConnectionDetailPanel from './ConnectionDetailPanel'
import ExplorationControls from './ExplorationControls'

interface CanonicalConstellationProps {
  focusPassage?: string
  onNodeClick?: (reference: string) => void
}

export default function InteractiveCanonicalConstellation({ focusPassage, onNodeClick }: CanonicalConstellationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  const nodesRef = useRef<Map<THREE.Mesh, any>>(new Map())
  const connectionsRef = useRef<Map<THREE.Line, any>>(new Map())
  const highlightedNodesRef = useRef<Set<THREE.Mesh>>(new Set())
  const animatedConnectionsRef = useRef<Array<{ line: THREE.Line, material: THREE.Material, offset: number }>>([])
  const arrowsRef = useRef<THREE.Mesh[]>([])
  const expandedNodesRef = useRef<Set<string>>(new Set())
  
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<any | null>(null)
  const [hoveredNode, setHoveredNode] = useState<any | null>(null)
  const [hoveredConnection, setHoveredConnection] = useState<any | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<any | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [contextPanelVisible, setContextPanelVisible] = useState(false)
  const [connectionDetailVisible, setConnectionDetailVisible] = useState(false)
  const [focusModeActive, setFocusModeActive] = useState(false)
  const [activeTheme, setActiveTheme] = useState<string | null>(null)
  const [suggestedPath, setSuggestedPath] = useState<string[] | null>(null)
  const [filters, setFilters] = useState({
    strongestOnly: false,
    directQuotation: true,
    propheticFulfillment: true,
    typology: true,
    thematicEcho: true,
    covenantDevelopment: true,
    narrativeContinuation: true,
    showLabels: true,
  })

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 15, 30)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controlsRef.current = controls

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(10, 10, 10)
    scene.add(pointLight)

    // Load constellation data
    loadConstellationData(scene, focusPassage)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      
      // Animate connection lines
      const time = Date.now() * 0.001
      animatedConnectionsRef.current.forEach(({ line, material, offset }) => {
        if (material instanceof THREE.LineDashedMaterial) {
          material.dashSize = 0.5 + Math.sin(time * 2 + offset) * 0.2
        } else if (material instanceof THREE.LineBasicMaterial) {
          // Pulsing glow effect
          const baseOpacity = 0.6
          material.opacity = baseOpacity + Math.sin(time * 3 + offset) * 0.2
        }
      })
      
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // Mouse move for hover detection
    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      setMousePosition({ x: event.clientX, y: event.clientY })
      
      checkHover()
    }

    // Click handler
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
      
      // Check connections first (higher priority)
      const connectionIntersects = raycasterRef.current.intersectObjects(Array.from(connectionsRef.current.keys()))
      if (connectionIntersects.length > 0) {
        const line = connectionIntersects[0].object as THREE.Line
        const connectionData = connectionsRef.current.get(line)
        if (connectionData) {
          handleConnectionClick(connectionData)
          return
        }
      }
      
      // Then check nodes
      const nodeIntersects = raycasterRef.current.intersectObjects(Array.from(nodesRef.current.keys()))
      if (nodeIntersects.length > 0) {
        const mesh = nodeIntersects[0].object as THREE.Mesh
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
      renderer.domElement.removeEventListener('mousemove', handleMouseMove)
      renderer.domElement.removeEventListener('click', handleClick)
      renderer.dispose()
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [focusPassage])

  // Apply filters effect
  useEffect(() => {
    applyFilters()
  }, [filters, activeTheme, suggestedPath])

  const checkHover = () => {
    if (!cameraRef.current || !sceneRef.current) return
    
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
    
    // Check nodes
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

    // Check connections
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
      highlightedNodesRef.current.add(mesh)
      
      // Dim other nodes
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
    highlightedNodesRef.current.forEach(mesh => {
      const material = mesh.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0
    })
    highlightedNodesRef.current.clear()
    
    // Restore opacity
    nodesRef.current.forEach((data, mesh) => {
      const material = mesh.material as THREE.MeshStandardMaterial
      material.opacity = 1
      material.transparent = false
    })
  }

  const handleNodeClick = async (nodeData: any) => {
    setSelectedNode(nodeData)
    setContextPanelVisible(true)
    setConnectionDetailVisible(false)
    onNodeClick?.(nodeData.reference)

    // Node expansion: mark node as expanded for future connection loading
    const nodeRef = nodeData.reference || nodeData.label
    if (!expandedNodesRef.current.has(nodeRef)) {
      expandedNodesRef.current.add(nodeRef)
      console.log(`Node expanded: ${nodeRef} - additional connections would be loaded here`)
    }

    // Focus camera on node
    if (cameraRef.current && controlsRef.current) {
      const targetPos = new THREE.Vector3(
        nodeData.x || nodeData.position?.x || 0,
        nodeData.y || nodeData.position?.y || 0,
        nodeData.z || nodeData.position?.z || 0
      )
      
      const distance = 15
      const cameraPos = new THREE.Vector3(
        targetPos.x,
        targetPos.y,
        targetPos.z + distance
      )
      
      // Animate camera
      const startPos = cameraRef.current.position.clone()
      const startTime = Date.now()
      const duration = 1000
      
      const animateCamera = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        
        if (cameraRef.current) {
          cameraRef.current.position.lerpVectors(startPos, cameraPos, eased)
          controlsRef.current?.target.lerp(targetPos, eased)
          controlsRef.current?.update()
        }
        
        if (progress < 1) {
          requestAnimationFrame(animateCamera)
        }
      }
      
      animateCamera()
    }
  }

  const handleConnectionClick = (connectionData: any) => {
    setSelectedConnection(connectionData)
    setConnectionDetailVisible(true)
    setContextPanelVisible(false)
  }

  const applyFilters = () => {
    if (!sceneRef.current) return

    connectionsRef.current.forEach((data, line) => {
      const material = line.material as THREE.LineBasicMaterial | THREE.LineDashedMaterial
      
      // Check if this connection type is enabled
      const typeEnabled = filters[`${data.type}` as keyof typeof filters]
      
      // Check if we're filtering for strongest only
      const strengthOk = !filters.strongestOnly || data.strength === 'strong'
      
      // Theme-based dimming: fade connections not matching active theme
      if (activeTheme && data.type !== activeTheme) {
        material.opacity = 0.1 // Dim unrelated connections
      } else {
        // Restore original opacity based on strength
        const strengthValue = data.strength === 'strong' ? 0.9 : data.strength === 'moderate' ? 0.6 : 0.4
        material.opacity = strengthValue
      }
      
      // Highlight suggested path
      if (suggestedPath && suggestedPath.includes(data.fromReference) && suggestedPath.includes(data.toReference)) {
        material.opacity = 1.0
        line.renderOrder = 999 // Render on top
      }
      
      // Show/hide based on filters
      line.visible = typeEnabled && strengthOk
    })
    
    // Dim nodes not in active theme or suggested path
    nodesRef.current.forEach((data, mesh) => {
      const material = mesh.material as THREE.MeshStandardMaterial
      if (activeTheme || suggestedPath) {
        const isInPath = suggestedPath?.includes(data.reference || data.label)
        material.opacity = isInPath ? 1.0 : 0.3
        material.transparent = true
      } else {
        material.opacity = 1.0
        material.transparent = false
      }
    })
    
    // Dim/show arrows based on connection visibility
    arrowsRef.current.forEach(arrow => {
      const arrowMaterial = arrow.material as THREE.MeshBasicMaterial
      if (activeTheme) {
        arrowMaterial.opacity = 0.1
      }
    })
  }

  const loadConstellationData = async (scene: THREE.Scene, passage?: string) => {
    try {
      const token = localStorage.getItem('token')
      const url = passage
        ? `${process.env.NEXT_PUBLIC_API_URL}/visualization/canonical-constellation?focusPassage=${encodeURIComponent(passage)}`
        : `${process.env.NEXT_PUBLIC_API_URL}/visualization/canonical-constellation`

      console.log('Loading constellation data from:', url)

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        console.error('Failed to fetch constellation data:', response.status, response.statusText)
        setLoading(false)
        return
      }
      
      const data = await response.json()
      console.log('Constellation data loaded:', data)

      if (!data.nodes || data.nodes.length === 0) {
        console.warn('No nodes in constellation data')
        setLoading(false)
        return
      }

      // Build relatedNodes map from connections
      const nodeConnectionsMap = new Map<string, Array<{reference: string, connectionType: string}>>()
      data.connections?.forEach((conn: any) => {
        const sourceRef = conn.source || conn.from
        const targetRef = conn.target || conn.to
        const connType = conn.type || 'canonical'
        
        // Add bidirectional connections
        if (!nodeConnectionsMap.has(sourceRef)) {
          nodeConnectionsMap.set(sourceRef, [])
        }
        if (!nodeConnectionsMap.has(targetRef)) {
          nodeConnectionsMap.set(targetRef, [])
        }
        
        nodeConnectionsMap.get(sourceRef)?.push({ reference: targetRef, connectionType: connType })
        nodeConnectionsMap.get(targetRef)?.push({ reference: sourceRef, connectionType: connType })
      })

      // Create nodes with importance-based sizing
      data.nodes.forEach((node: any) => {
        const baseSize = node.size || 0.5
        const importanceMultiplier = node.importance === 'high' ? 1.5 : node.importance === 'medium' ? 1.0 : 0.7
        const size = baseSize * importanceMultiplier
        
        const geometry = new THREE.SphereGeometry(size, 32, 32)
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(node.color || 0x00ffff),
          emissive: new THREE.Color(node.color || 0x00ffff),
          emissiveIntensity: node.isSelected ? 0.5 : 0.3,
          metalness: 0.3,
          roughness: 0.7
        })
        const sphere = new THREE.Mesh(geometry, material)
        
        // Handle both formats: {x, y, z} or {position: {x, y, z}}
        const x = node.x ?? node.position?.x ?? 0
        const y = node.y ?? node.position?.y ?? 0
        const z = node.z ?? node.position?.z ?? 0
        sphere.position.set(x, y, z)
        scene.add(sphere)
        
        // Get related nodes from connections map
        const nodeRef = node.id || node.reference
        const relatedNodes = nodeConnectionsMap.get(nodeRef) || node.relatedNodes || []
        
        // Store node data
        nodesRef.current.set(sphere, {
          reference: node.reference,
          title: node.title || node.label,
          theme: node.theme,
          snippet: node.snippet,
          connectionType: node.connectionType,
          connectionStrength: node.connectionStrength,
          explanation: node.explanation,
          verseText: node.verseText || node.snippet || '',
          relatedThemes: node.relatedThemes || [],
          relatedNodes: relatedNodes,
          preachingInsight: node.preachingInsight || (node.type === 'book' ? `The book of ${node.label || node.reference} is part of the biblical canon. Click "Open Full Passage" to explore its contents.` : ''),
          importance: node.importance,
          x, y, z
        })
      })

      // Create connections with different styles
      data.connections?.forEach((conn: any) => {
        const fromNode = data.nodes.find((n: any) => n.reference === conn.from || n.reference === conn.source || n.id === conn.source)
        const toNode = data.nodes.find((n: any) => n.reference === conn.to || n.reference === conn.target || n.id === conn.target)
        
        if (fromNode && toNode) {
          const fromX = fromNode.x ?? fromNode.position?.x ?? 0
          const fromY = fromNode.y ?? fromNode.position?.y ?? 0
          const fromZ = fromNode.z ?? fromNode.position?.z ?? 0
          const toX = toNode.x ?? toNode.position?.x ?? 0
          const toY = toNode.y ?? toNode.position?.y ?? 0
          const toZ = toNode.z ?? toNode.position?.z ?? 0
          
          const points = [
            new THREE.Vector3(fromX, fromY, fromZ),
            new THREE.Vector3(toX, toY, toZ)
          ]
          
          const geometry = new THREE.BufferGeometry().setFromPoints(points)
          
          // Different line styles based on connection type with enhanced visual styling
          const connType = conn.type || 'thematic_echo'
          const strengthValue = conn.strengthValue || 0.6
          const visualStyle = conn.visualStyle || { lineType: 'solid', animated: false, glow: false }
          
          let material: THREE.LineBasicMaterial | THREE.LineDashedMaterial
          const baseOpacity = 0.4 + (strengthValue * 0.5) // Opacity based on strength
          
          // Color mapping from backend
          const colorMap: Record<string, number> = {
            direct_quotation: 0x22d3ee,      // Cyan
            prophetic_fulfillment: 0xef4444, // Red
            typology: 0x8b5cf6,              // Purple
            thematic_echo: 0x10b981,         // Green
            covenant_development: 0xfbbf24,  // Gold
            narrative_continuation: 0x6b7280 // Gray
          }
          
          const color = colorMap[connType] || 0x00ffff
          
          // Line thickness based on strength
          const lineWidth = strengthValue * 3 // 0.3 to 3.0
          
          if (visualStyle.lineType === 'dashed') {
            material = new THREE.LineDashedMaterial({ 
              color,
              linewidth: lineWidth,
              dashSize: 0.5,
              gapSize: 0.2,
              opacity: baseOpacity,
              transparent: true
            })
          } else if (visualStyle.lineType === 'dotted') {
            material = new THREE.LineDashedMaterial({ 
              color,
              linewidth: lineWidth,
              dashSize: 0.1,
              gapSize: 0.2,
              opacity: baseOpacity,
              transparent: true
            })
          } else {
            material = new THREE.LineBasicMaterial({ 
              color,
              linewidth: lineWidth,
              opacity: visualStyle.glow ? baseOpacity + 0.2 : baseOpacity,
              transparent: true
            })
          }
          
          const line = new THREE.Line(geometry, material)
          if (material instanceof THREE.LineDashedMaterial) {
            line.computeLineDistances()
          }
          scene.add(line)
          
          // Add directional arrow if connection has direction
          if (conn.direction === 'forward' || conn.direction === 'backward') {
            const arrowDir = new THREE.Vector3(
              toX - fromX,
              toY - fromY,
              toZ - fromZ
            ).normalize()
            
            // Position arrow at midpoint
            const midX = (fromX + toX) / 2
            const midY = (fromY + toY) / 2
            const midZ = (fromZ + toZ) / 2
            
            // Create arrow geometry
            const arrowGeometry = new THREE.ConeGeometry(0.15, 0.4, 8)
            const arrowMaterial = new THREE.MeshBasicMaterial({ 
              color,
              transparent: true,
              opacity: baseOpacity + 0.2
            })
            const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial)
            
            arrow.position.set(midX, midY, midZ)
            
            // Orient arrow in direction of connection
            const axis = new THREE.Vector3(0, 1, 0)
            arrow.quaternion.setFromUnitVectors(axis, arrowDir)
            
            scene.add(arrow)
            arrowsRef.current.push(arrow)
          }
          
          // Add to animated connections if needed
          if (visualStyle.animated || visualStyle.glow) {
            animatedConnectionsRef.current.push({
              line,
              material,
              offset: Math.random() * Math.PI * 2
            })
          }
          
          // Store connection data with full metadata
          connectionsRef.current.set(line, {
            id: conn.id,
            type: connType,
            strength: conn.strength || 'moderate',
            explanation: conn.explanation || 'Connection between passages',
            canonicalSignificance: conn.canonicalSignificance || '',
            fromReference: fromNode.reference || fromNode.label,
            toReference: toNode.reference || toNode.label,
            sourceEra: conn.sourceEra,
            targetEra: conn.targetEra,
            direction: conn.direction,
            sourceNode: fromNode,
            targetNode: toNode
          })
        }
      })

      setLoading(false)
    } catch (error) {
      console.error('Failed to load constellation data:', error)
      setLoading(false)
    }
  }

  const handleAddToSermon = async (reference: string) => {
    console.log('Adding to sermon:', reference)
    
    try {
      const pathParts = window.location.pathname.split('/')
      const workspaceId = pathParts[pathParts.indexOf('workspace') + 1]
      
      if (!workspaceId) {
        console.error('No workspace ID found')
        return
      }
      
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/references`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reference,
          context: 'Added from 3D canonical constellation exploration'
        })
      })
      
      if (response.ok) {
        console.log('Reference added successfully')
        setContextPanelVisible(false)
      } else {
        console.error('Failed to add reference:', response.statusText)
      }
    } catch (error) {
      console.error('Error adding reference:', error)
    }
  }

  const handleOpenPassage = (reference: string) => {
    console.log('Opening passage:', reference)
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/scripture/${encodeURIComponent(reference)}`, '_blank')
  }

  const handleExploreConnections = (reference: string) => {
    console.log('Exploring connections for:', reference)
    
    let targetNode: any = null
    const normalizedRef = reference.replace(/^book-/, '')
    
    nodesRef.current.forEach((data, mesh) => {
      const nodeRef = data.reference?.replace(/^book-/, '')
      if (data.reference === reference || nodeRef === normalizedRef || data.reference === normalizedRef) {
        targetNode = data
      }
    })
    
    if (targetNode) {
      setSelectedNode(targetNode)
      
      if (focusModeActive) {
        focusOnNode(targetNode)
      }
    } else {
      console.warn('Node not found for reference:', reference, 'normalized:', normalizedRef)
    }
  }

  const focusOnNode = (nodeData: any) => {
    if (!cameraRef.current || !controlsRef.current) return
    
    const targetPos = new THREE.Vector3(
      nodeData.x || 0,
      nodeData.y || 0,
      nodeData.z || 0
    )
    
    const distance = 15
    const cameraPos = new THREE.Vector3(
      targetPos.x,
      targetPos.y,
      targetPos.z + distance
    )
    
    const startPos = cameraRef.current.position.clone()
    const startTime = Date.now()
    const duration = 1000
    
    const animateCamera = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      
      if (cameraRef.current) {
        cameraRef.current.position.lerpVectors(startPos, cameraPos, eased)
        controlsRef.current?.target.lerp(targetPos, eased)
        controlsRef.current?.update()
      }
      
      if (progress < 1) {
        requestAnimationFrame(animateCamera)
      }
    }
    
    animateCamera()
  }

  const handleResetView = () => {
    if (!cameraRef.current || !controlsRef.current) return
    cameraRef.current.position.set(0, 15, 30)
    controlsRef.current.target.set(0, 0, 0)
    controlsRef.current.update()
    setFocusModeActive(false)
    setActiveTheme(null)
    setSuggestedPath(null)
  }

  const handleFocusMode = () => {
    setFocusModeActive(!focusModeActive)
  }

  return (
    <div className="relative w-full h-[600px]">
      <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
          <div className="text-cyan-300 animate-pulse">Loading constellation...</div>
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

      {selectedConnection && connectionDetailVisible && (
        <ConnectionDetailPanel
          connection={selectedConnection}
          sourceNode={{
            reference: selectedConnection.sourceNode?.reference || selectedConnection.fromReference,
            label: selectedConnection.sourceNode?.label || selectedConnection.fromReference
          }}
          targetNode={{
            reference: selectedConnection.targetNode?.reference || selectedConnection.toReference,
            label: selectedConnection.targetNode?.label || selectedConnection.toReference
          }}
          onClose={() => setConnectionDetailVisible(false)}
          onOpenPassage={handleOpenPassage}
          onAddToSermon={handleAddToSermon}
          onExploreSimilar={() => {
            console.log('Explore similar connections:', selectedConnection.type)
            setConnectionDetailVisible(false)
          }}
        />
      )}

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
