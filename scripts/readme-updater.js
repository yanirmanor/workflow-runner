module.exports.readVersion = function (contents) {
  const m = contents.match(/workflow-runner-(\d+\.\d+\.\d+)-arm64\.dmg/);
  return m ? m[1] : '0.0.0';
};

module.exports.writeVersion = function (contents, version) {
  return contents
    .replace(/workflow-runner-\d+\.\d+\.\d+-arm64\.dmg/g, `workflow-runner-${version}-arm64.dmg`)
    .replace(/workflow-runner-darwin-arm64-\d+\.\d+\.\d+\.zip/g, `workflow-runner-darwin-arm64-${version}.zip`);
};
