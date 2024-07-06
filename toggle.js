var red = 0;
var green = 1;
var orange = 0;

var timer = null;
var state = "off";

var red_to_green_delay = 1000;
var green_to_red_delay = 3000;
var blink_delay = 500;

var slave_ip = "0.0.0.0";

function green_handler(req, res) {
  console.log("> green_handler");
  Timer.clear(timer);
  switch (state) {
    case "green":
      // nothing
      break;
    case "red":
      Shelly.call("HTTP.GET", {"url": "http://" + slave_ip + "/rpc/Switch.Set?id=" + orange + "&on=true"});
      timer = Timer.set(red_to_green_delay, false, turn_green);
      break;
    case "blink":
      turn_green();
      break;
    case "off":
      Shelly.call("Switch.Set", {"id": green, "on": true}, null);
      break;  
  }

  state = "green";
  
  res.body = state;
  res.send();
}

function turn_green() {
  console.log("> turn_green");
  Shelly.call("Switch.Set", {"id": red, "on": false}, null);
  Shelly.call("HTTP.GET", {"url": "http://" + slave_ip + "/rpc/Switch.Set?id=" + orange + "&on=false"});
  Shelly.call("Switch.Set", {"id": green, "on": true}, null);
}

function red_handler(req, res) {
  console.log("> red_handler");
  Timer.clear(timer);
  switch (state) {
    case "green":
      Shelly.call("Switch.Set", {"id": green, "on": false}, null);
      Shelly.call("HTTP.GET", {"url": "http://" + slave_ip + "/rpc/Switch.Set?id=" + orange + "&on=true"});
      timer = Timer.set(green_to_red_delay, false, turn_red);
      break;
    case "red":
      // nothing
      break;
    case "blink":
      turn_red();
      break;
    case "off":
      Shelly.call("Switch.Set", {"id": red, "on": true}, null);
      break;  
  }

  state = "red";

  res.body = state;
  res.send();
}

function turn_red() {
  console.log("> turn_red");
  Shelly.call("Switch.Set", {"id": red, "on": true}, null);
  Shelly.call("HTTP.GET", {"url": "http://" + slave_ip + "/rpc/Switch.Set?id=" + orange + "&on=false"});
  Shelly.call("Switch.Set", {"id": green, "on": false}, null);
}

function toggle_handler(req, res) {
  console.log("> toggle_handler");
  switch (state) {
    case "off":
      return green_handler(req, res);
    case "green":
      return red_handler(req, res);
    case "red":
      return green_handler(req, res);
    default:
      return green_handler(req, res);
  }
}

function blink_handler(req, res) {
  console.log("> blink_handler");
  Timer.clear(timer);

  Shelly.call("HTTP.GET", {"url": "http://" + slave_ip + "/rpc/Switch.Set?id=" + orange + "&on=false"});
  Shelly.call("Switch.Set", {"id": green, "on": false}, null);
  Shelly.call("Switch.Set", {"id": red, "on": false}, null);

  timer = Timer.set(blink_delay, true, blink);
  state = "blink";

  res.body = state;
  res.send();
}

function blink() {
  console.log("> blink");
  Shelly.call("HTTP.GET", {"url": "http://" + slave_ip + "/rpc/Switch.Toggle?id=" + orange + "&on=false"});
}

function off_handler(req, res) {
  console.log("> off");
  Timer.clear(timer);
  Shelly.call("HTTP.GET", {"url": "http://" + slave_ip + "/rpc/Switch.Set?id=" + orange + "&on=false"});
  Shelly.call("Switch.Set", {"id": green, "on": false}, null);
  Shelly.call("Switch.Set", {"id": red, "on": false}, null);
  state = "off";
  res.body = state;
  res.send();
}

function set_slave_ip_handler(req, res) {
  console.log("> set_slave_ip_handler: " + req.query);
  slave_ip = req.query;
  res.body = slave_ip;
  res.send();
}

HTTPServer.registerEndpoint("setSlaveIp", set_slave_ip_handler);
// HTTPServer.registerEndpoint("green", green_handler);
// HTTPServer.registerEndpoint("red", red_handler);
HTTPServer.registerEndpoint("toggle", toggle_handler);
HTTPServer.registerEndpoint("blink", blink_handler);
HTTPServer.registerEndpoint("off", off_handler);
