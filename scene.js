/* ============================================================
   EATO'S — hero ambient (Three.js)
   A contained, warm particle drift behind the hero title only,
   mounted when the home route is active and disposed when the
   user navigates away. Falls back to nothing if Three.js fails
   to load — the rest of the site works without it.
   ============================================================ */
window.EatosScene = (() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasThree = typeof THREE !== "undefined";
  let renderer, scene, camera, points, raf, cleanupFns = [];

  function init(){
    if(!hasThree) return;
    const canvas = document.getElementById("hero-ambient");
    if(!canvas) return;
    dispose();

    const container = canvas.parentElement;
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, 1, 1, 1400);
    camera.position.z = 520;

    const count = 260;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const warm = new THREE.Color(0xff4b2b);
    const pale = new THREE.Color(0xf5f3ef);
    const colors = new Float32Array(count * 3);

    for(let i = 0; i < count; i++){
      positions[i*3]   = (Math.random() - 0.5) * 1100;
      positions[i*3+1] = (Math.random() - 0.5) * 700 - 100;
      positions[i*3+2] = (Math.random() - 0.5) * 500;
      speeds[i] = 0.25 + Math.random() * 0.6;
      const c = Math.random() > 0.72 ? warm : pale;
      colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 3.2, vertexColors: true, transparent: true, opacity: 0.55,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    points = new THREE.Points(geo, mat);
    scene.add(points);

    function resize(){
      const w = container.clientWidth, h = container.clientHeight;
      if(!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    resize();
    window.addEventListener("resize", resize);
    cleanupFns.push(() => window.removeEventListener("resize", resize));

    let mx = 0;
    function onMove(e){ mx = e.clientX / window.innerWidth - 0.5; }
    window.addEventListener("mousemove", onMove);
    cleanupFns.push(() => window.removeEventListener("mousemove", onMove));

    const pos = geo.attributes.position;
    function tick(){
      for(let i = 0; i < count; i++){
        let y = pos.getY(i) + speeds[i];
        if(y > 350){ y = -350; }
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      points.rotation.y += 0.0009;
      camera.position.x += (mx * 80 - camera.position.x) * 0.02;
      camera.lookAt(0,0,0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    if(reduceMotion){
      renderer.render(scene, camera);
    } else {
      tick();
    }
  }

  function dispose(){
    if(raf) cancelAnimationFrame(raf);
    raf = null;
    cleanupFns.forEach(fn => fn());
    cleanupFns = [];
    if(renderer){ renderer.dispose(); renderer = null; }
    scene = camera = points = null;
  }

  return { init, dispose };
})();
