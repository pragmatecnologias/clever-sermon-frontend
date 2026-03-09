'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface ProphecyWebProps {
  theme?: 'daniel' | 'sanctuary' | 'messiah' | 'all'
}

export default function ProphecyWeb({ theme = 'all' }: ProphecyWebProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [webData, setWebData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Theological Question: What covenant movement is unfolding?

  useEffect(() => {
    loadProphecyWeb()
  }, [theme])

  useEffect(() => {
    if (!containerRef.current || !webData) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 20, 30)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(10, 10, 10)
    scene.add(pointLight)

    // Create nodes
    webData.nodes.forEach((node: any) => {
      const geometry = new THREE.SphereGeometry(node.size, 16, 16)
      const material = new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: node.type === 'prophecy' ? 0.5 : 0.3
      })
      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.set(node.position.x, node.position.y, node.position.z)
      sphere.userData = node
      scene.add(sphere)

      // Add label
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
      sprite.position.set(node.position.x, node.position.y + node.size + 1.5, node.position.z)
      sprite.scale.set(5, 1.2, 1)
      scene.add(sprite)
    })

    // Create connections with glow
    webData.connections.forEach((conn: any) => {
      const sourceNode = webData.nodes.find((n: any) => n.id === conn.source)
      const targetNode = webData.nodes.find((n: any) => n.id === conn.target)

      if (sourceNode && targetNode) {
        const points = [
          new THREE.Vector3(sourceNode.position.x, sourceNode.position.y, sourceNode.position.z),
          new THREE.Vector3(targetNode.position.x, targetNode.position.y, targetNode.position.z)
        ]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({
          color: conn.color,
          opacity: conn.strength,
          transparent: true,
          linewidth: 3
        })
        const line = new THREE.Line(geometry, material)
        scene.add(line)
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

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [webData])

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
      console.error('Error loading prophecy web:', error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full h-[600px] bg-black rounded-xl overflow-hidden border border-white/10">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-cyan-200">Weaving Prophecy Connections...</div>
          </div>
        )}
        <div className="absolute top-4 right-4 bg-gradient-to-br from-red-900/90 to-purple-900/90 p-4 rounded-lg border border-red-500/50 max-w-md z-20">
          <p className="text-sm font-semibold text-red-200 mb-1">Theological Question:</p>
          <p className="text-xs text-gray-300 italic">What covenant movement is unfolding?</p>
        </div>
        <div ref={containerRef} className="w-full h-full" />
        <div className="absolute top-4 left-4 bg-black/80 p-3 rounded-lg border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Prophecy Web</p>
          <p className="text-xs text-red-200">● OT Prophecy</p>
          <p className="text-xs text-purple-200">● NT Fulfillment</p>
          <p className="text-xs text-amber-200">● Sanctuary Theme</p>
          <p className="text-xs text-blue-200">● Messianic</p>
        </div>
      </div>

      {webData && (
        <div className="border border-white/10 rounded-xl p-4 bg-black/30">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-red-300">{webData.metadata.totalProphecies}</p>
              <p className="text-xs text-gray-400">Prophecies</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-300">{webData.metadata.totalFulfillments}</p>
              <p className="text-xs text-gray-400">Fulfillments</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-300">{webData.metadata.strongestConnections}</p>
              <p className="text-xs text-gray-400">Strong Links</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
