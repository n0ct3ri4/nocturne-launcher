const e = require("electron");
const mc = require("minecraft-launcher-core");
const os = require("os");
const fs = require("fs");
const http = require("http");
const unzipper = require("unzipper");

const client = new mc.Client();
const ipc = e.ipcMain;

const accounts = JSON.parse(
  fs.readFileSync(`${__dirname}/accounts.json`, "utf-8")
);

//? Auto-Updater

function Update() {
  return new Promise((resolve, reject) => {
    fs.readdirSync("resources/app/src").forEach((f) => {
      try {
        fs.rmSync(
          `resources/app/src/${f}`,
          { recursive: true, force: true },
          (err) => {
            if (err) throw err;
          }
        );
      } catch (err) {
        throw err;
      }
    });

    var file = fs.createWriteStream("resources/app/tmp/src.zip");
    http.get("http://kazzookay.site:8080/src.zip", (res) => {
      var piping = res.pipe(file);
      piping.on("finish", () => {
        piping.close();
        console.log("Downloaded. Extracting...");
        var unzipping = unzipper.Extract({ path: "resources/app/src" });
        fs.createReadStream("resources/app/tmp/src.zip").pipe(unzipping);
        unzipping.on("close", () => {
          resolve("Successfully extracted!");
        });
        unzipping.on("error", (err) => {
          reject(err);
        });
      });
    });
  });
}

Update().then(
  (msg) => {
    console.log(msg);

    var win = new e.BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    win.setSize(800, 600, true);
    win.setTitle("Nocturne Launcher");
    win.setIcon(`${__dirname}/assets/icon.png`);
    win.setMenuBarVisibility(false);
    win.center();

    win.loadFile(`${__dirname}/src/index.html`);

    ipc.on("checkAccounts", (_event, args) => {
      if (accounts.user !== undefined) {
        _event.sender.send("accounts", accounts);
      } else {
        return console.log("No accounts yet.");
      }
    });

    ipc.on("play", (_event, args) => {
      console.log("launching");
      //? Launch game with...
      var user = args.user;
      var pass = args.pass;
      var version = args.version;
      var ram = {
        min: args.ram.min,
        max: args.ram.max,
      };

      //? Store username and password (Local ONLY)
      accounts.user = user;
      accounts.pass = pass;
      fs.writeFileSync(`${__dirname}/accounts.json`, JSON.stringify(accounts), {
        encoding: "utf-8",
      });

      //? Verify platform ID to store important files in the correct dirs.
      if (os.platform() == "win32") {
        //? Launching the game.
        client
          .launch({
            authorization: mc.Authenticator.getAuth(user, pass || null), //? Auth with a email and password OR just a username if crack.
            version: version,
            memory: {
              min: ram.min,
              max: ram.max,
            },
            root: `${os
              .homedir()
              .toString()}\\AppData\\Roaming\\.nocturne-launcher`,
            clientPackage: null,
          })
          .then((game) => {
            win.hide();
            //? Store game output
            game.on("close", (code) => {
              console.log(`Closed in state ${code}`);
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nClosed in state ${code}`
              );
              process.exit(0);
            });

            game.on("disconnect", () => {
              console.log("Game is disconnected.");
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGame is disconnected.`
              );
            });

            game.on("error", (err) => {
              console.error(err);
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \n${err}`
              );
            });

            game.on("exit", (code) => {
              console.log(`Exited in state ${code}`);
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nExited in state ${code}`
              );
            });

            game.on("message", (msg) => {
              console.info(msg);
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \n${msg}`
              );
            });

            game.stdout.on("close", () => {
              console.log("GAME : Closed.");
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGAME : Closed.`
              );
              process.exit(0);
            });

            game.stdout.on("data", (chunk) => {
              console.log("GAME :", chunk);
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGAME : ${chunk}`
              );
            });

            game.stdout.on("end", () => {
              console.log("GAME : Ended.");
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGAME : Ended.`
              );
            });

            game.stdout.on("error", (err) => {
              console.log(`GAME : ${err}`);
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGAME : ${err}`
              );
            });

            game.stdout.on("pause", () => {
              console.log("GAME : Paused.");
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGAME : Paused.`
              );
            });

            game.stdout.on("readable", () => {
              console.log("GAME : Readabled.");
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGAME : Readabled.`
              );
            });

            game.stdout.on("resume", () => {
              console.log("GAME : Resumed.");
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGAME : Resumed.`
              );
            });
          })
          .catch((err) => {
            console.log(err);
          });
      } else if (os.platform() == "linux") {
        //? Launching the game.
        client
          .launch({
            authorization: mc.Authenticator.getAuth(user, pass || null), //? Auth with a email and password OR just a username if crack.
            version: version,
            memory: {
              min: ram.min,
              max: ram.max,
            },
            root: `${os.homedir().toString()}\\.nocturne-launcher`,
            clientPackage: null,
          })
          .then((game) => {
            win.hide();
            //? Store game output
            game.on("close", (code) => {
              console.log(`Closed in state ${code}`);
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nClosed in state ${code}`
              );
              process.exit(0);
            });

            game.on("disconnect", () => {
              console.log("Game is disconnected.");
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGame is disconnected.`
              );
            });

            game.on("error", (err) => {
              console.error(err);
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \n${err}`
              );
            });

            game.on("exit", (code) => {
              console.log(`Exited in state ${code}`);
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nExited in state ${code}`
              );
            });

            game.on("message", (msg) => {
              console.info(msg);
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \n${msg}`
              );
            });

            game.stdout.on("close", () => {
              console.log("GAME : Closed.");
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGAME : Closed.`
              );
              process.exit(0);
            });

            game.stdout.on("data", (chunk) => {
              console.log("GAME :", chunk);
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGAME : ${chunk}`
              );
            });

            game.stdout.on("end", () => {
              console.log("GAME : Ended.");
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGAME : Ended.`
              );
            });

            game.stdout.on("error", (err) => {
              console.log(`GAME : ${err}`);
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGAME : ${err}`
              );
            });

            game.stdout.on("pause", () => {
              console.log("GAME : Paused.");
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGAME : Paused.`
              );
            });

            game.stdout.on("readable", () => {
              console.log("GAME : Readabled.");
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGAME : Readabled.`
              );
            });

            game.stdout.on("resume", () => {
              console.log("GAME : Resumed.");
              fs.writeFileSync(
                `${__dirname}/console/game_stdout.log`,
                `${fs.readFileSync(
                  `${__dirname}/console/game_stdout.log`,
                  "utf-8"
                )} \nGAME : Resumed.`
              );
            });
          })
          .catch((err) => {
            console.log(err);
          });
      }

      client.on("arguments", (output) => {
        _event.sender.send("launcherOutput", output);
      });

      client.on("data", (output) => {
        _event.sender.send("launcherOutput", output);
      });

      client.on("package-extract", (output) => {
        _event.sender.send("launcherOutput", output);
      });

      client.on("download", (output) => {
        _event.sender.send("launcherOutput", output);
      });

      client.on("download-status", (output) => {
        _event.sender.send("launcherOutput", output);
      });

      client.on("debug", (output) => {
        _event.sender.send("launcherOutput", output);
      });

      client.on("progresss", (output) => {
        _event.sender.send("launcherOutput", output);
      });
    });
  },
  (err) => {
    throw err;
  }
);
