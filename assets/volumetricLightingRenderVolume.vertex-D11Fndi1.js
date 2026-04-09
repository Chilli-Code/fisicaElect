import{S as o}from"./main.mobile-3fFU4oR-.js";import"./index-C3ktr2Zr.js";const e="volumetricLightingRenderVolumeVertexShader",r=`#include<__decl__sceneVertex>
#include<__decl__meshVertex>
attribute vec3 position;varying vec4 vWorldPos;void main(void) {vec4 worldPos=world*vec4(position,1.0);vWorldPos=worldPos;gl_Position=viewProjection*worldPos;}
`;o.ShadersStore[e]||(o.ShadersStore[e]=r);const d={name:e,shader:r};export{d as volumetricLightingRenderVolumeVertexShader};
//# sourceMappingURL=volumetricLightingRenderVolume.vertex-D11Fndi1.js.map
