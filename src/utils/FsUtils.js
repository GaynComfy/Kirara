const fs = require("fs");

//blocking
exports.readDirectoryRecursiveWithFilter = (baseDir, prefix, predicate) => {
  const elements = [];
  const traverse = (folder) => {
    const items = fs.readdirSync(`${prefix}/${folder}`);
    items.forEach((file) => {
      const path = `${folder}/${file}`;
      if (fs.lstatSync(`${prefix}/${path}`).isDirectory()) {
        traverse(path);
        return;
      }
      if (!predicate) elements.push(path);
      else if (predicate(path)) elements.push(path);
    });
  };
  traverse(baseDir);
  return elements;
};
