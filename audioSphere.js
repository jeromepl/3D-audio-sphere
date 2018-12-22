const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const stats = new Stats();

const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setClearColor(0xFF0000);
renderer.sortObjects = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(stats.domElement);
camera.position.z = 270;
camera.position.y = 100;

const orbit = new THREE.OrbitControls(camera, render.domElement);

/* PARTICLE SYSTEM */
const radius = 100;
const num_orbits = 40;
const arc_separation = 1;
const particles = new THREE.Geometry();
const particleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 4,
    map: new THREE.TextureLoader().load('res/particle.png'),
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});

for (let theta = -Math.PI * (1 / 2 - 1 / num_orbits); theta < Math.PI / 2; theta += Math.PI / num_orbits) {
    const orbitRadius = Math.cos(theta) * radius;
    const particleCount = orbitRadius / arc_separation; // Find the number of particles to put on that orbit
    for (let phi = 0; phi < 2 * Math.PI; phi += (2 * Math.PI) / particleCount) {
        const particle = new THREE.Vector3(0, 0, 0);
        particle.x = particle.initX = Math.cos(theta) * Math.cos(phi) * radius;
        particle.y = particle.initY = Math.sin(theta) * radius;
        particle.z = particle.initZ = Math.sin(phi) * orbitRadius;

        particles.vertices.push(particle);
    }
}

// Create the particle system
const particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

/* AUDIO - Needs a user event to start */
let analyser;
let frequencyData;
const skipFrequencies = 620; // Skip the first frequencies as they have too big values and mess up the shape of the sphere
const playBtn = document.getElementById('play');
playBtn.addEventListener('click', () => {
    const audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    const audioEl = document.getElementById('audio');
    const source = audioCtx.createMediaElementSource(audioEl);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 8192;
    analyser.smoothingTimeConstant = 0.8;

    frequencyData = new Uint8Array(analyser.frequencyBinCount);

    audioEl.play();

    // Hide the play button
    playBtn.setAttribute('style', 'display: None;');

    // Show the audio controls now
    audioEl.setAttribute('style', 'display: block;');
});

function render() {
    requestAnimationFrame(render);

    // Update the particles
    if (frequencyData) {
        analyser.getByteFrequencyData(frequencyData);

        // The frequencies are applied to the particles in a symmetric fashion, from the center row of the sphere.
        // This means the low frequencies appear in the middle of the sphere, while the highest frequencies are located at the two poles.
        for (let i = 0; i < particles.vertices.length / 2; i++) {
            if (i + skipFrequencies < frequencyData.length) {
                let particle = particles.vertices[Math.floor(particles.vertices.length / 2) + i];
                const factor = frequencyData[i + skipFrequencies] / 256 + 1; // between 1 and 2
                particle.x = particle.initX * factor;
                particle.y = particle.initY * factor;
                particle.z = particle.initZ * factor;

                particle = particles.vertices[Math.floor(particles.vertices.length / 2) - i];
                particle.x = particle.initX * factor;
                particle.y = particle.initY * factor;
                particle.z = particle.initZ * factor;
            }
        }

        particleSystem.geometry.verticesNeedUpdate = true; // Need to specify that the object has changed
    }

    orbit.update();
    stats.update();

    renderer.render(scene, camera);
}
render();

window.addEventListener(
    'resize',
    () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    },
    false
);
