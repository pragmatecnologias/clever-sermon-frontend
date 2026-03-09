'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface SermonFlowSculptorProps {
  bigIdea: string
  points: string[]
  applications: string[]
  supportingVerses: Record<string, string[]>
  illustrations?: string[]
}

export default function SermonFlowSculptor({
  bigIdea,
  points,
  applications,
  supportingVerses,
  illustrations
}: SermonFlowSculptorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [flowData, setFlowData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Theological Question: Does the weight of the text match the weight of the sermon?

  useEffect(() => {
    loadFlowData()
  }, [bigIdea, points, applications, supportingVerses])

  useEffect(() => {
    if (!containerRef.current || !flowData) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 20, 25)

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
    flowData.nodes.forEach((node: any) => {
      const geometry = new THREE.SphereGeometry(node.size, 16, 16)
      const material = new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: 0.3
      })
      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.set(node.position.x, node.position.y, node.position.z)
      scene.add(sphere)

      // Add label
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.width = 256
      canvas.height = 64
      context.fillStyle = '#ffffff'
      context.font = 'bold 18px Arial'
      context.textAlign = 'center'
      context.fillText(node.label, 128, 32)

      const texture = new THREE.CanvasTexture(canvas)
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
      const sprite = new THREE.Sprite(spriteMaterial)
      sprite.position.set(node.position.x, node.position.y + node.size + 1.5, node.position.z)
      sprite.scale.set(5, 1.2, 1)
      scene.add(sprite)
    })

    // Create connections
    flowData.connections.forEach((conn: any) => {
      const sourceNode = flowData.nodes.find((n: any) => n.id === conn.source)
      const targetNode = flowData.nodes.find((n: any) => n.id === conn.target)

      if (sourceNode && targetNode) {
        const points = [
          new THREE.Vector3(sourceNode.position.x, sourceNode.position.y, sourceNode.position.z),
          new THREE.Vector3(targetNode.position.x, targetNode.position.y, targetNode.position.z)
        ]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({
          color: conn.isWeak ? 0xef4444 : conn.color,
          opacity: conn.strength,
          transparent: true,
          linewidth: conn.isWeak ? 1 : 2
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
  }, [flowData])

  const loadFlowData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/visualization/sermon-flow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bigIdea,
          points,
          applications,
          supportingVerses,
          illustrations
        })
      })
      const data = await response.json()
      setFlowData(data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading sermon flow:', error)
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-300'
    if (score >= 50) return 'text-amber-300'
    return 'text-red-300'
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full h-[600px] bg-black rounded-xl overflow-hidden border border-white/10">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-cyan-200">Sculpting Sermon Flow...</div>
          </div>
        )}
        <div className="absolute top-4 right-4 bg-gradient-to-br from-green-900/90 to-teal-900/90 p-4 rounded-lg border border-green-500/50 max-w-md z-20">
          <p className="text-sm font-semibold text-green-200 mb-1">Theological Question:</p>
          <p className="text-xs text-gray-300 italic">Does the weight of the text match the weight of the sermon?</p>
        </div>
        <div ref={containerRef} className="w-full h-full" />
        <div className="absolute top-4 left-4 bg-black/80 p-3 rounded-lg border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Legend</p>
          <p className="text-xs text-amber-200">● Big Idea</p>
          <p className="text-xs text-blue-200">● Points</p>
          <p className="text-xs text-purple-200">● Applications</p>
          <p className="text-xs text-green-200">● Verses</p>
          <p className="text-xs text-red-200 mt-2">Red lines = Weak connection</p>
        </div>
      </div>

      {flowData?.integrity && (
        <div className="border border-white/10 rounded-xl p-4 bg-black/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-100">Sermon Integrity</h3>
            <div className={`text-2xl font-bold ${getScoreColor(flowData.integrity.score)}`}>
              {flowData.integrity.score}%
            </div>
          </div>

          {flowData.integrity.warnings.length > 0 && (
            <div className="space-y-1">
              {flowData.integrity.warnings.map((warning: string, idx: number) => (
                <p key={idx} className="text-xs text-amber-200">⚠️ {warning}</p>
              ))}
            </div>
          )}

          {flowData.integrity.score >= 75 && (
            <p className="text-xs text-green-200 mt-2">✓ Sermon structure is well-grounded</p>
          )}
        </div>
      )}
    </div>
  )
}
