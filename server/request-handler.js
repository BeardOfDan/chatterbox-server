/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/

var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10 // Seconds.
};

// var messages = [];


// class Message {
//   constructor(message, room = null) {
//     this.content = message;

//     this.room = room;
//   }

//   get() {
//     return this.content;
//   }
// }





class Messages {
  constructor() {
    this.arr = [];
  }

  getMessages() {
    return this.arr;
  }

  getRoom(room) {
    // declare an output array
    var output = [];
    // iterate through this.arr
    this.arr.forEach(function(message) {
      // if message.room === room
      if (message.room === room) {
        //push message into output array
        output.push(message);
      }
    });
    // return output
    return output;
  }

  getUser(userName) {
    // filter by username and return
  }

  // add a new message to the array
  push(message, room) {
    if (room) {
      message.room = room.toString();
    }

    this.arr.push(message);
  }

}

const messages = new Messages();
// messages.arr = [];

// messages.getMessages = function() {
//   let result = [];
  
//   for (let i = 0; i < this.arr.length; i++) {
//     result.push(this.arr[i].get());
//   }

//   return result;
// };



// const getMessages = function() {
//   let result = [];
  
//   for (let i = 0; i < messages.length; i++) {
//     result.push(messages[i].get());
//   }

//   return result;
// };


var requestHandler = function(request, response) {
  // Request and Response come from node's http module.
  //
  // They include information about both the incoming request, such as
  // headers and URL, and about the outgoing response, such as its status
  // and content.
  //
  // Documentation for both request and response can be found in the HTTP section at
  // http://nodejs.org/documentation/api/

  console.log('url', request.url);

  // Do some basic logging.
  //
  // Adding more logging to your server can be an easy way to get passive
  // debugging help, but you should always be careful about leaving stray
  // console.logs in your code.
  console.log('Serving request type ' + request.method + ' for url ' + request.url);

  // The outgoing status.
  var statusCode = 200;

  // See the note below about CORS headers.
  var headers = defaultCorsHeaders;

  // Tell the client we are sending them plain text.
  //
  // You will need to change this if you are sending something
  // other than plain text, like JSON or HTML.
  headers['Content-Type'] = 'text/plain';

  // .writeHead() writes to the request line and headers of the response,
  // which includes the status and all headers.
  // response.writeHead(statusCode, headers);

  // Make sure to always call response.end() - Node may not send
  // anything back to the client until you do. The string you pass to
  // response.end() will be the body of the response - i.e. what shows
  // up in the browser.
  //
  // Calling .end "flushes" the response's internal buffer, forcing
  // node to actually send all the data over to the client.
  // response.end('Hello, World!');

   // req.on('data', function (data) {
   //      body += data;
   //  });

  // console.log('requests', request.url, request.method, '\n\n');


  if (request.method === 'GET') {
    if (request.url === '/classes/messages') {
      response.writeHead(statusCode, headers);
      response.end('' + JSON.stringify({
        results: messages.getMessages()
      }));
    } else if (request.url.slice(0, 9) === '/classes/') {
      let roomName = request.url.slice(9);
      response.writeHead(statusCode, headers);
      response.end('' + JSON.stringify({
        results: messages.getRoom(roomName)
      }));
    } else {
      response.writeHead(404, headers);
      response.end('Page not found: ' + request.url);
    }
  } else if (request.method === 'POST') {
    if (request.url === '/classes/messages') {
      let body = [];
      request.on('data', (chunk) => {
        body.push(chunk);
      });
      request.on('end', () => {
        // body = Buffer.concat(body).toString();
        // at this point, `body` has the entire request body stored in it as a string

        body = body.join('');

        body = JSON.parse(body);

        messages.push(body);
        response.writeHead(201, headers);

        let previousMessages = messages.getMessages();
        previousMessages = previousMessages.slice(0, previousMessages.length - 1);

        response.end('' + JSON.stringify({results: previousMessages}));
      });
      // request.on('data', function(data) {
      //   console.log(data);
      //   messages.push(data);
      //   response.writeHead(201, headers);
      //   response.end('' + JSON.stringify({results: messages}));
      // });
    } else if (request.url.slice(0, 9) === '/classes/') {

      console.log('url', request.url);

      let body = [];
      request.on('data', (chunk) => {
        body.push(chunk);
      });
      request.on('end', () => {
        body = body.join('');
        // at this point, `body` has the entire request body stored in it as a string
        // body = parse
        body = JSON.parse(body);
        // other 3 lines
        messages.push(body, request.url.slice(9));
        response.writeHead(201, headers);
        response.end('' + JSON.stringify({results: messages.getMessages()}));
      });      
    } else {
      response.writeHead(404, headers);
      response.end('Page not found: ' + request.url);
    }
  }
};



// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.

exports.requestHandler = requestHandler;
