// --- CENA, CÂMERA E RENDERER ---
const container = document.getElementById('background');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  1,
  20000
);
camera.position.set(0, 30, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95; // Brilho elevado para clima ensolarado
container.appendChild(renderer.domElement);

// --- MAR REALISTA TROPICAL (AZUL/VERDE TURQUESA) ---
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

const textureLoader = new THREE.TextureLoader();
const waterNormals = textureLoader.load(
  'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/waternormals.jpg',
  function (texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  }
);

const water = new THREE.Water(waterGeometry, {
  textureWidth: 512,
  textureHeight: 512,
  waterNormals: waterNormals,
  sunDirection: new THREE.Vector3(),
  sunColor: 0xffffff,
  waterColor: 0x007799, // Tom de água turquesa tropical viva
  distortionScale: 4.5,
  fog: scene.fog !== undefined
});
water.rotation.x = -Math.PI / 2;
scene.add(water);

// --- CÉU ENSOLARADO E SOL BRILHANTE ---
const sky = new THREE.Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 2.0;       // Ar limpo
skyUniforms['rayleigh'].value = 1.2;        // Azul vivo no céu
skyUniforms['mieCoefficient'].value = 0.003;
skyUniforms['mieDirectionalG'].value = 0.8;

const sun = new THREE.Vector3();

// Posição do Sol (Alta no céu - Dia Ensolarado)
const elevation = 42; 
const azimuth = 180; 
const phi = THREE.MathUtils.degToRad(90 - elevation);
const theta = THREE.MathUtils.degToRad(azimuth);

sun.setFromSphericalCoords(1, phi, theta);
sky.material.uniforms['sunPosition'].value.copy(sun);
water.material.uniforms['sunDirection'].value.copy(sun).normalize();

// --- NUVENS BRANCAS FOFAS EM MOVIMENTO ---
function createCloud() {
  const cloudGroup = new THREE.Group();
  const cloudGeo = new THREE.DodecahedronGeometry(18, 1);
  const cloudMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85
  });

  for (let i = 0; i < 7; i++) {
    const mesh = new THREE.Mesh(cloudGeo, cloudMat);
    mesh.position.set(
      (Math.random() - 0.5) * 45,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 25
    );
    mesh.scale.set(
      Math.random() * 0.8 + 0.6,
      Math.random() * 0.5 + 0.4,
      Math.random() * 0.8 + 0.6
    );
    cloudGroup.add(mesh);
  }

  return cloudGroup;
}

const clouds = [];
for (let i = 0; i < 18; i++) {
  const cloud = createCloud();
  cloud.position.set(
    (Math.random() - 0.5) * 1600,
    Math.random() * 90 + 90,
    (Math.random() - 0.5) * 1000 - 200
  );
  scene.add(cloud);
  clouds.push(cloud);
}

// --- BANDO DE GAIVOTAS (PÁSSAROS ANIMADOS) ---
function createBird() {
  const birdGroup = new THREE.Group();
  const wingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });

  // Asa Esquerda
  const leftWingGeo = new THREE.BufferGeometry();
  const leftVertices = new Float32Array([
    0, 0, 0,
    -7, 2, -2,
    -3, 0, -5
  ]);
  leftWingGeo.setAttribute('position', new THREE.BufferAttribute(leftVertices, 3));
  const leftWing = new THREE.Mesh(leftWingGeo, wingMat);

  // Asa Direita
  const rightWingGeo = new THREE.BufferGeometry();
  const rightVertices = new Float32Array([
    0, 0, 0,
    7, 2, -2,
    3, 0, -5
  ]);
  rightWingGeo.setAttribute('position', new THREE.BufferAttribute(rightVertices, 3));
  const rightWing = new THREE.Mesh(rightWingGeo, wingMat);

  birdGroup.add(leftWing);
  birdGroup.add(rightWing);
  birdGroup.scale.set(0.7, 0.7, 0.7);

  return {
    mesh: birdGroup,
    leftWing: leftWing,
    rightWing: rightWing,
    speed: Math.random() * 0.9 + 0.7,
    wingSpeed: Math.random() * 6 + 9,
    offset: Math.random() * Math.PI * 2
  };
}

const birds = [];
for (let i = 0; i < 14; i++) {
  const bird = createBird();
  bird.mesh.position.set(
    (Math.random() - 0.5) * 500,
    Math.random() * 50 + 40,
    (Math.random() - 0.5) * 400 - 100
  );
  scene.add(bird.mesh);
  birds.push(bird);
}

// --- MOUSE PARALLAX (MOVIMENTO SUAVE DE CÂMERA) ---
let mouseX = 0;
let mouseY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 20;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 10;
});

// --- LOOP DE ANIMAÇÃO ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // 1. Movimento das Ondas do Mar
  water.material.uniforms['time'].value += delta * 1.2;

  // 2. Movimento das Nuvens
  clouds.forEach(cloud => {
    cloud.position.x += delta * 12;
    if (cloud.position.x > 800) cloud.position.x = -800;
  });

  // 3. Voo dos Pássaros + Bater de Asas
  birds.forEach(bird => {
    bird.mesh.position.x += bird.speed;
    bird.mesh.position.z += Math.sin(time + bird.offset) * 0.3;

    const wingAngle = Math.sin(time * bird.wingSpeed + bird.offset) * 0.6;
    bird.leftWing.rotation.z = wingAngle;
    bird.rightWing.rotation.z = -wingAngle;

    if (bird.mesh.position.x > 400) {
      bird.mesh.position.x = -400;
      bird.mesh.position.z = (Math.random() - 0.5) * 400 - 100;
    }
  });

  // 4. Parallax suave acompanhando o ponteiro do mouse
  camera.position.x += (mouseX - camera.position.x) * 0.05;
  camera.position.y += (30 - mouseY - camera.position.y) * 0.05;
  camera.lookAt(0, 10, -100);

  renderer.render(scene, camera);
}

animate();

// --- RESPONSIVIDADE NA TELA ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});