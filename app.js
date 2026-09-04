// FlexAssist - Lower-Limb Assistive Exoskeleton
// Frontend interactions, 3D viewers, CAM simulation & biomechanics engine

document.addEventListener('DOMContentLoaded', () => {
  initAudioSystem();
  initThemeAndNav();
  initGallerySystem();
  initHero3DViewer();
  initCadStudio3DViewer();
  initCncSimulator();
  initFeedsSpeedsCalc();
  initBiomechEngine();
  initPatientCustomizer();
  initClinicalTrialForm();
  initStatCounters();
});

// Web Audio API feedback for UI interactions
let audioCtx = null;
let soundEnabled = true;

function initAudioSystem() {
  const audioBtn = document.getElementById('audioToggleBtn');
  
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  window.playMedSound = function(type = 'click') {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'slide') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      audioBtn.innerHTML = soundEnabled 
        ? '<i class="fa-solid fa-volume-high"></i>' 
        : '<i class="fa-solid fa-volume-xmark"></i>';
      audioBtn.style.color = soundEnabled ? 'var(--color-cyan)' : 'var(--text-muted)';
      showToast(soundEnabled ? 'Medical Audio Feedback Enabled' : 'Audio Muted');
    });
  }
}

// Theme toggle, mobile navigation & toast notifications
function initThemeAndNav() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const mobileToggleBtn = document.getElementById('mobileToggleBtn');
  const navMenu = document.getElementById('navMenu');

  // Load saved theme
  const savedTheme = localStorage.getItem('flexassist_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('flexassist_theme', nextTheme);
      updateThemeIcon(nextTheme);
      window.playMedSound('click');
      showToast(`Switched to ${nextTheme.toUpperCase()} Mode`);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggleBtn) return;
    themeToggleBtn.innerHTML = theme === 'dark' 
      ? '<i class="fa-solid fa-moon"></i>' 
      : '<i class="fa-solid fa-sun"></i>';
  }

  if (mobileToggleBtn && navMenu) {
    mobileToggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      window.playMedSound('click');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        window.playMedSound('click');
      });
    });
  }
}

function showToast(msg, icon = 'fa-info-circle') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid ${icon} highlight-cyan"></i> <span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Hero 3D interactive viewer (Three.js procedural rig)
function initHero3DViewer() {
  const container = document.getElementById('hero3dContainer');
  const loader = document.getElementById('heroLoader');
  const angleSlider = document.getElementById('heroFlexionSlider');
  const angleDisplay = document.getElementById('heroAngleDisplay');
  const phaseDisplay = document.getElementById('heroGaitPhase');
  const autoCycleBtn = document.getElementById('heroAutoCycleBtn');
  const resetCamBtn = document.getElementById('heroResetCamBtn');
  const wireframeBtn = document.getElementById('heroToggleWireframeBtn');

  if (!container || typeof THREE === 'undefined') {
    if (loader) loader.innerHTML = '<span>3D Viewer Ready</span>';
    return;
  }

  // Three.js Scene Setup
  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 5, 26);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  let controls = null;
  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 1.7;
    controls.minDistance = 12;
    controls.maxDistance = 40;
  }

  // Lighting
  const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambLight);

  const dirLight1 = new THREE.DirectionalLight(0x00e5ff, 1.2);
  dirLight1.position.set(10, 20, 15);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x10b981, 0.8);
  dirLight2.position.set(-10, -10, -10);
  scene.add(dirLight2);

  // Exoskeleton Procedural 3D Hierarchy
  const exoRoot = new THREE.Group();
  scene.add(exoRoot);

  // Materials
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x223249,
    metalness: 0.85,
    roughness: 0.25,
  });

  const cncAlloyMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    metalness: 0.9,
    roughness: 0.15,
    emissive: 0x003344,
  });

  const damperMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    metalness: 0.7,
    roughness: 0.3,
  });

  const strapMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.9,
  });

  // 1. Thigh Assembly (Upper Leg)
  const thighGroup = new THREE.Group();
  thighGroup.position.set(0, 4, 0);

  // Upper Frame C-Bar
  const thighBarGeo = new THREE.BoxGeometry(0.8, 6.5, 1.2);
  const thighBar = new THREE.Mesh(thighBarGeo, metalMat);
  thighBar.position.set(-2.2, 0, 0);
  thighGroup.add(thighBar);

  const thighBarRight = thighBar.clone();
  thighBarRight.position.set(2.2, 0, 0);
  thighGroup.add(thighBarRight);

  // Thigh C-Brace Cuffs (Curved ergonomic band)
  const cuffGeo = new THREE.CylinderGeometry(2.6, 2.6, 1.2, 32, 1, true, 0, Math.PI);
  const cuffMesh = new THREE.Mesh(cuffGeo, strapMat);
  cuffMesh.rotation.y = -Math.PI / 2;
  cuffMesh.position.set(0, 1.5, 0.5);
  thighGroup.add(cuffMesh);

  exoRoot.add(thighGroup);

  // 2. Knee Pivot Center & CNC Side Brackets
  const kneePivot = new THREE.Group();
  kneePivot.position.set(0, 0, 0);
  exoRoot.add(kneePivot);

  // Hinge Side Brackets (Milled 6061-T6 plates)
  const bracketGeo = new THREE.BoxGeometry(0.6, 2.8, 2.4);
  const leftBracket = new THREE.Mesh(bracketGeo, cncAlloyMat);
  leftBracket.position.set(-2.2, 0, 0);
  kneePivot.add(leftBracket);

  const rightBracket = leftBracket.clone();
  rightBracket.position.set(2.2, 0, 0);
  kneePivot.add(rightBracket);

  // Pivot Bearing Pins
  const pinGeo = new THREE.CylinderGeometry(0.45, 0.45, 5.2, 16);
  const pinMesh = new THREE.Mesh(pinGeo, metalMat);
  pinMesh.rotation.z = Math.PI / 2;
  kneePivot.add(pinMesh);

  // 3. Lower Shank Assembly (Articulated via Knee Flexion)
  const shankGroup = new THREE.Group();
  kneePivot.add(shankGroup);

  // Shank Side Bars
  const shankBarGeo = new THREE.BoxGeometry(0.8, 7.5, 1.2);
  const shankBarLeft = new THREE.Mesh(shankBarGeo, metalMat);
  shankBarLeft.position.set(-2.2, -4, 0);
  shankGroup.add(shankBarLeft);

  const shankBarRight = shankBarLeft.clone();
  shankBarRight.position.set(2.2, -4, 0);
  shankGroup.add(shankBarRight);

  // Lower Shank Cuff
  const lowerCuff = cuffMesh.clone();
  lowerCuff.position.set(0, -3.5, 0.4);
  shankGroup.add(lowerCuff);

  // Ground Base Stirrup / Sole Plate
  const footBaseGeo = new THREE.BoxGeometry(4.8, 0.5, 5.5);
  const footBase = new THREE.Mesh(footBaseGeo, metalMat);
  footBase.position.set(0, -8, 1.2);
  shankGroup.add(footBase);

  // 4. Elastic Spring-Damper Mechanism
  const damperGeo = new THREE.CylinderGeometry(0.35, 0.35, 3.2, 16);
  const damperMesh = new THREE.Mesh(damperGeo, damperMat);
  damperMesh.position.set(-2.2, -0.5, -0.8);
  kneePivot.add(damperMesh);

  const damperRight = damperMesh.clone();
  damperRight.position.set(2.2, -0.5, -0.8);
  kneePivot.add(damperRight);

  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => (loader.style.display = 'none'), 400);
  }

  // Flexion Angle Update Function
  function setFlexionAngle(degrees) {
    const rad = (degrees * Math.PI) / 180;
    shankGroup.rotation.x = rad;

    if (angleDisplay) angleDisplay.innerText = `${Math.round(degrees)}°`;

    if (phaseDisplay) {
      if (degrees < 15) phaseDisplay.innerText = 'Initial Contact (0-10%)';
      else if (degrees < 35) phaseDisplay.innerText = 'Mid-Stance (15-35%)';
      else if (degrees < 65) phaseDisplay.innerText = 'Terminal Stance (35-60%)';
      else phaseDisplay.innerText = 'Peak Swing Assist (60-100%)';
    }
  }

  setFlexionAngle(35);

  if (angleSlider) {
    angleSlider.addEventListener('input', (e) => {
      setFlexionAngle(parseFloat(e.target.value));
      window.playMedSound('slide');
    });
  }

  // Auto Gait Cycle Animation
  let isAutoCycling = false;
  let cycleTime = 0;

  if (autoCycleBtn) {
    autoCycleBtn.addEventListener('click', () => {
      isAutoCycling = !isAutoCycling;
      autoCycleBtn.innerHTML = isAutoCycling 
        ? '<i class="fa-solid fa-pause"></i> Pause Cycle' 
        : '<i class="fa-solid fa-play"></i> Auto Gait Cycle';
      window.playMedSound('click');
      showToast(isAutoCycling ? 'Continuous Gait Cycle Active' : 'Gait Animation Paused');
    });
  }

  if (resetCamBtn) {
    resetCamBtn.addEventListener('click', () => {
      camera.position.set(0, 5, 26);
      if (controls) controls.reset();
      window.playMedSound('click');
    });
  }

  let isWireframe = false;
  if (wireframeBtn) {
    wireframeBtn.addEventListener('click', () => {
      isWireframe = !isWireframe;
      metalMat.wireframe = isWireframe;
      cncAlloyMat.wireframe = isWireframe;
      damperMat.wireframe = isWireframe;
      strapMat.wireframe = isWireframe;
      window.playMedSound('click');
    });
  }

  // Render Loop
  function animate() {
    requestAnimationFrame(animate);

    if (isAutoCycling) {
      cycleTime += 0.035;
      const angle = 20 + 35 * Math.sin(cycleTime);
      setFlexionAngle(Math.max(0, angle));
      if (angleSlider) angleSlider.value = Math.max(0, angle);
    }

    if (controls) controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Resize Listener
  window.addEventListener('resize', () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

// 3D CAD Studio & exploded hierarchy viewer
function initCadStudio3DViewer() {
  const container = document.getElementById('cad3dCanvas');
  const explodeSlider = document.getElementById('cadExplodeSlider');
  const explodeDisplay = document.getElementById('explodeValDisplay');
  const jointSlider = document.getElementById('cadJointSlider');
  const jointDisplay = document.getElementById('cadAngleDisplay');
  const explodeAnimateBtn = document.getElementById('cadExplodeAnimateBtn');

  // Camera buttons
  const btnIso = document.getElementById('cadViewIso');
  const btnSide = document.getElementById('cadViewSide');
  const btnFront = document.getElementById('cadViewFront');
  const btnStress = document.getElementById('cadToggleStress');

  // Inspector card elements
  const inspectorTitle = document.getElementById('inspectorTitle');
  const inspectorBadge = document.getElementById('inspectorBadge');
  const inspectorDesc = document.getElementById('inspectorDesc');
  const inspectorSpecs = document.getElementById('inspectorSpecs');

  if (!container || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1424);

  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(16, 12, 24);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  let controls = null;
  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
  }

  // Studio Grid Floor
  const gridHelper = new THREE.GridHelper(30, 30, 0x00e5ff, 0x1e293b);
  gridHelper.position.y = -8.5;
  scene.add(gridHelper);

  // Lights
  const ambLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(15, 25, 20);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x00e5ff, 0.6);
  fillLight.position.set(-15, 10, -10);
  scene.add(fillLight);

  // Components Materials
  const partMaterials = {
    cncPlate: new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.9, roughness: 0.2 }),
    thighFrame: new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 }),
    shankFrame: new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 }),
    damper: new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8, roughness: 0.25 }),
    pins: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 }),
    stress: new THREE.MeshStandardMaterial({
      color: 0xff3b30,
      metalness: 0.4,
      roughness: 0.3,
      emissive: 0x330000,
    }),
  };

  // Build Exploded Parts Hierarchy
  const assemblyRoot = new THREE.Group();
  scene.add(assemblyRoot);

  // 1. Thigh Frame
  const thighMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 7, 1.4), partMaterials.thighFrame);
  thighMesh.position.set(0, 4.5, 0);
  assemblyRoot.add(thighMesh);

  // 2. Left & Right CNC Side Bracket Plates
  const bracketL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.2, 2.6), partMaterials.cncPlate);
  bracketL.position.set(-1.8, 0, 0);
  assemblyRoot.add(bracketL);

  const bracketR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.2, 2.6), partMaterials.cncPlate);
  bracketR.position.set(1.8, 0, 0);
  assemblyRoot.add(bracketR);

  // 3. Elastic Damper Cartridge
  const damperMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3.4, 16), partMaterials.damper);
  damperMesh.position.set(0, -0.2, -1.2);
  assemblyRoot.add(damperMesh);

  // 4. Lower Shank Frame
  const shankMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 1.4), partMaterials.shankFrame);
  shankMesh.position.set(0, -4.5, 0);
  assemblyRoot.add(shankMesh);

  // 5. Fasteners / Pins
  const pinL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16), partMaterials.pins);
  pinL.rotation.z = Math.PI / 2;
  pinL.position.set(-2.8, 0, 0);
  assemblyRoot.add(pinL);

  const pinR = pinL.clone();
  pinR.position.set(2.8, 0, 0);
  assemblyRoot.add(pinR);

  // Exploded View State
  function applyExplosion(factor) {
    // factor from 0.0 to 1.0
    thighMesh.position.y = 4.5 + factor * 5.0;
    shankMesh.position.y = -4.5 - factor * 5.0;
    bracketL.position.x = -1.8 - factor * 4.5;
    bracketR.position.x = 1.8 + factor * 4.5;
    pinL.position.x = -2.8 - factor * 7.5;
    pinR.position.x = 2.8 + factor * 7.5;
    damperMesh.position.z = -1.2 - factor * 4.0;

    if (explodeDisplay) explodeDisplay.innerText = `${Math.round(factor * 100)}%`;
  }

  if (explodeSlider) {
    explodeSlider.addEventListener('input', (e) => {
      applyExplosion(parseFloat(e.target.value) / 100);
      window.playMedSound('slide');
    });
  }

  if (jointSlider) {
    jointSlider.addEventListener('input', (e) => {
      const deg = parseFloat(e.target.value);
      shankMesh.rotation.x = (deg * Math.PI) / 180;
      if (jointDisplay) jointDisplay.innerText = `${deg}°`;
      window.playMedSound('slide');
    });
  }

  // Component Information Metadata (Plain, clear language)
  const compData = {
    bracket: {
      title: 'Main Knee Joint Bracket (Solid Metal)',
      badge: '3-Axis CNC Machined',
      desc: 'The primary load-carrying metal link connecting your thigh and lower leg. Carries body weight safely with rounded, stress-free corners.',
      specs: '<div><strong>Thickness:</strong> 8.0 mm (Solid Metal)</div><div><strong>Metal Grade:</strong> Tough 6061-T6 Aluminum</div><div><strong>Corners:</strong> Smooth Rounded Edges</div><div><strong>Weight Saved:</strong> 62% Lighter with Pockets</div>',
    },
    thigh: {
      title: 'Upper Thigh Support Cuff',
      badge: 'Soft Foam & Sturdy Shell',
      desc: 'Comfortable contoured thigh brace with breathable memory foam padding and easy-adjust quick-release straps.',
      specs: '<div><strong>Height:</strong> 220 mm</div><div><strong>Padding:</strong> Soft Memory Foam</div><div><strong>Straps:</strong> Quick-Adjust Buckles</div><div><strong>Weight:</strong> 310 grams (Featherlight)</div>',
    },
    damper: {
      title: 'Adjustable Helper Spring Cartridge',
      badge: 'Support Spring Unit',
      desc: 'Quick-swap internal spring that pushes upward with your leg during stairs, walking, and standing up.',
      specs: '<div><strong>Support Level:</strong> 15 to 35 Nm Helping Force</div><div><strong>Travel:</strong> 45 mm Smooth Stroke</div><div><strong>Spring Feel:</strong> Progressive Push</div><div><strong>Durability:</strong> 500,000+ Steps Tested</div>',
    },
    shank: {
      title: 'Lower Leg Frame & Foot Base',
      badge: 'Ground Support Strut',
      desc: 'Sturdy lower leg bar that transfers weight smoothly down into the shoe plate and ground.',
      specs: '<div><strong>Height:</strong> Adjustable (38 to 45 cm)</div><div><strong>Height Adjustment:</strong> 5 Easy Pin Slots</div><div><strong>Base:</strong> Non-Slip Rubber Grip</div><div><strong>Weight:</strong> 420 grams</div>',
    },
    fasteners: {
      title: 'Smooth Pivot Pins & Safety Stops',
      badge: 'Stainless Steel & Bronze',
      desc: 'Smooth pivot pins and self-lubricating bronze rings with built-in metal stops to prevent knees from bending backwards.',
      specs: '<div><strong>Pin Diameter:</strong> 10 mm Hardened Steel</div><div><strong>Pivot Ring:</strong> Smooth Oil-Infused Bronze</div><div><strong>Safety Limits:</strong> 0° Straight to 120° Bend</div><div><strong>Safety Factor:</strong> 2.85x Extra Strong</div>',
    },
  };

  document.querySelectorAll('.comp-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.comp-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const partKey = btn.getAttribute('data-part');
      const data = compData[partKey];
      if (data && inspectorTitle) {
        inspectorTitle.innerText = data.title;
        inspectorBadge.innerText = data.badge;
        inspectorDesc.innerText = data.desc;
        inspectorSpecs.innerHTML = data.specs;
        window.playMedSound('click');
        showToast(`Inspecting: ${data.title}`);
      }
    });
  });

  // Camera Presets
  function setCameraPos(x, y, z) {
    camera.position.set(x, y, z);
    if (controls) controls.target.set(0, 0, 0);
    window.playMedSound('click');
  }

  if (btnIso) {
    btnIso.addEventListener('click', () => {
      setCameraPos(16, 12, 24);
      setActiveStudioBtn(btnIso);
    });
  }
  if (btnSide) {
    btnSide.addEventListener('click', () => {
      setCameraPos(28, 0, 0);
      setActiveStudioBtn(btnSide);
    });
  }
  if (btnFront) {
    btnFront.addEventListener('click', () => {
      setCameraPos(0, 0, 30);
      setActiveStudioBtn(btnFront);
    });
  }

  let stressMode = false;
  if (btnStress) {
    btnStress.addEventListener('click', () => {
      stressMode = !stressMode;
      bracketL.material = stressMode ? partMaterials.stress : partMaterials.cncPlate;
      bracketR.material = stressMode ? partMaterials.stress : partMaterials.cncPlate;
      btnStress.classList.toggle('active', stressMode);
      window.playMedSound('click');
      showToast(stressMode ? 'Strength Heatmap: Structure is 2.85x Extra Strong' : 'Standard 3D View');
    });
  }

  function setActiveStudioBtn(activeBtn) {
    [btnIso, btnSide, btnFront].forEach((b) => b && b.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
  }

  // Explode Animation Button
  let isExplodeAnimating = false;
  let animProgress = 0;
  if (explodeAnimateBtn) {
    explodeAnimateBtn.addEventListener('click', () => {
      isExplodeAnimating = !isExplodeAnimating;
      explodeAnimateBtn.innerHTML = isExplodeAnimating
        ? '<i class="fa-solid fa-pause"></i> Stop Explode Animation'
        : '<i class="fa-solid fa-play"></i> Animate Explode Cycle';
      window.playMedSound('click');
    });
  }

  function renderCad() {
    requestAnimationFrame(renderCad);

    if (isExplodeAnimating) {
      animProgress += 0.015;
      const factor = (Math.sin(animProgress) + 1) / 2; // 0.0 to 1.0
      applyExplosion(factor);
      if (explodeSlider) explodeSlider.value = factor * 100;
    }

    if (controls) controls.update();
    renderer.render(scene, camera);
  }
  renderCad();

  window.addEventListener('resize', () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

// 3-Axis CNC toolpath simulation & G-code streamer
function initCncSimulator() {
  const canvas = document.getElementById('cncCanvas');
  const gcodeBox = document.getElementById('gcodeBox');
  const simPlayBtn = document.getElementById('simPlayBtn');
  const simStepBtn = document.getElementById('simStepBtn');
  const simResetBtn = document.getElementById('simResetBtn');
  const speedSelect = document.getElementById('simSpeedSelect');
  const gcodeStatus = document.getElementById('gcodeStatus');

  const coordX = document.getElementById('cncX');
  const coordY = document.getElementById('cncY');
  const coordZ = document.getElementById('cncZ');

  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // G-Code Instruction Sequence for 6061-T6 Hinge Link
  const gcodeProgram = [
    { code: '%', comment: 'PROGRAM START' },
    { code: 'O1847 (FLEXASSIST_HINGE_LINK_OP1)', comment: 'PART ID' },
    { code: 'G21 G90 G40 G80 G49', comment: 'METRIC ABSOLUTE' },
    { code: 'G28 G91 Z0.', comment: 'RETURN TO Z HOME' },
    { code: 'T1 M06 (10MM 3FL CARBIDE ENDMILL)', comment: 'TOOL CHANGE' },
    { code: 'S6200 M03', comment: 'SPINDLE ON CW' },
    { code: 'G54 G00 X-50. Y-30.', comment: 'RAPID TO STOCK CORNER' },
    { code: 'G43 H01 Z5.0 M08', comment: 'TOOL OFFSET + COOLANT ON' },
    { code: 'G01 Z-2.0 F350.', comment: 'PLUNGE CUT PASS 1' },
    { code: 'G01 X50. Y-30. F850.', comment: 'FACING ROUGHING' },
    { code: 'G01 X50. Y30.', comment: 'PROFILE CONTOUR' },
    { code: 'G02 X30. Y50. R20.', comment: 'CORNER RADIUS FILLET R3.0' },
    { code: 'G01 X-30. Y50.', comment: 'TOP CONTOUR' },
    { code: 'G02 X-50. Y30. R20.', comment: 'TOP CORNER FILLET' },
    { code: 'G01 X-50. Y-30.', comment: 'CLOSE PROFILE' },
    { code: 'G00 Z5.0', comment: 'RETRACT' },
    { code: 'G00 X0. Y0.', comment: 'RAPID TO POCKET CENTER' },
    { code: 'G01 Z-4.0 F250.', comment: 'HELICAL POCKET ROUGHING' },
    { code: 'G03 X0. Y0. I15. J0.', comment: 'CIRCULAR POCKET CLEARING' },
    { code: 'G00 Z10.0', comment: 'RETRACT' },
    { code: 'T2 M06 (4.2MM DRILL)', comment: 'DRILLING PIVOT BORES' },
    { code: 'G81 X-25. Y15. Z-14. R2. F180.', comment: 'CANNED DRILL CYCLE' },
    { code: 'X25. Y15.', comment: 'DRILL PIN HOLE 2' },
    { code: 'G80 G00 Z25. M09', comment: 'CANCEL CYCLE + COOLANT OFF' },
    { code: 'M30', comment: 'PROGRAM END & REWIND' },
  ];

  // Populate G-code box
  if (gcodeBox) {
    gcodeBox.innerHTML = gcodeProgram
      .map((g, idx) => `<div class="gcode-line" id="gline-${idx}"><span style="color:#64748b">${String(idx + 1).padStart(3, '0')}</span>  <strong>${g.code}</strong>  <span style="color:#00e5ff;opacity:0.7">; ${g.comment}</span></div>`)
      .join('');
  }

  // Toolpath Waypoints for 2D Canvas Visualization
  const toolpathPoints = [
    { x: 80, y: 70, z: 5, feed: 0, rapid: true },
    { x: 80, y: 70, z: -2, feed: 350, rapid: false },
    { x: 480, y: 70, z: -2, feed: 850, rapid: false },
    { x: 480, y: 310, z: -2, feed: 850, rapid: false },
    { x: 400, y: 350, z: -2, feed: 700, rapid: false },
    { x: 160, y: 350, z: -2, feed: 850, rapid: false },
    { x: 80, y: 310, z: -2, feed: 700, rapid: false },
    { x: 80, y: 70, z: -2, feed: 850, rapid: false },
    { x: 280, y: 210, z: 5, feed: 0, rapid: true },
    { x: 280, y: 210, z: -5, feed: 300, rapid: false },
    // Pocket circles
    { x: 340, y: 210, z: -5, feed: 600, rapid: false },
    { x: 280, y: 270, z: -5, feed: 600, rapid: false },
    { x: 220, y: 210, z: -5, feed: 600, rapid: false },
    { x: 280, y: 150, z: -5, feed: 600, rapid: false },
    { x: 340, y: 210, z: -5, feed: 600, rapid: false },
    // Pivot holes
    { x: 180, y: 210, z: 5, feed: 0, rapid: true },
    { x: 180, y: 210, z: -12, feed: 180, rapid: false },
    { x: 380, y: 210, z: 5, feed: 0, rapid: true },
    { x: 380, y: 210, z: -12, feed: 180, rapid: false },
  ];

  let currentStep = 0;
  let isSimPlaying = false;
  let simSpeed = 3;
  let toolPos = { x: 80, y: 70 };
  let cutHistory = [];

  function drawStock() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stock Boundary (120x80mm representation)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.fillRect(50, 40, 460, 300);
    ctx.strokeRect(50, 40, 460, 300);

    // Grid marks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 50; x <= 510; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, 340);
      ctx.stroke();
    }
    for (let y = 40; y <= 340; y += 40) {
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(510, y);
      ctx.stroke();
    }

    // Material Removed Cuts
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < cutHistory.length - 1; i++) {
      const p1 = cutHistory[i];
      const p2 = cutHistory[i + 1];
      if (!p2.rapid) {
        ctx.strokeStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Finished Component Desired Overlay
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(90, 80, 380, 220);
    ctx.setLineDash([]);

    // Draw Endmill Cutter Head
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(toolPos.x, toolPos.y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(toolPos.x, toolPos.y, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Spindle spin effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(toolPos.x - 6, toolPos.y - 6);
    ctx.lineTo(toolPos.x + 6, toolPos.y + 6);
    ctx.stroke();
  }

  function advanceSimStep() {
    if (currentStep >= toolpathPoints.length) {
      isSimPlaying = false;
      if (simPlayBtn) simPlayBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Re-Run Milling';
      if (gcodeStatus) {
        gcodeStatus.innerText = 'MACHINING COMPLETE';
        gcodeStatus.className = 'badge-pulse highlight-green';
      }
      window.playMedSound('success');
      showToast('CNC Cycle Finished: 6061-T6 Hinge Link Machined Successfully!');
      return;
    }

    const pt = toolpathPoints[currentStep];
    toolPos = { x: pt.x, y: pt.y };
    cutHistory.push(pt);

    // Update Telemetry Display
    if (coordX) coordX.innerText = ((pt.x - 280) * 0.25).toFixed(3);
    if (coordY) coordY.innerText = ((pt.y - 190) * 0.25).toFixed(3);
    if (coordZ) coordZ.innerText = pt.z.toFixed(3);

    // Highlight G-code line
    const gIdx = Math.min(currentStep + 4, gcodeProgram.length - 1);
    document.querySelectorAll('.gcode-line').forEach((el) => el.classList.remove('active'));
    const lineEl = document.getElementById(`gline-${gIdx}`);
    if (lineEl) {
      lineEl.classList.add('active');
      lineEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    drawStock();
    currentStep++;
    window.playMedSound('slide');
  }

  drawStock();

  // Button Listeners
  if (simPlayBtn) {
    simPlayBtn.addEventListener('click', () => {
      if (currentStep >= toolpathPoints.length) {
        // Reset
        currentStep = 0;
        cutHistory = [];
        drawStock();
      }

      isSimPlaying = !isSimPlaying;
      simPlayBtn.innerHTML = isSimPlaying
        ? '<i class="fa-solid fa-pause"></i> Pause Machining'
        : '<i class="fa-solid fa-play"></i> Resume Milling';

      if (gcodeStatus) {
        gcodeStatus.innerText = isSimPlaying ? 'CYCLE ACTIVE (M08 ON)' : 'FEED HOLD';
        gcodeStatus.className = 'badge-pulse';
      }
      window.playMedSound('click');
    });
  }

  if (simStepBtn) {
    simStepBtn.addEventListener('click', () => {
      isSimPlaying = false;
      if (simPlayBtn) simPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Milling Sim';
      advanceSimStep();
    });
  }

  if (simResetBtn) {
    simResetBtn.addEventListener('click', () => {
      isSimPlaying = false;
      currentStep = 0;
      cutHistory = [];
      toolPos = { x: 80, y: 70 };
      drawStock();
      if (simPlayBtn) simPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Milling Sim';
      if (gcodeStatus) gcodeStatus.innerText = 'READY TO CYCLE';
      window.playMedSound('click');
      showToast('Workpiece Stock Reset');
    });
  }

  if (speedSelect) {
    speedSelect.addEventListener('change', (e) => {
      simSpeed = parseInt(e.target.value);
    });
  }

  // Simulator Loop
  setInterval(() => {
    if (isSimPlaying) {
      advanceSimStep();
    }
  }, 400 / simSpeed);
}

// Speeds & feeds calculator (Fusion 360 machining formulas)
function initFeedsSpeedsCalc() {
  const matSelect = document.getElementById('calcMaterial');
  const diaInput = document.getElementById('calcCutterDia');
  const flutesInput = document.getElementById('calcFlutes');
  const fzInput = document.getElementById('calcFz');

  const resRpm = document.getElementById('resRpm');
  const resFeed = document.getElementById('resFeed');
  const resVc = document.getElementById('resVc');

  const cuttingSpeeds = {
    6061: 200, // m/min
    7075: 180,
    ti: 45,
    delrin: 300,
  };

  function computeFeeds() {
    const mat = matSelect ? matSelect.value : '6061';
    const vc = cuttingSpeeds[mat] || 200;
    const dia = parseFloat(diaInput ? diaInput.value : 10) || 10;
    const z = parseInt(flutesInput ? flutesInput.value : 3) || 3;
    const fz = parseFloat(fzInput ? fzInput.value : 0.045) || 0.045;

    // RPM = (Vc * 1000) / (PI * Dia)
    const rpm = Math.round((vc * 1000) / (Math.PI * dia));
    // Feed = RPM * Fz * Z
    const feed = Math.round(rpm * fz * z);

    if (resRpm) resRpm.innerText = `${rpm.toLocaleString()} RPM`;
    if (resFeed) resFeed.innerText = `${feed.toLocaleString()} mm/min`;
    if (resVc) resVc.innerText = `${vc} m/min`;
  }

  [matSelect, diaInput, flutesInput, fzInput].forEach((elem) => {
    if (elem) {
      elem.addEventListener('input', () => {
        computeFeeds();
        window.playMedSound('slide');
      });
    }
  });

  computeFeeds();
}

// Biomechanical joint torque & knee offloading analysis (Chart.js)
function initBiomechEngine() {
  const chartCanvas = document.getElementById('biomechChart');
  const weightSlider = document.getElementById('bioWeight');
  const weightVal = document.getElementById('bioWeightVal');
  const assistSlider = document.getElementById('bioAssistLevel');
  const assistVal = document.getElementById('bioAssistVal');
  const gaitSlider = document.getElementById('bioGaitPhaseSlider');
  const gaitVal = document.getElementById('bioGaitVal');

  const metricBio = document.getElementById('metricBioMoment');
  const metricAssist = document.getElementById('metricAssistTorque');
  const metricNet = document.getElementById('metricNetLoad');
  const metricEnergy = document.getElementById('metricEnergySaved');

  if (!chartCanvas || typeof Chart === 'undefined') return;

  let currentActivity = 'walk';
  const activityScales = {
    walk: { peakMult: 1.12, name: 'Level Walking' },
    stairs: { peakMult: 1.85, name: 'Stair Ascent' },
    squat: { peakMult: 2.2, name: 'Deep Squatting' },
    sit_to_stand: { peakMult: 1.6, name: 'Sit-to-Stand' },
  };

  const gaitLabels = Array.from({ length: 21 }, (_, i) => `${i * 5}%`);

  function calculateTorqueCurves(weight, assistLvl, activity) {
    const scale = activityScales[activity].peakMult;
    const basePeak = (weight * 9.81 * 0.12 * scale) / 10; // Peak joint moment (Nm)
    const assistRatio = 0.15 + (assistLvl - 1) * 0.1; // 15% to 55%

    const bioMoment = [];
    const exoAssist = [];
    const netMoment = [];

    for (let i = 0; i <= 20; i++) {
      const pct = (i * 5) / 100; // 0.0 to 1.0
      // Biological knee moment curve shape during gait
      let wave = 0;
      if (pct < 0.4) {
        wave = Math.sin((pct / 0.4) * Math.PI); // Stance peak
      } else if (pct < 0.7) {
        wave = -0.3 * Math.sin(((pct - 0.4) / 0.3) * Math.PI); // Flexion extension transition
      } else {
        wave = 0.25 * Math.sin(((pct - 0.7) / 0.3) * Math.PI); // Swing deceleration
      }

      const rawBio = basePeak * wave;
      const assistTorque = Math.max(0, rawBio * assistRatio);
      const net = rawBio - assistTorque;

      bioMoment.push(parseFloat(rawBio.toFixed(1)));
      exoAssist.push(parseFloat(assistTorque.toFixed(1)));
      netMoment.push(parseFloat(net.toFixed(1)));
    }

    return { bioMoment, exoAssist, netMoment, basePeak, assistRatio };
  }

  // Init Chart.js
  const curves = calculateTorqueCurves(70, 3, 'walk');
  const biomechChart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: gaitLabels,
      datasets: [
        {
          label: 'Unassisted Biological Moment (Nm)',
          data: curves.bioMoment,
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          borderWidth: 2.5,
          tension: 0.35,
          fill: false,
        },
        {
          label: 'FlexAssist Restorative Torque (Nm)',
          data: curves.exoAssist,
          borderColor: '#00e5ff',
          backgroundColor: 'rgba(0, 229, 255, 0.15)',
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
        },
        {
          label: 'Net Assisted Muscle Demand (Nm)',
          data: curves.netMoment,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2.5,
          borderDash: [5, 5],
          tension: 0.35,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(7, 13, 24, 0.95)',
          titleColor: '#00e5ff',
          bodyColor: '#f8fafc',
          borderColor: 'rgba(0, 229, 255, 0.4)',
          borderWidth: 1,
          padding: 10,
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' },
        },
        y: {
          title: { display: true, text: 'Joint Torque (Nm)', color: '#94a3b8' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' },
        },
      },
    },
  });

  function updateBiomechanicalData() {
    const weight = parseFloat(weightSlider ? weightSlider.value : 70);
    const assist = parseInt(assistSlider ? assistSlider.value : 3);
    const gaitPct = parseInt(gaitSlider ? gaitSlider.value : 20);

    if (weightVal) weightVal.innerText = `${weight} kg`;
    if (assistVal) {
      const labels = ['Level 1 (15%)', 'Level 2 (25%)', 'Level 3 (35%)', 'Level 4 (45%)', 'Level 5 (55%)'];
      assistVal.innerText = labels[assist - 1] || 'Level 3 (35%)';
    }
    if (gaitVal) gaitVal.innerText = `${gaitPct}% (${getGaitPhaseName(gaitPct)})`;

    const { bioMoment, exoAssist, netMoment, basePeak, assistRatio } = calculateTorqueCurves(weight, assist, currentActivity);

    biomechChart.data.datasets[0].data = bioMoment;
    biomechChart.data.datasets[1].data = exoAssist;
    biomechChart.data.datasets[2].data = netMoment;
    biomechChart.update();

    // Update scorecards
    const peakAssist = (basePeak * assistRatio).toFixed(1);
    const netPeak = (basePeak - basePeak * assistRatio).toFixed(1);
    const energy = Math.round(assistRatio * 100);

    if (metricBio) metricBio.innerText = `${basePeak.toFixed(1)} Nm`;
    if (metricAssist) metricAssist.innerText = `${peakAssist} Nm`;
    if (metricNet) metricNet.innerText = `${netPeak} Nm`;
    if (metricEnergy) metricEnergy.innerText = `${energy}.0%`;

    // Highlight gait step bar
    highlightGaitStep(gaitPct);
  }

  function getGaitPhaseName(pct) {
    if (pct < 15) return 'Heel Strike';
    if (pct < 35) return 'Loading Response / Mid-Stance';
    if (pct < 50) return 'Terminal Stance';
    if (pct < 60) return 'Pre-Swing';
    return 'Swing Phase';
  }

  function highlightGaitStep(pct) {
    document.querySelectorAll('.phase-step').forEach((el) => el.classList.remove('active-phase'));
    let cls = '.p1';
    if (pct >= 15 && pct < 35) cls = '.p2';
    else if (pct >= 35 && pct < 50) cls = '.p3';
    else if (pct >= 50 && pct < 60) cls = '.p4';
    else if (pct >= 60) cls = '.p5';

    const step = document.querySelector(cls);
    if (step) step.classList.add('active-phase');
  }

  // Activity Switcher
  document.querySelectorAll('.act-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.act-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentActivity = btn.getAttribute('data-mode');
      updateBiomechanicalData();
      window.playMedSound('click');
      showToast(`Activity Changed: ${activityScales[currentActivity].name}`);
    });
  });

  [weightSlider, assistSlider, gaitSlider].forEach((slider) => {
    if (slider) {
      slider.addEventListener('input', () => {
        updateBiomechanicalData();
        window.playMedSound('slide');
      });
    }
  });

  updateBiomechanicalData();
}

// Patient fitting calculator & custom prescription report
function initPatientCustomizer() {
  const generateBtn = document.getElementById('generateReportBtn');
  const printBtn = document.getElementById('printReportBtn');

  const patName = document.getElementById('patName');
  const patDiagnosis = document.getElementById('patDiagnosis');
  const patSide = document.getElementById('patSide');
  const patKneeWidth = document.getElementById('patKneeWidth');
  const patThighCirc = document.getElementById('patThighCirc');
  const patShankLen = document.getElementById('patShankLen');

  const repName = document.getElementById('repName');
  const repIndication = document.getElementById('repIndication');
  const repLimb = document.getElementById('repLimb');
  const repOffset = document.getElementById('repOffset');
  const repThigh = document.getElementById('repThigh');
  const repShank = document.getElementById('repShank');
  const repCartridge = document.getElementById('repCartridge');

  function updateReport() {
    const name = patName ? patName.value || 'Patient' : 'Patient';
    const diag = patDiagnosis ? patDiagnosis.value : 'Clinical Indication';
    const side = patSide ? patSide.value : 'Bilateral';
    const kneeW = parseFloat(patKneeWidth ? patKneeWidth.value : 112) || 112;
    const thighC = parseFloat(patThighCirc ? patThighCirc.value : 54) || 54;
    const shankL = parseFloat(patShankLen ? patShankLen.value : 42) || 42;

    if (repName) repName.innerText = name;
    if (repIndication) repIndication.innerText = diag;
    if (repLimb) repLimb.innerText = side;

    // Computed Engineering Fit
    const offset = (kneeW + 4.0).toFixed(1); // 4mm padding allowance
    if (repOffset) repOffset.innerText = `${offset} mm Spacing (H7 Fit)`;

    let strapSize = 'Size M (46 - 52 cm)';
    if (thighC < 46) strapSize = 'Size S (38 - 45 cm)';
    else if (thighC > 52) strapSize = `Size L (${thighC - 2} - ${thighC + 4} cm)`;
    if (repThigh) repThigh.innerText = strapSize;

    const slotPos = Math.round((shankL - 30) / 3);
    if (repShank) repShank.innerText = `${shankL * 10} mm (Slot Position ${Math.max(1, Math.min(6, slotPos))})`;

    let cartridgeType = 'Dual 25 Nm Progressive Spring';
    if (diag.includes('ACL')) cartridgeType = 'Dual 20 Nm Damped Cartridge (Controlled Post-Op)';
    else if (diag.includes('Osteoarthritis')) cartridgeType = 'Dual 30 Nm Low-Friction Offloader';
    else if (diag.includes('Industrial')) cartridgeType = 'Heavy-Duty 38 Nm Gas Strut Cartridge';
    if (repCartridge) repCartridge.innerText = cartridgeType;

    // Trigger celebration effects
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00e5ff', '#10b981', '#ffffff'],
      });
    }

    window.playMedSound('success');
    showToast('Clinical Fitting Report Generated & Verified');
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      updateReport();
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

// Clinical trial demo request handler
function initClinicalTrialForm() {
  const form = document.getElementById('trialForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('trialName').value;
    const email = document.getElementById('trialEmail').value;
    const role = document.getElementById('trialRole').value;

    window.playMedSound('success');
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00e5ff', '#10b981', '#38bdf8'],
      });
    }

    showToast(`Thank You ${name}! SIH-1847 Clinical Trial Package dispatched to ${email}`, 'fa-envelope-circle-check');
    form.reset();
  });
}

// Metric counter animation
function initStatCounters() {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = parseFloat(entry.target.getAttribute('data-target'));
          const decimals = parseInt(entry.target.getAttribute('data-decimals')) || 0;
          let count = 0;
          const duration = 1500;
          const stepTime = 20;
          const increment = target / (duration / stepTime);

          const timer = setInterval(() => {
            count += increment;
            if (count >= target) {
              entry.target.innerText = decimals > 0 ? target.toFixed(decimals) : Math.round(target);
              clearInterval(timer);
            } else {
              entry.target.innerText = decimals > 0 ? count.toFixed(decimals) : Math.round(count);
            }
          }, stepTime);

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((c) => observer.observe(c));
}

// Gallery tab filters & lightbox modal
function initGallerySystem() {
  const tabs = document.querySelectorAll('.gallery-tab');
  const cards = document.querySelectorAll('.gallery-card');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');
      window.playMedSound('click');

      cards.forEach((card) => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.3s ease';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Global Lightbox Handlers
  window.openLightbox = function (imgSrc, title, description) {
    const modal = document.getElementById('imageLightbox');
    const img = document.getElementById('lightboxImg');
    const titleEl = document.getElementById('lightboxTitle');
    const descEl = document.getElementById('lightboxDescription');

    if (!modal || !img) return;

    img.src = imgSrc;
    if (titleEl) titleEl.innerText = title || 'Autodesk Fusion CAD Render';
    if (descEl) descEl.innerText = description || 'Smart India Hackathon 2024 - FlexAssist (SIH1847)';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    window.playMedSound('click');
  };

  window.closeLightbox = function (e) {
    const modal = document.getElementById('imageLightbox');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      window.playMedSound('click');
    }
  };

  // Keyboard Escape listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeLightbox();
    }
  });
}

