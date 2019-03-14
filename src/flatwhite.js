// Directional lighting demo: By Frederick Li
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec2 a_TextCoords;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'varying vec4 v_Color;\n' +
  'varying vec2 v_TextCoords;\n' +
  'uniform bool u_isLighting;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  v_TextCoords = a_TextCoords;\n' +
  '  if(u_isLighting)\n' + 
  '  {\n' +
  '     vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '     float nDotL = max(dot(normal, u_LightDirection), 0.0);\n' +
        // Calculate the color due to diffuse reflection
  '     vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
  '     v_Color = vec4(diffuse, a_Color.a);\n' +  '  }\n' +
  '  else\n' +
  '  {\n' +
  '     v_Color = a_Color;\n' +
  '  }\n' + 
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform bool u_UseTextures;\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TextCoords;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  //'  gl_FragColor = v_Color;\n' +
  '  if(u_UseTextures)\n' + 
  '  {\n' +
  '     gl_FragColor = texture2D(u_Sampler, v_TextCoords);\n' +  '  }\n' +
  '  else\n' +
  '  {\n' +
  '     gl_FragColor = v_Color;\n' +
  '  }\n' + 
  '}\n';

var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)
var g_zAngle = 0.0;

var u_Sampler;
var u_UseTextures;

var cameraX = 20;
var cameraY = 0;
var carX = 0;

var INIT_TEXTURE_COUNT =0, TEXTURES_ON = true;
var LIGHTING_ON = true;

var rotateTranslate = 0;
var x = 0;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  //Initialise textures
  if(!initTextures(gl)){
    console.log('Failed to initialise textures');
    return;
  }

  // Set clear color and enable hidden surface removal
  gl.clearColor(102/256, 204/256, 255/256, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Get the storage locations of uniform attributes
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  u_UseTextures = gl.getUniformLocation(gl.program, 'u_UseTextures');

  // Trigger using lighting or not
  var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting'); 

  if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
      !u_ProjMatrix || !u_LightColor || !u_LightDirection ||
      !u_isLighting || !u_UseTextures) { 
    console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
    return;
  }


  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  var lightDirection = new Vector3([0.5, 3.0, 4.0]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // Calculate the view matrix and the projection matrix
  //viewMatrix.setLookAt(0, 0, camera, 0, 0, -100, 0, 1, 0); 
  projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  // Pass the model, view, and projection matrix to the uniform variable respectively
  //gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);


  document.onkeydown = function(ev){
    keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, canvas, u_ViewMatrix);
  };

  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, canvas, u_ViewMatrix);
}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, canvas, u_ViewMatrix) {
  switch (ev.keyCode) {
    case 40: // Up arrow key -> the positive rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
      break;
    case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
      break;
    case 55: // 7 -> Toggle textures
      TEXTURES_ON = !TEXTURES_ON;
      break;
    case  56: // 8 -> Toggle lightning
      LIGHTING_ON = !LIGHTING_ON;
      break;
    case 75: // k -> Zoom the camera out
      cameraX = cameraX + 3;
      break;
    case 72: // i -> Zoom the camera in
      cameraX = cameraX - 3;
      break;
    case 74: // j -> Move camera left
      cameraY = cameraY -3;
      break;
    case 76: // l -> Move camera right
      cameraY = cameraY +3;
      break;
    case 65: // a -> Move car left
      carX = carX - 0.25;
      break;
    case 68: // d -> Move car right
      carX = carX + 0.25;
      break;
    case 54: // 6 -> Open door;
      g_zAngle = 90;
      x= -0.35;
      break;
     case 53: // 5 -> Close door;
     g_zAngle =  0;
     x = 0;
     break;
    default: return; // Skip drawing at no effective action
  }

  // Draw the scene
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, canvas, u_ViewMatrix);
}

function initOctagonVertexBuffers(gl, r, g, b){

  var vertices = new Float32Array([
    1.0, 0.0, 0.0,  0.71, 0.71, 0.0,  0.0, 1.0, 0.0,  -0.71, 0.71, 0.0,
    -1.0, 0.0, 0.0,  -0.71, -0.71, 0.0,  0.0, -1.0, 0.0,  0.71, -0.71, 0.0
  ]);
  var n =8;

  var colors = new Float32Array([
    r, g, b, r, g, b, r, g, b, r, g, b,
    r, g, b, r, g, b, r, g, b, r, g, b
  ]);

  var normals = new Float32Array([
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0
   ]);

   // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2, 3, 4, 5, 6, 7
 ]);

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  
  return indices.length;
}

function initCubeVertexBuffers(gl, r, g, b) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
  ]);


  var colors = new Float32Array([    // Colors
    r, g, b, r, g, b, r, g, b, r, g, b,     // v0-v1-v2-v3 front
    r, g, b, r, g, b, r, g, b, r, g, b,     // v0-v3-v4-v5 right
    r, g, b, r, g, b, r, g, b, r, g, b,     // v0-v5-v6-v1 up
    r, g, b, r, g, b, r, g, b, r, g, b,     // v1-v6-v7-v2 left
    r, g, b, r, g, b, r, g, b, r, g, b,     // v7-v4-v3-v2 down
    r, g, b, r, g, b, r, g, b, r, g, b　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  // Texture Coordinates - front mirrors back
    var textCoords = new Float32Array([
        1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
        0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
        1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
        1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
        0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
        1.0, 0.0,    0.0, 0.0,   0.0, 1.0,   1.0, 1.0   // v4-v7-v6-v5 back
    ]);


  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if(!initArrayBuffer(gl, 'a_TextCoords', textCoords, 2, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer (gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}


function initAxesVertexBuffers(gl) {

  var verticesColors = new Float32Array([
    // Vertex coordinates and color (for axes)
    -20.0,  0.0,   0.0,  1.0,  1.0,  1.0,  // (x,y,z), (r,g,b) 
     20.0,  0.0,   0.0,  1.0,  1.0,  1.0,
     0.0,  20.0,   0.0,  1.0,  1.0,  1.0, 
     0.0, -20.0,   0.0,  1.0,  1.0,  1.0,
     0.0,   0.0, -20.0,  1.0,  1.0,  1.0, 
     0.0,   0.0,  20.0,  1.0,  1.0,  1.0 
  ]);
  var n = 6;

  // Create a buffer object
  var vertexColorBuffer = gl.createBuffer();  
  if (!vertexColorBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  //Get the storage location of a_Position, assign and enable buffer
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  // Get the storage location of a_Position, assign buffer and enable
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return n;
}

//Model matrix helper functions: simulated stack
var g_matrixStack = [];

function pushMatrix(m){ //Store the specified matric to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix(){ // Retrieve the matrix from the array
  return g_matrixStack.pop();
} 

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, canvas, u_ViewMatrix) {


  // Calculate the view matrix and the projection matrix
  viewMatrix.setLookAt(cameraY, 0, cameraX, 0, 0, -100, 0, 1, 0); 
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  // if (INIT_TEXTURE_COUNT < 1){
  //   return; //Don't draw scene until all textures have been loaded
  // }

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1i(u_isLighting, false); // Will not apply lighting

  // Set the vertex coordinates and color (for the x, y axes)

  var n = initAxesVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Calculate the view matrix and the projection matrix
  modelMatrix.setTranslate(0, 0, 0);  // No Translation
  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Draw x and y axes
  gl.drawArrays(gl.LINES, 0, n);

  if(LIGHTING_ON){
    gl.uniform1i(u_isLighting, true); // Will apply lighting
  }else{
    gl.uniform1i(u_isLighting, false); // wont apply lighting
  }



  drawBuilding(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  drawTopWindow(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  drawMiddleWindow(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  drawDoor(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  drawBottomWindow(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  drawBoard(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  drawFloor(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  drawCar(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  drawBench(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

function drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, texture){

  //Texture must be an integer i such that gl.Texturei is used
  if (texture != null && TEXTURES_ON){
    gl.uniform1i(u_Sampler, texture);
    gl.uniform1i(u_UseTextures, true);
  }

  pushMatrix(modelMatrix);

  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

   // Calculate the normal transformation matrix and pass it to u_NormalMatrix
  g_normalMatrix.setInverseOf(modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    // Draw the cube
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();

  //Turn off texture if used
  if(texture != null && TEXTURES_ON){
    gl.uniform1i(u_UseTextures, false);
  }

}

function drawOctagon(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting){
  pushMatrix(modelMatrix);

  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

   // Calculate the normal transformation matrix and pass it to u_NormalMatrix
  g_normalMatrix.setInverseOf(modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

  // Draw the octagon
  gl.drawElements(gl.LINES, n, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();
}

function drawBuilding(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting){
  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setTranslate(0, 0, 0);  // Translation (No translation is supported here)
  modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.scale(1.5, 3.0, 1.0); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 255/256, 255/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0, 1, 1.5);  // Translation (No translation is supported here)
  modelMatrix.scale(1.50, 2.0, 0.5); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 255/256, 255/256, 256/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-1.30, 0.8, 1.9);  // Translation (No translation is supported here)
  modelMatrix.scale(0.20, 1.6, 0.2); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(1.30, 0.8, 1.9);  // Translation (No translation is supported here)
  modelMatrix.scale(0.20, 1.6, 0.2); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 255/256, 255/256, 256/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0, -0.875, 1.9);  // Translation (No translation is supported here)
  modelMatrix.scale(1.50, 0.12, 0.2); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0, 2.95, 2.1);  // Translation (No translation is supported here)
  modelMatrix.scale(1.50, 0.05, 0.2); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0, 2.90, 2.0);  // Translation (No translation is supported here)
  modelMatrix.scale(1.40, 0.10, 0.2); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-1.3, 2.70, 2.0);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.10, 0.1); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-1.16, 2.70, 2.0);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.10, 0.1); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(1.16, 2.70, 2.0);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.10, 0.1); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(1.3, 2.70, 2.0);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.10, 0.1); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0, 2.50, 1.9);  // Translation (No translation is supported here)
  modelMatrix.scale(1.50, 0.01, 0.2); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-1.30, -0.7, 1.95);  // Translation (No translation is supported here)
  modelMatrix.scale(0.20, 0.075, 0.2); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(1.30, -0.7, 1.95);  // Translation (No translation is supported here)
  modelMatrix.scale(0.20, 0.075, 0.2); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-1.30, 2.325, 1.95);  // Translation (No translation is supported here)
  modelMatrix.scale(0.20, 0.075, 0.2); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(1.30, 2.325, 1.95);  // Translation (No translation is supported here)
  modelMatrix.scale(0.20, 0.075, 0.2); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(1.30, -0.55, 1.95);  // Translation (No translation is supported here)
  modelMatrix.scale(0.20, 0.02, 0.2); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-1.30, -0.55, 1.95);  // Translation (No translation is supported here)
  modelMatrix.scale(0.20, 0.02, 0.2); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(1.30, 2.2, 1.95);  // Translation (No translation is supported here)
  modelMatrix.scale(0.20, 0.02, 0.2); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  // Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-1.30, 2.2, 1.95);  // Translation (No translation is supported here)
  modelMatrix.scale(0.20, 0.02, 0.2); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

}

function drawTopWindow(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting){
  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0, 1.7, 2.0);  // Translation (No translation is supported here)
  modelMatrix.scale(0.5, 0.6, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 204/256, 229/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-0.2, 1.7, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.01, 0.6, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.2, 1.7, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.01, 0.6, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate#
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0, 1.7, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.5, 0.01, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0, 2, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.5, 0.01, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.0, 1.4, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.5, 0.01, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.0, 2.35, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.6, 0.05, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.0, 1.05, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.6, 0.05, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
   modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.55, 1.7, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.6, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-0.55, 1.7, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.6, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-0.50, 1.0, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.1, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-0.38, 1.0, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.1, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.50, 1.0, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.1, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.38, 1.0, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.1, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();
}

function drawMiddleWindow(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting){
  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0, 0.1, 2.0);  // Translation (No translation is supported here)
  modelMatrix.scale(0.5, 0.6, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 204/256, 229/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-0.2, 0.1, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.01, 0.6, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
   modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.2, 0.1, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.01, 0.6, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0, 0.1, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.5, 0.01, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0, -0.2, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.5, 0.01, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.0, 0.4, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.5, 0.01, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.0, 0.75, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.6, 0.05, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.0, -0.55, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.6, 0.05, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
   modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.55, 0.1, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.6, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-0.55, 0.1, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.6, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-0.50, -0.60, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.08, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-0.38, -0.6, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.08, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.50, -0.60, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.08, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.38, -0.6, 2.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.08, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 204/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();
}

function drawBottomWindow(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting){
  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.3, -1.7, 1.0);  // Translation (No translation is supported here)
  modelMatrix.scale(0.5, 0.5, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 204/256, 229/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.3, -1.7, 1.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.5, 0.05, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix=popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.3, -1.7, 1.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.5, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 1.0, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix=popMatrix();

}

function drawDoor(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting,){
  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-0.85+x, -2.20, 1.0);  // Translation (No translation is supported here)
  modelMatrix.rotate(g_zAngle, 0, 1, 0); //Rotate along the y axis
  modelMatrix.scale(0.3, 0.80, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 179/256, 80/256, 0.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, 0);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);

  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(-0.85, -1.25, 1.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.3, 0.10, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 204/256, 229/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();
}

function drawBoard(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting){
  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(1.15, -1.7, 1.0);  // Translation (No translation is supported here)
  modelMatrix.scale(0.25, 0.35, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 179/256, 80/256, 0.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(1.15, -1.7, 1.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.15, 0.25, 0.01); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 0.0, 0.0, 0.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

}

function drawFloor(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting){
  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0, -3, 0);  // Translation (No translation is supported here)
  modelMatrix.scale(5, 0, 5); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 102/256, 102/256, 102/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();
}


function drawCar(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting){
  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(3 + carX, -2.325, 3.5);  // Translation (No translation is supported here)
  modelMatrix.scale(0.65, 0.55, 0.55); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 0.0, 0.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(2.0 +carX, -2.55, 3.5);  // Translation (No translation is supported here)
  modelMatrix.scale(0.35, 0.325, 0.55); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 1.0, 0.0, 0.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(2.325 +carX, -2.25, 3.5);  // Translation (No translation is supported here)
  modelMatrix.scale(0.0, 0.4, 0.55); // Scale

  // Set the vertex coordinates and color (for the cube)
  var n = initCubeVertexBuffers(gl, 204/256, 229/256, 1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(3.3 +carX, -2.8, 4.0);  // Translation (No translation is supported here)
  modelMatrix.scale(0.2, 0.2, 0.1); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 0.8, 0.8, 0.8);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(2.1 +carX, -2.8, 4.0);  // Translation (No translation is supported here)
  modelMatrix.scale(0.2, 0.2, 0.1); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 0.8, 0.8, 0.8);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(3.3 +carX, -2.8, 3.0);  // Translation (No translation is supported here)
  modelMatrix.scale(0.2, 0.2, 0.1); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 0.8, 0.8, 0.8);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(2.1 +carX, -2.8, 3.0);  // Translation (No translation is supported here)
  modelMatrix.scale(0.2, 0.2, 0.1); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 0.8, 0.8, 0.8);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(3.3 +carX, -2.8, 4.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.05, 0.1); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 0.0, 0.0, 0.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(2.1 +carX, -2.8, 4.01);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.05, 0.1); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 0.0, 0.0, 0.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(3.3 +carX, -2.8, 2.99);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.05, 0.1); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 0.0, 0.0, 0.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(2.1 +carX, -2.8, 2.99);  // Translation (No translation is supported here)
  modelMatrix.scale(0.05, 0.05, 0.1); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 0.0, 0.0, 0.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(2.7 +carX, -2.0, 4.0);  // Translation (No translation is supported here)
  modelMatrix.scale(0.25, 0.175, 0.1); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 204/256, 229/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(3.3 +carX, -2.0, 4.0);  // Translation (No translation is supported here)
  modelMatrix.scale(0.25, 0.175, 0.1); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 204/256, 229/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(2.7 +carX, -2.0, 2.99);  // Translation (No translation is supported here)
  modelMatrix.scale(0.25, 0.175, 0.1); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 204/256, 229/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(3.3 +carX, -2.0, 2.99);  // Translation (No translation is supported here)
  modelMatrix.scale(0.25, 0.175, 0.1); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 204/256, 229/256, 255/256);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();
}

function drawBench(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting){
  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.45 , -2.5, 1.3);  // Translation (No translation is supported here)
  modelMatrix.scale(0.6, 0.05, 0.2); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 204/256, 102/256, 0.00);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.0 , -2.75, 1.3);  // Translation (No translation is supported here)
  modelMatrix.scale(0.025, 0.27, 0.2); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 204/256, 102/256, 0.00);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.9 , -2.75, 1.3);  // Translation (No translation is supported here)
  modelMatrix.scale(0.025, 0.27, 0.2); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 204/256, 102/256, 0.00);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  //Rotate, and then translate
  modelMatrix.setRotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.translate(0.9 , -2.75, 1.3);  // Translation (No translation is supported here)
  modelMatrix.scale(0.025, 0.27, 0.2); // Scale

  // Set the vertex coordinates and color (for the octagon)
  var n = initCubeVertexBuffers(gl, 204/256, 102/256, 0.00);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  drawBox(gl, n, u_ModelMatrix, u_NormalMatrix, u_isLighting, null);

  modelMatrix = popMatrix();
  }



function initTextures(gl){

  //Get the storage location of u_Sampler
  u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if(!u_Sampler){
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }

  //Setup texture mappings
  createTexture(gl, 'beech.jpeg', gl.TEXTURE0);
  return true;
}

function createTexture(gl, name, id){
   var texture = gl.createTexture();
   if(!texture){
     console.log('Failed to create texture object');
     return false;
   }

   var image = new Image();
   if(!image){
     console.log('Failed to create the image object');
     return false;
   }

   image.crossOrigin = 'anonymous';

   image.onload = function(){
     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); //Flip the image y-axis
     gl.activeTexture(id); //Assign to right texture

     gl.bindTexture(gl.TEXTURE_2D, texture);

     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
     gl.generateMipmap(gl.TEXTURE_2D);

     gl.clear(gl.COLOR_BUFFER_BIT); //Clear color buffer

     INIT_TEXTURE_COUNT++; //make sure all textures are loaded
   };

   image.src = name;

   console.log(image);
}
