const fs = require('fs');
const vrmaPath = 'lag_queen.vrma';
const buf = fs.readFileSync(vrmaPath);
const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
const json = JSON.parse(jsonStr);

const mapping = {
  'Hips': 'hips', 'Spine': 'spine', 'Spine1': 'chest', 'Spine2': 'upperChest',
  'Neck': 'neck', 'Head': 'head',
  'LeftShoulder': 'leftShoulder', 'LeftArm': 'leftUpperArm', 'LeftForeArm': 'leftLowerArm', 'LeftHand': 'leftHand',
  'RightShoulder': 'rightShoulder', 'RightArm': 'rightUpperArm', 'RightForeArm': 'rightLowerArm', 'RightHand': 'rightHand',
  'LeftUpLeg': 'leftUpperLeg', 'LeftLeg': 'leftLowerLeg', 'LeftFoot': 'leftFoot',
  'RightUpLeg': 'rightUpperLeg', 'RightLeg': 'rightLowerLeg', 'RightFoot': 'rightFoot',
  'LeftToeBase': 'leftToes', 'RightToeBase': 'rightToes'
};

const humanBones = {};
json.nodes.forEach((node, i) => {
  if (node.name && mapping[node.name]) {
    humanBones[mapping[node.name]] = { node: i };
  }
});

json.extensions = json.extensions || {};
json.extensions.VRMC_vrm_animation = {
  specVersion: '1.0',
  humanoid: { humanBones }
};

const newJsonStr = JSON.stringify(json);
const padding = 4 - (newJsonStr.length % 4);
const paddedJsonStr = newJsonStr + ' '.repeat(padding === 4 ? 0 : padding);

const newJsonLen = Buffer.byteLength(paddedJsonStr);
const binOffset = 20 + jsonLen;
const binLen = buf.length - binOffset;
const binData = buf.slice(binOffset);

const newBuf = Buffer.alloc(20 + newJsonLen + binLen);
buf.copy(newBuf, 0, 0, 12);
newBuf.writeUInt32LE(newJsonLen, 12);
newBuf.writeUInt32LE(0x4E4F534A, 16);
newBuf.write(paddedJsonStr, 20, 'utf8');
binData.copy(newBuf, 20 + newJsonLen);
newBuf.writeUInt32LE(newBuf.length, 8); // update total length

fs.writeFileSync(vrmaPath, newBuf);
console.log('Patched lag_queen.vrma with ' + Object.keys(humanBones).length + ' bones!');
