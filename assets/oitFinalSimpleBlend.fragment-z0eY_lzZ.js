import{S as r}from"./main.mobile-3fFU4oR-.js";import"./index-C3ktr2Zr.js";const o="oitFinalSimpleBlendPixelShader",e=`precision highp float;uniform sampler2D uFrontColor;void main() {ivec2 fragCoord=ivec2(gl_FragCoord.xy);vec4 frontColor=texelFetch(uFrontColor,fragCoord,0);glFragColor=frontColor;}
`;r.ShadersStore[o]||(r.ShadersStore[o]=e);const t={name:o,shader:e};export{t as oitFinalSimpleBlendPixelShader};
//# sourceMappingURL=oitFinalSimpleBlend.fragment-z0eY_lzZ.js.map
