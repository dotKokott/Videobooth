precision mediump float;

uniform sampler2D u_texture;
varying vec2 v_uv;


void main() {
  vec4 color = texture2D(u_texture, v_uv);
  gl_FragColor = vec4(1. - color.rgb, 1.);
}