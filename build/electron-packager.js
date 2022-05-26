require("electron-packager")({
  dir: `${__dirname}/../`,
  overwrite: true,
  asar: false,
  icon: `${__dirname}/../assets/icon.ico`,
})
  .then((success) => {
    console.log(success);
  })
  .catch((err) => {
    console.error(err);
  });
