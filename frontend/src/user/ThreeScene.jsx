// ThreeScene.jsx
//
// A giant, "anime-like" environment with rolling hills, multiple rivers, 
// boids (birds/fish), cartoon animals, day-night transitions, and camera vantage points.
//
// USAGE:
//  1. Place <ThreeScene ref={threeRef} /> behind your survey UI.
//  2. From your UserSurvey, you can do something like:
//       threeRef.current.goToVantagePoint(pageIndex);
//     when the user clicks "Next Page" to smoothly move the camera.
//
// Note: The code is huge. In a real codebase, you'd 
// split it into modules. This is an all-in-one demonstration.

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { Reflector } from 'three/examples/jsm/objects/Reflector'

// ---------- 1) Large Noise Class (Terrain + Rivers) ----------

class PerlinNoise {
  constructor() {
    this.grad3 = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ]
    this.p = []
    for (let i = 0; i < 256; i++){
      this.p[i] = Math.floor(Math.random() * 256)
    }
    this.perm = []
    for (let i = 0; i < 512; i++){
      this.perm[i] = this.p[i & 255]
    }
  }
  dot(g, x, y) {
    return g[0]*x + g[1]*y
  }
  noise2D(xin, yin) {
    // Simplex-ish approach
    const F2 = 0.5 * (Math.sqrt(3) - 1)
    const G2 = (3 - Math.sqrt(3)) / 6
    let n0, n1, n2
    const s = (xin + yin) * F2
    const i = Math.floor(xin + s)
    const j = Math.floor(yin + s)
    const t = (i + j) * G2
    const X0 = i - t
    const Y0 = j - t
    const x0 = xin - X0
    const y0 = yin - Y0
    let i1, j1
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2
    const y1 = y0 - j1 + G2
    const x2 = x0 - 1 + 2*G2
    const y2 = y0 - 1 + 2*G2
    const ii = i & 255
    const jj = j & 255
    const gi0 = this.perm[ii + this.perm[jj]] % 12
    const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12
    const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12
    let t0 = 0.5 - x0*x0 - y0*y0
    if (t0 < 0) n0 = 0
    else {
      t0 *= t0
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0)
    }
    let t1 = 0.5 - x1*x1 - y1*y1
    if (t1 < 0) n1 = 0
    else {
      t1 *= t1
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1)
    }
    let t2 = 0.5 - x2*x2 - y2*y2
    if(t2<0) n2 = 0
    else {
      t2 *= t2
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2)
    }
    return 70*(n0 + n1 + n2)
  }
}

// ---------- 2) Boids (birds/fish) ----------
class Boid {
  constructor(x,y,z) {
    this.position = new THREE.Vector3(x,y,z)
    this.velocity = new THREE.Vector3((Math.random()-0.5)*0.5,(Math.random()-0.5)*0.5,(Math.random()-0.5)*0.5)
    this.acceleration = new THREE.Vector3()
    this.maxSpeed = 0.5
    this.maxForce = 0.02
  }
  edges(bounds=80) {
    if (this.position.x > bounds) this.position.x = -bounds
    else if (this.position.x < -bounds) this.position.x = bounds
    if (this.position.y > 30) this.position.y = 5
    else if (this.position.y < 2) this.position.y = 3
    if (this.position.z > bounds) this.position.z = -bounds
    else if (this.position.z < -bounds) this.position.z = bounds
  }
  align(boids, radius=10) {
    let steering = new THREE.Vector3()
    let total=0
    for (let other of boids) {
      const d = this.position.distanceTo(other.position)
      if(other!==this && d<radius){
        steering.add(other.velocity)
        total++
      }
    }
    if(total>0){
      steering.divideScalar(total)
      steering.setLength(this.maxSpeed)
      steering.sub(this.velocity)
      steering.clampLength(0,this.maxForce)
    }
    return steering
  }
  cohesion(boids, radius=10) {
    let steering = new THREE.Vector3()
    let total=0
    for (let other of boids) {
      const d = this.position.distanceTo(other.position)
      if(other!==this && d<radius){
        steering.add(other.position)
        total++
      }
    }
    if(total>0){
      steering.divideScalar(total)
      steering.sub(this.position)
      steering.setLength(this.maxSpeed)
      steering.sub(this.velocity)
      steering.clampLength(0,this.maxForce)
    }
    return steering
  }
  separation(boids, desiredSep=3) {
    let steering = new THREE.Vector3()
    let total=0
    for (let other of boids) {
      const d = this.position.distanceTo(other.position)
      if(other!==this && d<desiredSep){
        let diff = new THREE.Vector3().subVectors(this.position, other.position)
        diff.divideScalar(d*d)
        steering.add(diff)
        total++
      }
    }
    if(total>0){
      steering.divideScalar(total)
    }
    if(steering.length()>0){
      steering.setLength(this.maxSpeed)
      steering.sub(this.velocity)
      steering.clampLength(0,this.maxForce)
    }
    return steering
  }
  flock(boids) {
    const alignment = this.align(boids)
    const cohesion = this.cohesion(boids)
    const separation = this.separation(boids)
    this.acceleration.add(alignment)
    this.acceleration.add(cohesion)
    this.acceleration.add(separation)
  }
  update(){
    this.velocity.add(this.acceleration)
    this.velocity.clampLength(0,this.maxSpeed)
    this.position.add(this.velocity)
    this.acceleration.set(0,0,0)
  }
}

// ---------- 3) Simple "wander" AI for land animals ----------
class Wanderer {
  constructor(x,y,z){
    this.position = new THREE.Vector3(x,y,z)
    this.target = new THREE.Vector3(x,y,z)
    this.speed = 0.01+Math.random()*0.02
  }
  pickNewTarget(range=20){
    this.target.set(
      this.position.x+(Math.random()*2-1)*range,
      this.position.y,
      this.position.z+(Math.random()*2-1)*range
    )
  }
  update(){
    const dir = new THREE.Vector3().subVectors(this.target, this.position)
    const dist = dir.length()
    if(dist<0.5){
      this.pickNewTarget(20)
    } else {
      dir.normalize()
      this.position.addScaledVector(dir, this.speed)
    }
  }
}

// ---------- 4) Simple tween system for camera vantage transitions ----------
class CameraTween {
  constructor(camera) {
    this.camera = camera
    this.startPos = new THREE.Vector3()
    this.endPos = new THREE.Vector3()
    this.startLookAt = new THREE.Vector3()
    this.endLookAt = new THREE.Vector3()
    this.duration = 2000
    this.startTime = 0
    this.running = false
  }
  start(posFrom, posTo, lookFrom, lookTo, duration=2000){
    this.startPos.copy(posFrom)
    this.endPos.copy(posTo)
    this.startLookAt.copy(lookFrom)
    this.endLookAt.copy(lookTo)
    this.duration = duration
    this.startTime = performance.now()
    this.running = true
  }
  update(){
    if(!this.running) return
    const now = performance.now()
    const elapsed = now - this.startTime
    const t = Math.min(elapsed / this.duration, 1)
    // smooth
    const easeT = t<0.5 ? 2*t*t : -1+(4-2*t)*t
    // interpolate
    const px = this.startPos.x + (this.endPos.x - this.startPos.x)*easeT
    const py = this.startPos.y + (this.endPos.y - this.startPos.y)*easeT
    const pz = this.startPos.z + (this.endPos.z - this.startPos.z)*easeT
    this.camera.position.set(px, py, pz)
    const lx = this.startLookAt.x + (this.endLookAt.x - this.startLookAt.x)*easeT
    const ly = this.startLookAt.y + (this.endLookAt.y - this.startLookAt.y)*easeT
    const lz = this.startLookAt.z + (this.endLookAt.z - this.startLookAt.z)*easeT
    this.camera.lookAt(lx, ly, lz)
    if(t>=1){
      this.running = false
    }
  }
}

// ---------- 5) The actual ginormous environment component ----------
const ThreeScene = forwardRef(function ThreeScene(_, ref){
  const mountRef = useRef(null)
  // We'll store references we need
  const cameraRef = useRef()
  const sceneRef = useRef()
  const rendererRef = useRef()
  const controlsRef = useRef()
  const vantageTweenRef = useRef()

  // We'll define vantagePoints for the survey pages
  // Each vantage point has a camera position + a "lookAt"
  const vantagePoints = [
    {
      pos: new THREE.Vector3(0, 10, 80),
      look: new THREE.Vector3(0, 0, 0)
    },
    {
      pos: new THREE.Vector3(30, 15, 20),
      look: new THREE.Vector3(0, 0, 0)
    },
    {
      pos: new THREE.Vector3(-40, 10, -10),
      look: new THREE.Vector3(0, 0, -20)
    },
    {
      pos: new THREE.Vector3(10, 20, -40),
      look: new THREE.Vector3(0, 0, 0)
    },
    {
      pos: new THREE.Vector3(0, 5, 15),
      look: new THREE.Vector3(20, 0, 0)
    }
  ]

  // This function can be called from parent to move camera
  useImperativeHandle(ref, () => ({
    goToVantagePoint: (index) => {
      if(!cameraRef.current) return
      if(index<0 || index>= vantagePoints.length) return
      const vantage = vantagePoints[index]
      // Start a tween from current camera pos/look to vantage
      vantageTweenRef.current.start(
        cameraRef.current.position, vantage.pos.clone(),
        getCameraLookAt(cameraRef.current), vantage.look.clone(),
        3000 // 3 seconds
      )
    }
  }))

  // Helper to find camera's current lookAt by casting a ray forward
  function getCameraLookAt(camera){
    // get direction from camera
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    return camera.position.clone().add(dir.multiplyScalar(50))
  }

  useEffect(() => {
    // -------------------------------------------------------
    //  (1) Setup Scene, Camera, Renderer
    // -------------------------------------------------------
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color('#BFFFE1') 
    scene.fog = new THREE.Fog('#BFFFE1', 60, 200)

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 10, 80)
    camera.lookAt(0,0,0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias:true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // We create a tween system for vantage transitions
    vantageTweenRef.current = new CameraTween(camera)

    // Optional controls for debugging
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.target.set(0,5,0)
    controlsRef.current = controls

    // -------------------------------------------------------
    //  (2) Lights
    // -------------------------------------------------------
    const hemiLight = new THREE.HemisphereLight('#ffffff', '#bde8a3', 0.8)
    hemiLight.position.set(0,50,0)
    scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight('#ffffff', 0.5)
    dirLight.position.set(60,100,40)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    scene.add(dirLight)

    // A nighttime ambient that we fade in
    const ambientNight = new THREE.AmbientLight('#444444', 0)
    scene.add(ambientNight)

    // -------------------------------------------------------
    //  (3) Terrain (with 2D Perlin noise for rolling hills)
    // -------------------------------------------------------
    const perlin = new PerlinNoise()
    const terrainSize = 300
    const terrainSegments = 200
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments)
    // We'll use a basic texture for grass
    // Suppose you have a "grass.jpg" - or we keep it untextured for now
    const terrainTex = new THREE.TextureLoader().load('/textures/grass.jpg')
    terrainTex.wrapS = THREE.RepeatWrapping
    terrainTex.wrapT = THREE.RepeatWrapping
    terrainTex.repeat.set(10,10)
    const terrainMat = new THREE.MeshLambertMaterial({ map: terrainTex, color: '#eeffcc' })
    const terrain = new THREE.Mesh(terrainGeo, terrainMat)
    terrain.rotation.x = -Math.PI / 2
    terrain.receiveShadow = true
    scene.add(terrain)

    // We'll displace the plane with Perlin for a nice heightmap
    const originalVerts = terrainGeo.attributes.position.array.slice()
    function updateTerrain(time){
      const positions = terrain.geometry.attributes.position.array
      for(let i=0; i<positions.length; i+=3){
        const ox = originalVerts[i]
        const oy = originalVerts[i+1]
        const oz = originalVerts[i+2]
        const nx = (ox+150)*0.03
        const nz = (oz+150)*0.03
        // We can incorporate time to gently wave
        const h = perlin.noise2D(nx + time*0.0002, nz + time*0.0002)*5
        positions[i+1] = oy + h
      }
      terrain.geometry.attributes.position.needsUpdate = true
      terrain.geometry.computeVertexNormals()
    }

    // -------------------------------------------------------
    //  (4) Rivers via "Reflector" planes or separate geometry
    // -------------------------------------------------------
    // We'll create two or three "river" planes across the terrain
    // We'll define them with some curved shapes or just simple rectangles.

    function createRiver(x, z, length, rotation=0){
      // a big rectangle with Reflector
      const riverGeo = new THREE.PlaneGeometry(length, 15)
      const riverReflect = new Reflector(riverGeo, {
        textureWidth: 512,
        textureHeight: 512,
        color: 0x66aaff
      })
      riverReflect.rotation.x = -Math.PI/2
      riverReflect.position.set(x, -1, z)
      riverReflect.rotateZ(rotation)
      riverReflect.receiveShadow = true
      scene.add(riverReflect)
    }
    // Let's place a few rivers
    createRiver(0, -40, 200, 0.1)
    createRiver(-20, 40, 220, -0.2)

    // -------------------------------------------------------
    //  (5) Boids: Birds in the sky
    // -------------------------------------------------------
    let birds=[]
    const birdGroup = new THREE.Group()
    scene.add(birdGroup)
    const birdGeo = new THREE.ConeGeometry(0.6, 1.2, 6)
    const birdMat = new THREE.MeshLambertMaterial({ color: '#ddeeff' })
    const BIRD_COUNT=30
    for(let i=0; i<BIRD_COUNT; i++){
      let b = new Boid((Math.random()-0.5)*80, 15+Math.random()*10, (Math.random()-0.5)*80)
      birds.push(b)
      let mesh = new THREE.Mesh(birdGeo, birdMat.clone())
      mesh.castShadow = true
      birdGroup.add(mesh)
      mesh.userData.boidRef = b
    }
    function updateBirds(){
      for(let b of birds){
        b.edges(100)
        b.flock(birds)
        b.update()
      }
      for(let c of birdGroup.children){
        const boid = c.userData.boidRef
        c.position.copy(boid.position)
        // orient the cone in direction
        c.lookAt(boid.position.clone().add(boid.velocity))
      }
    }

    //  (6) Boids: Fish in the rivers
    // We'll place them around the x=some area or near the reflectors
    let fish=[]
    const fishGroup = new THREE.Group()
    scene.add(fishGroup)
    const fishGeo = new THREE.SphereGeometry(0.4, 8, 8)
    const fishMat = new THREE.MeshLambertMaterial({ color: '#ffaaff' })
    const FISH_COUNT=20
    for(let i=0;i<FISH_COUNT;i++){
      let f = new Boid(
        (Math.random()-0.5)*40, 
        -1.2, 
        -30+(Math.random()*20)
      )
      // slower
      f.maxSpeed=0.2
      fish.push(f)
      let fm = new THREE.Mesh(fishGeo, fishMat.clone())
      fishGroup.add(fm)
      fm.userData.boidRef = f
    }
    function updateFish(){
      // keep them in some bounding region near the rivers
      for(let f of fish){
        // let's define bounding box
        if(f.position.x<-100) f.position.x=100
        else if(f.position.x>100) f.position.x=-100
        if(f.position.z<-80) f.position.z=20
        else if(f.position.z>80) f.position.z=-80
        f.flock(fish)
        f.update()
        // keep fish y = -1.2
        f.position.y = -1.2
      }
      // position fish geometry
      for(let m of fishGroup.children){
        let bf = m.userData.boidRef
        m.position.copy(bf.position)
        m.lookAt(bf.position.clone().add(bf.velocity))
      }
    }

    // -------------------------------------------------------
    //  (7) Land Animals with simple wander
    // -------------------------------------------------------
    let wanderers=[]
    const wandererGroup = new THREE.Group()
    scene.add(wandererGroup)

    const gltfLoader = new GLTFLoader()
    function spawnAnimals(path, scale, count){
      for(let i=0;i<count;i++){
        gltfLoader.load(
          path,
          (gltf)=>{
            const model = gltf.scene
            model.scale.set(scale, scale, scale)
            model.traverse((child)=>{
              if(child.isMesh){
                child.castShadow=true
                child.receiveShadow=true
              }
            })
            let x=(Math.random()-0.5)*100
            let z=(Math.random()-0.5)*100
            model.position.set(x, -2, z)
            wandererGroup.add(model)
            let w = new Wanderer(x, -2, z)
            model.userData.wanderRef = w
            wanderers.push(w)
          },
          undefined,
          (err)=>{
            console.error('Failed to load', path, err)
            // fallback
            let fb = new THREE.Mesh(
              new THREE.BoxGeometry(3,2,3),
              new THREE.MeshPhongMaterial({ color: '#ffaaaa'})
            )
            let x=(Math.random()-0.5)*100
            let z=(Math.random()-0.5)*100
            fb.position.set(x, -2, z)
            wandererGroup.add(fb)
            let w = new Wanderer(x, -2, z)
            fb.userData.wanderRef=w
            wanderers.push(w)
          }
        )
      }
    }
    // Example: bunnies, deer
    spawnAnimals('/models/Bunny.glb', 1.5, 4)
    spawnAnimals('/models/Deer.glb', 2, 3)

    function updateWanderers(){
      for(let w of wanderers){
        w.update()
      }
      for(let c of wandererGroup.children){
        let wr = c.userData.wanderRef
        if(!wr) continue
        c.position.set(wr.position.x, wr.position.y, wr.position.z)
      }
    }

    // -------------------------------------------------------
    //  (8) Interactions: Raycast on click 
    //      e.g. bounce the object for 500ms
    // -------------------------------------------------------
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    function onClick(e){
      pointer.x = ( e.clientX / window.innerWidth )*2-1
      pointer.y = -( e.clientY / window.innerHeight )*2+1
      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObjects(scene.children, true)
      if(intersects.length>0){
        let obj = intersects[0].object
        obj.userData.bounceTime=performance.now()
      }
    }
    window.addEventListener('click', onClick)

    function updateBounce(){
      let now = performance.now()
      // any object with bounceTime => bounce for 500ms
      traverseScene(scene, (o)=>{
        if(o.userData.bounceTime){
          const elapsed = now - o.userData.bounceTime
          if(elapsed<500){
            o.position.y += 0.04
          } else if(elapsed<800){
            o.position.y -= 0.02
          }
        }
      })
    }
    function traverseScene(root, cb){
      root.children.forEach(c=>{
        cb(c)
        traverseScene(c, cb)
      })
    }

    // -------------------------------------------------------
    //  (9) Day-Night cycle
    // -------------------------------------------------------
    let timeOfDay=0
    const fullDay=120
    function updateDayNight(delta){
      timeOfDay += delta
      if(timeOfDay>fullDay) timeOfDay=0
      let half=fullDay/2
      let ratio=timeOfDay/half
      if(ratio>1) ratio=2-ratio
      let dayY=100
      let nightY=-10
      let newY=dayY*(1-ratio)+nightY*ratio
      dirLight.position.set(60, newY, 40)
      let dayInt=0.5
      let nightInt=0.1
      dirLight.intensity = dayInt*(1-ratio)+nightInt*ratio
      let maxAmb=0.4
      ambientNight.intensity=maxAmb*ratio
      // sky color shift
      let dayColor=new THREE.Color('#BFFFE1')
      let nightColor=new THREE.Color('#1a1633')
      let blended=dayColor.clone().lerp(nightColor, ratio)
      scene.background=blended
      scene.fog.color=blended
    }

    // -------------------------------------------------------
    //  (10) Animation loop
    // -------------------------------------------------------
    const clock=new THREE.Clock()
    let oldT=0
    function animate(){
      requestAnimationFrame(animate)
      const t=clock.getElapsedTime()
      const delta=t-oldT
      oldT=t

      // vantage tween
      vantageTweenRef.current.update()

      // day-night
      updateDayNight(delta)

      // terrain
      updateTerrain(t*1000)

      // boids
      updateBirds()
      updateFish()

      // wanderers
      updateWanderers()

      // bounce
      updateBounce()

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // -------------------------------------------------------
    //  (11) Handle Resize
    // -------------------------------------------------------
    function onResize(){
      renderer.setSize(window.innerWidth, window.innerHeight)
      camera.aspect = window.innerWidth/window.innerHeight
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    // Cleanup
    return ()=>{
      window.removeEventListener('resize', onResize)
      window.removeEventListener('click', onClick)
      if(mountRef.current){
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position:'fixed',
        top:0,
        left:0,
        width:'100%',
        height:'100%',
        zIndex:-1,
        overflow:'hidden'
      }}
    />
  )
})

export default ThreeScene
