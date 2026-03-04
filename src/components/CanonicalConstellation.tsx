'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface CanonicalConstellationProps {
  focusPassage?: string
  onNodeClick?: (reference: string) => void
}

export default function CanonicalConstellation({ focusPassage, onNodeClick }: CanonicalConstellationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

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

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.appendChild(renderer.domElement)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05

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

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [focusPassage])

  const loadConstellationData = async (scene: THREE.Scene, passage?: string) => {
    try {
      const token = localStorage.getItem('token')
      const url = passage
        ? `${process.env.NEXT_PUBLIC_API_URL}/visualization/canonical-constellation?focusPassage=${encodeURIComponent(passage)}`
        : `${process.env.NEXT_PUBLIC_API_URL}/visualization/canonical-constellation`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()

      // Create nodes
      data.nodes.forEach((node: any) => {
        const geometry = new THREE.SphereGeometry(node.size, 16, 16)
        const material = new THREE.MeshStandardMaterial({
          color: node.color,
          emissive: node.isSelected ? node.color : 0x000000,
          emissiveIntensity: node.isSelected ? 0.5 : 0
        })
        const sphere = new THREE.Mesh(geometry, material)
        sphere.position.set(node.position.x, node.position.y, node.position.z)
        sphere.userData = { id: node.id, reference: node.reference, label: node.label }
        scene.add(sphere)

        // Add label
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        canvas.width = 256
        canvas.height = 64
        context.fillStyle = '#ffffff'
        context.font = '20px Arial'
        context.textAlign = 'center'
        context.fillText(node.label, 128, 32)

        const texture = new THREE.CanvasTexture(canvas)
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
        const sprite = new THREE.Sprite(spriteMaterial)
        sprite.position.set(node.position.x, node.position.y + node.size + 1, node.position.z)
        sprite.scale.set(4, 1, 1)
        scene.add(sprite)
      })

      // Create connections
      data.connections.forEach((conn: any) => {
        const sourceNode = data.nodes.find((n: any) => n.id === conn.source)
        const targetNode = data.nodes.find((n: any) => n.id === conn.target)

        if (sourceNode && targetNode) {
          const points = [
            new THREE.Vector3(sourceNode.position.x, sourceNode.position.y, sourceNode.position.z),
            new THREE.Vector3(targetNode.position.x, targetNode.position.y, targetNode.position.z)
          ]
          const geometry = new THREE.BufferGeometry().setFromPoints(points)
          const material = new THREE.LineBasicMaterial({
            color: conn.color,
            opacity: conn.strength,
            transparent: true
          })
          const line = new THREE.Line(geometry, material)
          scene.add(line)
        }
      })

      setLoading(false)
    } catch (error) {
      console.error('Error loading constellation:', error)
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full h-[600px] bg-black rounded-xl overflow-hidden border border-white/10">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-cyan-200">Loading Canonical Constellation...</div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-black/80 p-3 rounded-lg border border-white/10">
        <p className="text-xs text-gray-400 mb-2">Controls</p>
        <p className="text-xs text-gray-300">🖱️ Drag to rotate</p>
        <p className="text-xs text-gray-300">🔍 Scroll to zoom</p>
        <p className="text-xs text-cyan-200 mt-2">Blue: OT | Purple: NT</p>
        <p className="text-xs text-amber-200">Gold: Covenant</p>
        <p className="text-xs text-red-200">Red: Prophetic</p>
      </div>
    </div>
  )
}
