'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface TimelineUniverseProps {
  startYear?: number
  endYear?: number
  categories?: string[]
}

export default function TimelineUniverse({ startYear = -4004, endYear = 100, categories }: TimelineUniverseProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [timelineData, setTimelineData] = useState<any>(null)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTimelineData()
  }, [startYear, endYear, categories])

  useEffect(() => {
    if (!containerRef.current || !timelineData) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 25, 40)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Create timeline layers
    timelineData.layers.forEach((layer: any) => {
      layer.events.forEach((event: any) => {
        const geometry = new THREE.SphereGeometry(0.5 + event.importance / 10, 16, 16)
        const material = new THREE.MeshStandardMaterial({
          color: event.color,
          emissive: event.color,
          emissiveIntensity: 0.4
        })
        const sphere = new THREE.Mesh(geometry, material)
        sphere.position.set(event.position.x, event.position.y, event.position.z)
        sphere.userData = event
        scene.add(sphere)

        // Add year label
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        canvas.width = 256
        canvas.height = 64
        context.fillStyle = '#ffffff'
        context.font = '16px Arial'
        context.textAlign = 'center'
        context.fillText(`${event.year} ${event.era}`, 128, 20)
        context.fillText(event.title, 128, 45)

        const texture = new THREE.CanvasTexture(canvas)
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
        const sprite = new THREE.Sprite(spriteMaterial)
        sprite.position.set(event.position.x, event.position.y + 2, event.position.z)
        sprite.scale.set(6, 1.5, 1)
        scene.add(sprite)
      })

      // Draw layer line
      if (layer.events.length > 1) {
        const points = layer.events.map((e: any) =>
          new THREE.Vector3(e.position.x, e.position.y, e.position.z)
        )
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({ color: layer.color, opacity: 0.3, transparent: true })
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
  }, [timelineData])

  const loadTimelineData = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (startYear) params.append('startYear', startYear.toString())
      if (endYear) params.append('endYear', endYear.toString())
      if (categories) params.append('categories', categories.join(','))

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/visualization/timeline?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      setTimelineData(data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading timeline:', error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full h-[600px] bg-black rounded-xl overflow-hidden border border-white/10">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-cyan-200">Loading Timeline Universe...</div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
        <div className="absolute top-4 left-4 bg-black/80 p-3 rounded-lg border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Timeline Layers</p>
          <p className="text-xs text-amber-200">● Biblical Events</p>
          <p className="text-xs text-blue-200">● Political Events</p>
          <p className="text-xs text-red-200">● Empires</p>
          <p className="text-xs text-gray-300 mt-2">Scroll horizontally through history</p>
        </div>
      </div>

      {timelineData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {timelineData.eras.slice(0, 4).map((era: any, idx: number) => (
            <div key={idx} className="border border-white/10 rounded-lg p-3 bg-black/30">
              <p className="text-xs font-semibold text-gray-100">{era.name}</p>
              <p className="text-xs text-gray-400">
                {Math.abs(era.startYear)} {era.startYear < 0 ? 'BC' : 'AD'} - {Math.abs(era.endYear)} {era.endYear < 0 ? 'BC' : 'AD'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
