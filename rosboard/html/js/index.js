"use strict";

importJsOnce("js/viewers/Viewer.js");
importJsOnce("js/viewers/GenericViewer.js");
importJsOnce("js/viewers/LogViewer.js");

let viewersByTopic = {};

let $grid = null;
$(() => {
  $grid = $('.grid').packery({
    itemSelector: '.card',
    gutter: 10,
    percentPosition: true,
  });
});

$(function() {
  let dummy = newCard();
  dummy.title.text("Loading ...");
  setTimeout(() => { dummy.remove() }, 1500);

  rosoutViewer = new LogViewer(newCard());
});

setInterval(() => {
  $grid.packery("reloadItems");
  $grid.packery();
}, 500);

setInterval(() => {
  if(ws.readyState === ws.CLOSED) {
      console.log("attempting to reconnect ...");
      connect();
  }
}, 5000);

function newCard() {
  // creates a new card, adds it to the grid, and returns it.
  let card = $("<div></div>").addClass('card')
    .appendTo($('.grid'));
  card.title = $('<div></div>').addClass('card-title').text('').appendTo(card);
  card.content = $('<div></div>').addClass('card-content').text('').appendTo(card);
  return card;
}

function createWebSocket(path) {
    // creates and returns a websocket with the given path but uses ws for http and wss for https
    var protocolPrefix = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
    return new WebSocket(protocolPrefix + '//' + location.host + path);
}

let ws = null;

function connect() {
    if(ws) {
        ws.onmessage = null;
        ws.close();
    }

    ws = createWebSocket("/socket");

    ws.onopen = function(){
      ws.send("hello world");
      console.log("connected");
    }
    
    ws.onclose = function(){
      console.log("disconnected");
    }

    ws.onmessage = function(wsmsg) {
      let data = JSON.parse(wsmsg.data);
      console.log("ws",data);
      let wsMsgType = data[0];

      if(wsMsgType === "ros_msg") ws.on_ros_msg(data[1]);
    }

    ws.on_ros_msg = function(msg) {
      if(!viewersByTopic[msg._topic_name]) {
          let card = newCard();
          viewersByTopic[msg._topic_name] = new GenericViewer(card);
          $grid.packery("appended", card);
      }
      viewersByTopic[msg._topic_name].update(msg);
    }
}

connect();

