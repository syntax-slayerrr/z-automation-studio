// Render point cloud Zaldy langsung di container team faces
(function() {
  function initZaldyFace() {
    var container = document.getElementById('about-who-team-faces');
    if (!container) return;
    if (container.dataset.zaldyInitialized) return;
    container.dataset.zaldyInitialized = 'true';

    container.style.position = 'relative';
    container.style.display = 'block';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.minHeight = '380px';

    var canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '15';
    container.appendChild(canvas);

    var gl = canvas.getContext('webgl', { alpha: true, antialias: true }) || canvas.getContext('experimental-webgl');
    if (!gl) return;

    var vsSource = [
      'attribute vec3 a_position;',
      'attribute float a_shade;',
      'uniform mat4 u_mvp;',
      'uniform float u_pointSize;',
      'varying float v_shade;',
      'void main() {',
      '  gl_Position = u_mvp * vec4(a_position, 1.0);',
      '  gl_PointSize = u_pointSize;',
      '  v_shade = a_shade;',
      '}'
    ].join('\n');

    var fsSource = [
      'precision mediump float;',
      'varying float v_shade;',
      'void main() {',
      '  vec2 coord = gl_PointCoord - vec2(0.5);',
      '  if (length(coord) > 0.5) discard;',
      '  float b = mix(0.45, 1.0, v_shade);',
      '  gl_FragColor = vec4(b * 0.9, b, b * 1.05, 0.95);',
      '}'
    ].join('\n');

    function createShader(gl, type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }

    var vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    var fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    var aPos = gl.getAttribLocation(prog, 'a_position');
    var aShade = gl.getAttribLocation(prog, 'a_shade');
    var uMvp = gl.getUniformLocation(prog, 'u_mvp');
    var uPointSize = gl.getUniformLocation(prog, 'u_pointSize');

    var posBuf = gl.createBuffer();
    var shadeBuf = gl.createBuffer();
    var vertexCount = 0;

    fetch('/assets/team/zaldy_pointcloud.bin')
      .then(function(res) { return res.arrayBuffer(); })
      .then(function(buf) {
        var f32 = new Float32Array(buf);
        vertexCount = f32.length / 4;
        var positions = new Float32Array(vertexCount * 3);
        var shades = new Float32Array(vertexCount);
        for (var i = 0; i < vertexCount; i++) {
          positions[i * 3] = f32[i * 4];
          positions[i * 3 + 1] = f32[i * 4 + 1];
          positions[i * 3 + 2] = f32[i * 4 + 2];
          shades[i] = f32[i * 4 + 3];
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, shadeBuf);
        gl.bufferData(gl.ARRAY_BUFFER, shades, gl.STATIC_DRAW);

        requestAnimationFrame(render);
      })
      .catch(function(e) { console.error('zaldy_pointcloud err:', e); });

    var angleY = 0;
    var lastTime = 0;

    function render(now) {
      if (!lastTime) lastTime = now;
      var dt = (now - lastTime) * 0.001;
      lastTime = now;

      var rect = container.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.max(rect.width, 320) * dpr;
      var height = Math.max(rect.height, 380) * dpr;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      if (vertexCount > 0) {
        gl.useProgram(prog);

        angleY += dt * 0.45;

        var aspect = width / height;
        var fov = 45 * Math.PI / 180;
        var near = 0.1, far = 100.0;
        var f = 1.0 / Math.tan(fov / 2);
        var nf = 1 / (near - far);

        var pMat = [
          f / aspect, 0, 0, 0,
          0, f, 0, 0,
          0, 0, (far + near) * nf, -1,
          0, 0, (2 * far * near) * nf, 0
        ];

        var cosY = Math.cos(angleY), sinY = Math.sin(angleY);
        var cosX = Math.cos(0.08), sinX = Math.sin(0.08);

        var s = 1.55;
        var r00 = cosY * s, r01 = 0, r02 = sinY * s;
        var r10 = sinX * sinY * s, r11 = cosX * s, r12 = -sinX * cosY * s;
        var r20 = -cosX * sinY * s, r21 = sinX * s, r22 = cosX * cosY * s;

        var tz = -3.2;
        var m4 = [
          r00, r10, r20, 0,
          r01, r11, r21, 0,
          r02, r12, r22, 0,
          0, 0, tz - 0.5 * r22, 1
        ];

        var mvp = new Float32Array(16);
        for (var i = 0; i < 4; i++) {
          for (var j = 0; j < 4; j++) {
            var sum = 0;
            for (var k = 0; k < 4; k++) {
              sum += pMat[k * 4 + j] * m4[i * 4 + k];
            }
            mvp[i * 4 + j] = sum;
          }
        }

        gl.uniformMatrix4fv(uMvp, false, mvp);
        gl.uniform1f(uPointSize, (window.innerWidth < 768 ? 3.2 : 4.2) * dpr);

        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPos);

        gl.bindBuffer(gl.ARRAY_BUFFER, shadeBuf);
        gl.vertexAttribPointer(aShade, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aShade);

        gl.drawArrays(gl.POINTS, 0, vertexCount);
      }

      requestAnimationFrame(render);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initZaldyFace);
  } else {
    initZaldyFace();
  }
  window.addEventListener('load', initZaldyFace);
  setTimeout(initZaldyFace, 800);
})();
