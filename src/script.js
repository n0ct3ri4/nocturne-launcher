const e = require("electron");
const ipc = e.ipcRenderer;
const $ = require("jquery");

function playGame() {
  $("#play").prop("disabled", true);
  var user = $("#user").val();
  var pass = $("#pass").val();

  ipc.send("play", {
    user: user,
    pass: pass,
    version: { number: "1.16.5", type: "release" },
    ram: {
      min: "1G",
      max: "4G",
    },
  });

  ipc.on("launcherOutput", (_event, args) => {
    $(".main").html(args);
  });
}

$(function () {
  ipc.send("checkAccounts");
  ipc.on("accounts", (_event, args) => {
    $("#user").val(args.user);
    $("#pass").val(args.pass);
  });

  window.addEventListener("keydown", (ev) => {
    if (ev.key == "Enter") {
      playGame();
    }
  });

  $("#play").click(playGame);
});
