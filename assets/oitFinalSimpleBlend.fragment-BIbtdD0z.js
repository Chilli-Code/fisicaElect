import{S as o}from"./main.mobile-3fFU4oR-.js";import"./index-C3ktr2Zr.js";const r="oitFinalSimpleBlendPixelShader",t=`var uFrontColor: texture_2d<f32>;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var fragCoord: vec2i=vec2i(fragmentInputs.position.xy);var frontColor: vec4f=textureLoad(uFrontColor,fragCoord,0);fragmentOutputs.color=frontColor;}
`;o.ShadersStoreWGSL[r]||(o.ShadersStoreWGSL[r]=t);const a={name:r,shader:t};export{a as oitFinalSimpleBlendPixelShaderWGSL};
//# sourceMappingURL=oitFinalSimpleBlend.fragment-BIbtdD0z.js.map
